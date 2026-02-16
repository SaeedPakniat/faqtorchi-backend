import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";

import AppButton from "../../../../components/ui/AppButton";
import AppInput from "../../../../components/ui/AppInput";
import AppText from "../../../../components/ui/AppText";
import Card from "../../../../components/ui/Card";
import { AppColors } from "../../../../constants/appColors";
import { ApiError, USE_REAL_API } from "../../../../src/lib/api";
import {
  ApiInventory,
  ApiProduct,
  ApiWarehouse,
  createProduct,
  listInventory,
  listProducts,
  listWarehouses,
  toNumber,
  updateWarehouse,
  deleteWarehouse,
} from "../../../../src/lib/inventoryApi";
import { useInventory } from "../../../../src/store/inventory/InventoryContext";
import { getVariantTitle } from "../../../../src/store/inventory/models";
import { formatToman } from "../../../../src/utils/format";

function formatAttributes(attrs?: Record<string, any> | null) {
  if (!attrs) return "No attributes";
  const parts: string[] = [];
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === "") continue;
    parts.push(`${k}: ${String(v)}`);
  }
  return parts.length ? parts.join(" • ") : "No attributes";
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "P";
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase() || "P";
}

export default function WarehouseDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ? Number(params.id) : NaN;
  const {
    state,
    renameWarehouse,
    removeWarehouse,
    addProduct,
  } = useInventory();

  const [apiWarehouse, setApiWarehouse] = useState<ApiWarehouse | null>(null);
  const [apiInventory, setApiInventory] = useState<ApiInventory[]>([]);
  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [apiLoading, setApiLoading] = useState(USE_REAL_API);
  const [apiError, setApiError] = useState("");

  const editParam = params.edit === "1";
  const [editing, setEditing] = useState(editParam);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [newProductDesc, setNewProductDesc] = useState("");

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
          const [whRes, invRes, prodRes] = await Promise.all([
            listWarehouses(),
            listInventory(id),
            listProducts(),
          ]);
          const wh = whRes.warehouses.find((w) => w.id === id) ?? null;
          if (active) {
            setApiWarehouse(wh);
            setApiInventory(invRes.inventory);
            setApiProducts(prodRes.products);
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
    }, [id]),
  );

  const localWarehouse = useMemo(() => {
    if (USE_REAL_API || !Number.isFinite(id)) return null;
    return (
      state.warehouses.find((w) => String(w.id) === String(params.id)) ?? null
    );
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
    const low = inventoryRows.filter(
      (r) => r.quantity > 0 && r.quantity <= threshold,
    ).length;
    return { items, low };
  }, [inventoryRows, threshold]);

  const productCards = useMemo(() => {
    if (USE_REAL_API) {
      const invByVariant = new Map<number, number>();
      apiInventory.forEach((r) => invByVariant.set(r.variantId, r.quantity));
      return apiProducts.map((p) => {
        const variants = p.variants ?? [];
        const prices = variants
          .map((v) => toNumber(v.price))
          .filter((n) => Number.isFinite(n) && n > 0);
        const priceMin = prices.length ? Math.min(...prices) : 0;
        const priceMax = prices.length ? Math.max(...prices) : 0;
        const stockTotal = variants.reduce(
          (sum, v) => sum + (invByVariant.get(v.id) ?? 0),
          0,
        );
        return {
          id: p.id,
          localId: undefined,
          name: p.name,
          variantsCount: variants.length,
          priceMin,
          priceMax,
          stockTotal,
        };
      });
    }
    const whId = String(params.id);
    return state.products.map((p) => {
      const variants = state.variants.filter((v) => v.productId === p.id);
      const variantIds = new Set(variants.map((v) => v.id));
      const prices = variants
        .map((v) => v.priceToman)
        .filter((n) => Number.isFinite(n) && n > 0);
      const priceMin = prices.length ? Math.min(...prices) : 0;
      const priceMax = prices.length ? Math.max(...prices) : 0;
      const stockTotal = state.inventory
        .filter((r) => r.warehouseId === whId && variantIds.has(r.variantId))
        .reduce((sum, r) => sum + r.qty, 0);
      return {
        id: 0,
        localId: p.id,
        name: p.name,
        variantsCount: variants.length,
        priceMin,
        priceMax,
        stockTotal,
      };
    });
  }, [USE_REAL_API, apiInventory, apiProducts, params.id, state.inventory, state.products, state.variants]);


  const whTitle = USE_REAL_API
    ? apiWarehouse?.name ?? "Warehouse"
    : localWarehouse?.name ?? "Warehouse";

  if (!USE_REAL_API && !localWarehouse) {
    return (
      <View style={styles.container}>
        <AppText variant="title">Warehouse not found</AppText>
        <AppButton
          title="Back"
          variant="outline"
          onPress={() => router.back()}
          style={{ marginTop: 12 }}
        />
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
        <AppButton
          title="Back"
          variant="outline"
          onPress={() => router.back()}
          style={{ marginTop: 12 }}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
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
            <AppInput
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Warehouse name"
            />
            {USE_REAL_API ? (
              <AppInput
                label="Location"
                value={location}
                onChangeText={setLocation}
                placeholder="Optional location"
              />
            ) : null}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <AppButton
                title="Save"
                onPress={async () => {
                  if (!name.trim()) return;
                  if (USE_REAL_API) {
                    try {
                      await updateWarehouse(id, {
                        name: name.trim(),
                        location: location.trim() || null,
                      });
                      const res = await listWarehouses();
                      const wh = res.warehouses.find((w) => w.id === id) ?? null;
                      setApiWarehouse(wh);
                      setEditing(false);
                    } catch (e) {
                      const err = e as ApiError;
                      Alert.alert(
                        "Error",
                        err.message || "Failed to update warehouse.",
                      );
                    }
                  } else if (localWarehouse) {
                    renameWarehouse(String(localWarehouse.id), name.trim());
                    setEditing(false);
                  }
                }}
                style={{ flex: 1 }}
              />
              <AppButton
                title="Cancel"
                variant="outline"
                onPress={() => setEditing(false)}
                style={{ flex: 1 }}
              />
            </View>
          </>
        ) : (
          <AppButton
            title="Edit"
            variant="outline"
            onPress={() => setEditing(true)}
            style={{ marginTop: 8 }}
          />
        )}
      </Card>

      <Card style={{ marginTop: 12 }}>
        <AppText variant="subtitle">Products & inventory</AppText>
        <AppText color={AppColors.muted} style={{ marginTop: 6 }}>
          Manage products, variants, stock, and discounts for this warehouse.
        </AppText>

        <View style={{ marginTop: 12, gap: 10 }}>
          <AppInput
            label="New product name"
            value={newProductName}
            onChangeText={setNewProductName}
            placeholder="Example: iPhone 15"
          />
          <AppInput
            label="Description (optional)"
            value={newProductDesc}
            onChangeText={setNewProductDesc}
            placeholder="Optional description"
          />
          <AppButton
            title="Add product"
            onPress={async () => {
              const trimmed = newProductName.trim();
              if (!trimmed) return;
              try {
                if (USE_REAL_API) {
                  await createProduct({
                    name: trimmed,
                    description: newProductDesc.trim() || undefined,
                  });
                  const prodRes = await listProducts();
                  setApiProducts(prodRes.products);
                } else {
                  addProduct(trimmed);
                }
                setNewProductName("");
                setNewProductDesc("");
              } catch (e) {
                const err = e as ApiError;
                Alert.alert("Error", err.message || "Failed to create product.");
              }
            }}
          />
        </View>

        <View style={{ marginTop: 16, gap: 12 }}>
          {productCards.length === 0 ? (
            <AppText color={AppColors.muted}>No products added yet.</AppText>
          ) : (
            productCards.map((product) => {
              const idParam = USE_REAL_API
                ? String(product.id)
                : String(product.localId ?? product.id);
              return (
                <Pressable
                  key={idParam}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/warehouses/product/[id]",
                      params: { id: idParam },
                    })
                  }
                >
                  <Card style={{ padding: 12 }}>
                    <View style={styles.productRow}>
                      <View style={styles.productAvatar}>
                        <AppText>{getInitials(product.name)}</AppText>
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppText variant="subtitle">{product.name}</AppText>
                        <AppText color={AppColors.muted} style={{ marginTop: 4 }}>
                          {product.variantsCount} variants • Stock {product.stockTotal}
                        </AppText>
                        <AppText color={AppColors.muted} style={{ marginTop: 2 }}>
                          {product.priceMin === product.priceMax
                            ? `Price: ${formatToman(product.priceMin)}`
                            : `Price: ${formatToman(product.priceMin)} - ${formatToman(
                                product.priceMax,
                              )}`}
                        </AppText>
                      </View>
                      <AppButton
                        title="Details"
                        variant="outline"
                        onPress={() =>
                          router.push({
                            pathname: "/(tabs)/warehouses/product/[id]",
                            params: { id: idParam },
                          })
                        }
                      />
                    </View>
                  </Card>
                </Pressable>
              );
            })
          )}
        </View>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <AppText variant="subtitle">Danger zone</AppText>
        <AppButton
          title="Delete warehouse"
          variant="outline"
          onPress={() =>
            Alert.alert(
              "Delete warehouse",
              "Are you sure? Inventory for this warehouse will be removed too.",
              [
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
                      Alert.alert(
                        "Error",
                        err.message || "Failed to delete warehouse.",
                      );
                    }
                  },
                },
              ],
            )
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  productAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
});
