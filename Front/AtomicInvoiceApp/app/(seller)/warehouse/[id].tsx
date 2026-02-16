import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

import AppButton from "../../../components/ui/AppButton";
import AppInput from "../../../components/ui/AppInput";
import AppText from "../../../components/ui/AppText";
import Card from "../../../components/ui/Card";
import { AppColors } from "../../../constants/appColors";
import { ApiError, USE_REAL_API } from "../../../src/lib/api";
import { ApiInventory, ApiWarehouse, deleteWarehouse, listInventory, listWarehouses, updateWarehouse, toNumber } from "../../../src/lib/inventoryApi";
import { useInventory } from "../../../src/store/inventory/InventoryContext";
import { getVariantTitle } from "../../../src/store/inventory/models";
import { formatToman } from "../../../src/utils/format";

function formatAttributes(attrs?: Record<string, any> | null) {
  if (!attrs) return "No attributes";
  const parts: string[] = [];
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === "") continue;
    parts.push(`${k}: ${String(v)}`);
  }
  return parts.length ? parts.join(" • ") : "No attributes";
}

export default function WarehouseDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ? Number(params.id) : NaN;
  const { state, renameWarehouse, removeWarehouse } = useInventory();

  const [apiWarehouse, setApiWarehouse] = useState<ApiWarehouse | null>(null);
  const [apiInventory, setApiInventory] = useState<ApiInventory[]>([]);
  const [apiLoading, setApiLoading] = useState(USE_REAL_API);
  const [apiError, setApiError] = useState("");

  const editParam = params.edit === "1";
  const [editing, setEditing] = useState(editParam);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    if (editParam) setEditing(true);
  }, [editParam]);

  useFocusEffect(
    useCallback(() => {
      if (!USE_REAL_API || !Number.isFinite(id)) return;
      let active = true;
      setApiLoading(true);
      setApiError("");

      (async () => {
        try {
          const [whRes, invRes] = await Promise.all([listWarehouses(), listInventory(id)]);
          const wh = whRes.warehouses.find((w) => w.id === id) ?? null;
          if (active) {
            setApiWarehouse(wh);
            setApiInventory(invRes.inventory);
            setName(wh?.name ?? "");
            setLocation(wh?.location ?? "");
          }
        } catch (e) {
          const err = e as ApiError;
          if (active) setApiError(err.message || "Failed to load warehouse");
        } finally {
          if (active) setApiLoading(false);
        }
      })();

      return () => {
        active = false;
      };
    }, [id])
  );

  const localWarehouse = useMemo(() => {
    if (USE_REAL_API || !Number.isFinite(id)) return null;
    return state.warehouses.find((w) => String(w.id) === String(params.id)) ?? null;
  }, [params.id, state.warehouses]);

  const inventoryRows = useMemo(() => {
    if (USE_REAL_API) {
      return apiInventory.map((row) => ({
        id: row.id,
        quantity: row.quantity,
        productName: row.variant?.product?.name ?? "Product",
        sku: row.variant?.sku ?? "SKU",
        attributes: row.variant?.attributes ?? null,
        priceToman: toNumber(row.variant?.price),
      }));
    }
    if (!localWarehouse) return [];
    const whId = String(localWarehouse.id);
    return state.inventory
      .filter((r) => r.warehouseId === whId)
      .map((r) => {
        const v = state.variants.find((x) => x.id === r.variantId);
        const p = v ? state.products.find((x) => x.id === v.productId) : undefined;
        return {
          id: r.warehouseId + "_" + r.variantId,
          quantity: r.qty,
          productName: p?.name ?? "Product",
          sku: "SKU",
          attributes: v?.attributes ?? null,
          priceToman: v?.priceToman ?? 0,
          variantTitle: v ? getVariantTitle(v) : "No attributes",
        };
      });
  }, [apiInventory, localWarehouse, state.inventory, state.products, state.variants]);

  const threshold = state.lowStockThreshold ?? 5;
  const stats = useMemo(() => {
    const items = inventoryRows.length;
    const low = inventoryRows.filter((r) => r.quantity > 0 && r.quantity <= threshold).length;
    return { items, low };
  }, [inventoryRows, threshold]);

  const whTitle = USE_REAL_API ? apiWarehouse?.name ?? "Warehouse" : localWarehouse?.name ?? "Warehouse";

  if (!USE_REAL_API && !localWarehouse) {
    return (
      <View style={styles.container}>
        <AppText variant="title">Warehouse not found</AppText>
        <AppButton title="Back" variant="outline" onPress={() => router.back()} style={{ marginTop: 12 }} />
      </View>
    );
  }

  if (USE_REAL_API && apiLoading) {
    return (
      <View style={styles.container}>
        <AppText color={AppColors.muted}>Loading...</AppText>
      </View>
    );
  }

  if (USE_REAL_API && apiError) {
    return (
      <View style={styles.container}>
        <AppText color={AppColors.danger}>{apiError}</AppText>
        <AppButton title="Back" variant="outline" onPress={() => router.back()} style={{ marginTop: 12 }} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
      <AppText variant="title">{whTitle}</AppText>

      <Card style={{ marginTop: 12 }}>
        <AppText variant="subtitle">Summary</AppText>
        <AppText color={AppColors.muted} style={{ marginTop: 6 }}>
          Items: {stats.items} • Low stock: {stats.low}
        </AppText>
        {USE_REAL_API && (
          <AppText color={AppColors.muted} style={{ marginTop: 6 }}>
            Location: {apiWarehouse?.location || "—"}
          </AppText>
        )}
      </Card>

      <Card style={{ marginTop: 12 }}>
        <AppText variant="subtitle">Edit warehouse</AppText>
        {editing ? (
          <>
            <AppInput label="Name" value={name} onChangeText={setName} placeholder="Warehouse name" />
            {USE_REAL_API ? (
              <AppInput label="Location" value={location} onChangeText={setLocation} placeholder="Optional location" />
            ) : null}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <AppButton
                title="Save"
                onPress={async () => {
                  if (!name.trim()) return;
                  if (USE_REAL_API) {
                    try {
                      await updateWarehouse(id, { name: name.trim(), location: location.trim() || null });
                      const res = await listWarehouses();
                      const wh = res.warehouses.find((w) => w.id === id) ?? null;
                      setApiWarehouse(wh);
                      setEditing(false);
                    } catch (e) {
                      const err = e as ApiError;
                      Alert.alert("Error", err.message || "Failed to update warehouse.");
                    }
                  } else if (localWarehouse) {
                    renameWarehouse(String(localWarehouse.id), name.trim());
                    setEditing(false);
                  }
                }}
                style={{ flex: 1 }}
              />
              <AppButton title="Cancel" variant="outline" onPress={() => setEditing(false)} style={{ flex: 1 }} />
            </View>
          </>
        ) : (
          <AppButton title="Edit" variant="outline" onPress={() => setEditing(true)} style={{ marginTop: 8 }} />
        )}
      </Card>

      <Card style={{ marginTop: 12 }}>
        <AppText variant="subtitle">Inventory</AppText>
        {inventoryRows.length === 0 ? (
          <AppText color={AppColors.muted} style={{ marginTop: 6 }}>
            No inventory in this warehouse.
          </AppText>
        ) : (
          inventoryRows.map((row) => (
            <View key={String(row.id)} style={{ marginTop: 10 }}>
              <View style={styles.row}>
                <AppText>{row.productName}</AppText>
                <AppText color={AppColors.muted}>Stock: {row.quantity}</AppText>
              </View>
              <AppText color={AppColors.muted} style={{ marginTop: 4 }}>
                {USE_REAL_API
                  ? `${row.sku} • ${formatAttributes(row.attributes)} • ${formatToman(row.priceToman)}`
                  : `${row.variantTitle ?? "No attributes"} • ${formatToman(row.priceToman)}`}
              </AppText>
            </View>
          ))
        )}
      </Card>

      <Card style={{ marginTop: 12 }}>
        <AppText variant="subtitle">Danger zone</AppText>
        <AppButton
          title="Delete warehouse"
          variant="outline"
          onPress={() =>
            Alert.alert("Delete warehouse", "Are you sure? Inventory for this warehouse will be removed too.", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                  try {
                    if (USE_REAL_API) {
                      await deleteWarehouse(id);
                    } else if (localWarehouse) {
                      removeWarehouse(String(localWarehouse.id));
                    }
                    router.back();
                  } catch (e) {
                    const err = e as ApiError;
                    Alert.alert("Error", err.message || "Failed to delete warehouse.");
                  }
                },
              },
            ])
          }
          style={{ marginTop: 8 }}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
