import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import AppButton from "../../../components/ui/AppButton";
import AppInput from "../../../components/ui/AppInput";
import AppText from "../../../components/ui/AppText";
import Card from "../../../components/ui/Card";
import { AppColors } from "../../../constants/appColors";
import { USE_REAL_API } from "../../../src/lib/api";
import { ApiWarehouse, createWarehouse, listInventory, listWarehouses } from "../../../src/lib/inventoryApi";
import { useInventory } from "../../../src/store/inventory/InventoryContext";

export default function WarehousesScreen() {
  const router = useRouter();
  const { loading, state, addWarehouse, setLowStockThreshold } = useInventory();
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [threshold, setThreshold] = useState(String(state.lowStockThreshold ?? 5));
  const [apiLoading, setApiLoading] = useState(USE_REAL_API);
  const [apiWarehouses, setApiWarehouses] = useState<ApiWarehouse[]>([]);
  const [apiStats, setApiStats] = useState<Record<number, { items: number; low: number }>>({});

  useFocusEffect(
    useCallback(() => {
      if (!USE_REAL_API) return;
      let active = true;
      setApiLoading(true);
      (async () => {
        try {
          const res = await listWarehouses();
          if (active) setApiWarehouses(res.warehouses);
        } catch {
          if (active) Alert.alert("Error", "Failed to load warehouses.");
        } finally {
          if (active) setApiLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  useEffect(() => {
    if (!USE_REAL_API) return;
    if (apiWarehouses.length === 0) {
      setApiStats({});
      return;
    }
    let mounted = true;
    const lowThreshold = state.lowStockThreshold ?? 5;
    (async () => {
      const stats: Record<number, { items: number; low: number }> = {};
      await Promise.all(
        apiWarehouses.map(async (w) => {
          try {
            const res = await listInventory(w.id);
            const items = res.inventory.length;
            const low = res.inventory.filter((r) => r.quantity > 0 && r.quantity <= lowThreshold).length;
            stats[w.id] = { items, low };
          } catch {
            stats[w.id] = { items: 0, low: 0 };
          }
        })
      );
      if (mounted) setApiStats(stats);
    })();
    return () => {
      mounted = false;
    };
  }, [apiWarehouses, state.lowStockThreshold]);

  const items = useMemo(() => {
    const rows = USE_REAL_API ? apiWarehouses : state.warehouses;
    const query = q.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((w) => (w.name ?? "").toLowerCase().includes(query));
  }, [apiWarehouses, q, state.warehouses]);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <AppButton
          title="New Warehouse"
          onPress={() => {
            setName("");
            setShowAdd(true);
          }}
          style={styles.newBtn}
        />
      </View>

      <View style={styles.searchWrap}>
        <AppInput
          placeholder="Search Warehouse Name"
          value={q}
          onChangeText={setQ}
          style={styles.searchInput}
        />
      </View>

      <Card style={{ marginTop: 12 }}>
        <AppText variant="subtitle">Warehouses</AppText>

        {(USE_REAL_API ? apiLoading : loading) ? (
          <AppText color={AppColors.muted} style={{ marginTop: 10 }}>
            Loading...
          </AppText>
        ) : items.length === 0 ? (
          <AppText color={AppColors.muted} style={{ marginTop: 10 }}>
            No warehouses added yet.
          </AppText>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it) => String(it.id)}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
            renderItem={({ item }) => (
              <Card style={{ marginTop: 10 }}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="subtitle">{item.name}</AppText>
                    <AppText color={AppColors.muted} style={{ marginTop: 4 }}>
                      ID: {String(item.id)}
                    </AppText>
                    <AppText color={AppColors.muted} style={{ marginTop: 4, fontSize: 12 }}>
                      Items:{" "}
                      {USE_REAL_API
                        ? apiStats[item.id as number]?.items ?? 0
                        : state.inventory.filter((r) => r.warehouseId === String(item.id)).length}
                      {" • "}
                      Low stock:{" "}
                      {USE_REAL_API
                        ? apiStats[item.id as number]?.low ?? 0
                        : state.inventory.filter(
                            (r) =>
                              r.warehouseId === String(item.id) &&
                              r.qty > 0 &&
                              r.qty <= (state.lowStockThreshold ?? 5)
                          ).length}
                    </AppText>
                  </View>
                  <AppButton
                    title="Details"
                    onPress={() =>
                      router.push({
                        pathname: "/(seller)/warehouse/[id]",
                        params: { id: String(item.id) },
                      })
                    }
                    style={{ height: 36, borderRadius: 10 }}
                  />
                </View>
              </Card>
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Card>

      {showAdd ? (
        <Card style={{ marginTop: 12 }}>
          <AppText variant="subtitle">Add warehouse</AppText>
          <AppInput label="Warehouse name" value={name} onChangeText={setName} placeholder="Example: Main warehouse" />
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <AppButton
              title="Add"
              onPress={async () => {
                if (!name.trim()) return;
                if (USE_REAL_API) {
                  try {
                    await createWarehouse({ name: name.trim() });
                    const res = await listWarehouses();
                    setApiWarehouses(res.warehouses);
                    setName("");
                    setShowAdd(false);
                  } catch {
                    Alert.alert("Error", "Failed to create warehouse.");
                  }
                } else {
                  addWarehouse(name);
                  setName("");
                  setShowAdd(false);
                }
              }}
              style={{ flex: 1 }}
            />
            <AppButton title="Cancel" variant="outline" onPress={() => setShowAdd(false)} style={{ flex: 1 }} />
          </View>
        </Card>
      ) : null}

      <Card style={{ marginTop: 12 }}>
        <AppText variant="subtitle">Alert settings</AppText>
        <AppInput
          label="Low stock threshold"
          keyboardType="number-pad"
          value={threshold}
          onChangeText={setThreshold}
          placeholder="Example: 5"
        />
        <AppButton
          title="Save"
          variant="outline"
          onPress={() => setLowStockThreshold(parseInt(threshold, 10))}
          style={{ marginTop: 10 }}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background, padding: 16, paddingTop: 24 },
  topRow: { flexDirection: "row", alignItems: "center" },
  newBtn: { height: 40, borderRadius: 12 },
  searchWrap: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 6,
  },
  searchInput: { borderWidth: 0, backgroundColor: "transparent" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
});
