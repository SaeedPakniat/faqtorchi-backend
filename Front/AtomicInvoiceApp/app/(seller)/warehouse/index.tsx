import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import AppButton from "../../../components/ui/AppButton";
import AppText from "../../../components/ui/AppText";
import Card from "../../../components/ui/Card";
import { AppColors } from "../../../constants/appColors";
import { USE_REAL_API } from "../../../src/lib/api";
import {
  ApiInventory,
  ApiProduct,
  ApiWarehouse,
  listInventory,
  listProducts,
  listWarehouses,
  toNumber,
} from "../../../src/lib/inventoryApi";
import { useInventory } from "../../../src/store/inventory/InventoryContext";
import { getVariantTitle } from "../../../src/store/inventory/models";
import { formatToman } from "../../../src/utils/format";

export default function SellerWarehouseHome() {
  const router = useRouter();
  const { loading, state } = useInventory();
  const [apiLoading, setApiLoading] = useState(USE_REAL_API);
  const [apiWarehouses, setApiWarehouses] = useState<ApiWarehouse[]>([]);
  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [apiInventory, setApiInventory] = useState<Record<number, ApiInventory[]>>({});

  useEffect(() => {
    if (!USE_REAL_API) return;
    let mounted = true;
    (async () => {
      try {
        const [prodRes, whRes] = await Promise.all([listProducts(), listWarehouses()]);
        if (!mounted) return;
        setApiProducts(prodRes.products);
        setApiWarehouses(whRes.warehouses);

        const invMap: Record<number, ApiInventory[]> = {};
        await Promise.all(
          whRes.warehouses.map(async (w) => {
            const invRes = await listInventory(w.id);
            invMap[w.id] = invRes.inventory;
          })
        );
        if (mounted) setApiInventory(invMap);
      } finally {
        if (mounted) setApiLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const lowStock = useMemo(() => {
    if (USE_REAL_API) {
      if (apiLoading) return [];
      const threshold = state.lowStockThreshold ?? 5;
      const productById = new Map(apiProducts.map((p) => [String(p.id), p]));
      const variants = apiProducts.flatMap((p) =>
        p.variants.map((v) => ({
          ...v,
          productId: String(p.id),
          productName: p.name,
        }))
      );
      const variantById = new Map(variants.map((v) => [String(v.id), v]));
      const whById = new Map(apiWarehouses.map((w) => [String(w.id), w]));

      const inventoryRows = Object.entries(apiInventory).flatMap(([whId, rows]) =>
        rows.map((r) => ({ ...r, warehouseId: Number(whId) }))
      );

      return inventoryRows
        .filter((r) => r.quantity > 0 && r.quantity <= threshold)
        .map((r) => {
          const v = variantById.get(String(r.variantId));
          if (!v) return null;
          const w = whById.get(String(r.warehouseId));
          return {
            key: `${r.warehouseId}_${r.variantId}`,
            warehouseName: w?.name ?? "Warehouse",
            productName: v.productName ?? "Product",
            variantTitle: getVariantTitle({
              id: String(v.id),
              productId: String(v.productId),
              attributes: (v.attributes ?? {}) as any,
              priceToman: toNumber(v.price),
              createdAt: v.createdAt ?? "",
            }),
            qty: r.quantity,
            priceToman: toNumber(v.price),
          };
        })
        .filter(Boolean) as any[];
    }

    if (loading) return [];
    const threshold = state.lowStockThreshold ?? 5;

    // Build helper maps
    const productById = new Map(state.products.map((p) => [p.id, p]));
    const variantById = new Map(state.variants.map((v) => [v.id, v]));
    const whById = new Map(state.warehouses.map((w) => [w.id, w]));

    return state.inventory
      .filter((r) => r.qty > 0 && r.qty <= threshold)
      .map((r) => {
        const v = variantById.get(r.variantId);
        if (!v) return null;
        const p = productById.get(v.productId);
        const w = whById.get(r.warehouseId);
        return {
          key: `${r.warehouseId}_${r.variantId}`,
          warehouseName: w?.name ?? "Warehouse",
          productName: p?.name ?? "Product",
          variantTitle: getVariantTitle(v),
          qty: r.qty,
          priceToman: v.priceToman,
        };
      })
      .filter(Boolean) as any[];
  }, [apiInventory, apiLoading, apiProducts, apiWarehouses, loading, state]);

  return (
    <View style={styles.container}>
      <AppText variant="title">Warehouse</AppText>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        <AppButton title="Warehouses" variant="outline" onPress={() => router.push("/(seller)/warehouse/warehouses")} />
        <AppButton title="Products" onPress={() => router.push("/(seller)/warehouse/products")} />
      </View>

      <Card style={{ marginTop: 14 }}>
        <AppText variant="subtitle">Low stock alerts</AppText>
        <AppText color={AppColors.muted} style={{ marginTop: 6 }}>
          Alert threshold: {state.lowStockThreshold ?? 5} units
        </AppText>

        {(USE_REAL_API ? apiLoading : loading) ? (
          <AppText color={AppColors.muted} style={{ marginTop: 10 }}>
            Loading...
          </AppText>
        ) : lowStock.length === 0 ? (
          <AppText color={AppColors.muted} style={{ marginTop: 10 }}>
            No low stock alerts.
          </AppText>
        ) : (
          <FlatList
            data={lowStock}
            keyExtractor={(it) => it.key}
            renderItem={({ item }) => (
              <View style={{ marginTop: 10 }}>
                <View style={styles.row}>
                  <AppText>{item.productName}</AppText>
                  <AppText color={AppColors.muted}>Stock: {item.qty}</AppText>
                </View>
                <AppText color={AppColors.muted} style={{ marginTop: 4 }}>
                  {item.warehouseName} • {item.variantTitle} • {formatToman(item.priceToman)}
                </AppText>
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background, padding: 16, paddingTop: 24 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
