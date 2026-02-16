import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import AppButton from "../../../../components/ui/AppButton";
import AppInput from "../../../../components/ui/AppInput";
import AppText from "../../../../components/ui/AppText";
import Card from "../../../../components/ui/Card";
import { AppColors } from "../../../../constants/appColors";
import { USE_REAL_API } from "../../../../src/lib/api";
import {
  ApiInventory,
  ApiProduct,
  ApiWarehouse,
  addVariant as apiAddVariant,
  adjustInventory,
  listInventory,
  listProducts,
  listWarehouses,
  toNumber,
} from "../../../../src/lib/inventoryApi";
import { useInventory } from "../../../../src/store/inventory/InventoryContext";
import { getVariantTitle } from "../../../../src/store/inventory/models";
import { formatToman } from "../../../../src/utils/format";

export default function ProductDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const productId = params.id ?? "";
  const { loading, state, addVariant, removeVariant, setInventoryQty } = useInventory();
  const [apiLoading, setApiLoading] = useState(USE_REAL_API);
  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [apiWarehouses, setApiWarehouses] = useState<ApiWarehouse[]>([]);
  const [apiInventory, setApiInventory] = useState<Record<number, ApiInventory[]>>({});
  const [draftQty, setDraftQty] = useState<Record<string, string>>({});

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

  const product = useMemo(() => {
    if (USE_REAL_API) {
      return apiProducts.find((p) => String(p.id) === productId) ?? null;
    }
    return state.products.find((p) => p.id === productId) ?? null;
  }, [apiProducts, productId, state.products]);

  const [color, setColor] = useState("");
  const [capacity, setCapacity] = useState("");
  const [warranty, setWarranty] = useState("");
  const [price, setPrice] = useState("");

  const variants = useMemo(() => {
    if (USE_REAL_API) {
      const p = apiProducts.find((x) => String(x.id) === productId);
      return (p?.variants ?? []).map((v) => ({
        id: String(v.id),
        productId,
        attributes: (v.attributes ?? {}) as any,
        priceToman: toNumber(v.price),
        createdAt: v.createdAt ?? new Date().toISOString(),
      }));
    }
    return state.variants.filter((v) => v.productId === productId);
  }, [apiProducts, productId, state.variants]);

  const warehouses = USE_REAL_API
    ? apiWarehouses.map((w) => ({ id: String(w.id), name: w.name, createdAt: w.createdAt ?? "" }))
    : state.warehouses;

  if (!product) {
    return (
      <View style={styles.container}>
        <AppText variant="title">Product not found</AppText>
        <AppText color={AppColors.muted} style={{ marginTop: 8 }}>
          It might have been deleted.
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppText variant="title">{product.name}</AppText>

      <Card style={{ marginTop: 14 }}>
        <AppText variant="subtitle">Add variant</AppText>

        <View style={{ gap: 10, marginTop: 10 }}>
          <AppInput label="Color" value={color} onChangeText={setColor} placeholder="Example: Blue" />
          <AppInput label="Capacity" value={capacity} onChangeText={setCapacity} placeholder="Example: 128GB" />
          <AppInput label="Warranty" value={warranty} onChangeText={setWarranty} placeholder="Example: 18 months" />
          <AppInput
            label="Price (Toman)"
            value={price}
            onChangeText={setPrice}
            keyboardType="number-pad"
            placeholder="Example: 10000000"
          />
        </View>

        <AppButton
          title="Add variant"
          onPress={async () => {
            const attrs = {
              ...(color ? { color } : {}),
              ...(capacity ? { capacity } : {}),
              ...(warranty ? { warranty } : {}),
            };
            if (USE_REAL_API) {
              const pid = Number(productId);
              if (!Number.isFinite(pid)) return;
              const sku = `SKU-${pid}-${Date.now().toString().slice(-6)}`;
              await apiAddVariant(pid, {
                sku,
                price: parseInt(price || "0", 10) || 0,
                attributes: attrs,
              });
              const prodRes = await listProducts();
              setApiProducts(prodRes.products);
            } else {
              addVariant(productId, {
                attributes: attrs,
                priceToman: parseInt(price || "0", 10) || 0,
              });
            }
            setColor("");
            setCapacity("");
            setWarranty("");
            setPrice("");
          }}
          style={{ marginTop: 12 }}
        />
      </Card>

      <Card style={{ marginTop: 12, flex: 1 }}>
        <AppText variant="subtitle">Variants & inventory</AppText>

        {(USE_REAL_API ? apiLoading : loading) ? (
          <AppText color={AppColors.muted} style={{ marginTop: 10 }}>
            Loading...
          </AppText>
        ) : variants.length === 0 ? (
          <AppText color={AppColors.muted} style={{ marginTop: 10 }}>
            No variants added yet.
          </AppText>
        ) : warehouses.length === 0 ? (
          <AppText color={AppColors.muted} style={{ marginTop: 10 }}>
            Create a warehouse first to manage inventory.
          </AppText>
        ) : (
          <FlatList
            data={variants}
            keyExtractor={(it) => it.id}
            contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
            renderItem={({ item }) => (
              <Card style={{ marginTop: 10 }}>
                <AppText variant="subtitle">{getVariantTitle(item)}</AppText>
                <AppText color={AppColors.muted} style={{ marginTop: 6 }}>
                  Price: {formatToman(item.priceToman)}
                </AppText>

                <View style={{ marginTop: 10, gap: 10 }}>
                  {warehouses.map((w) => {
                    const rec = USE_REAL_API
                      ? apiInventory[Number(w.id)]?.find(
                          (r) => String(r.variantId) === item.id
                        )
                      : state.inventory.find((r) => r.warehouseId === w.id && r.variantId === item.id);
                    const current = USE_REAL_API ? rec?.quantity ?? 0 : rec?.qty ?? 0;
                    const draftKey = `${w.id}_${item.id}`;
                    return (
                      <View key={w.id} style={styles.row}>
                        <AppText>{w.name}</AppText>
                        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                          <AppText color={AppColors.muted}>Stock:</AppText>
                          <AppInput
                            style={{ minWidth: 90 }}
                            value={draftQty[draftKey] ?? String(current)}
                            keyboardType="number-pad"
                            onChangeText={(t) => {
                              if (USE_REAL_API) {
                                setDraftQty((p) => ({ ...p, [draftKey]: t }));
                              } else {
                                setInventoryQty(w.id, item.id, parseInt(t || "0", 10) || 0);
                              }
                            }}
                            onEndEditing={async () => {
                              if (!USE_REAL_API) return;
                              const next = parseInt(draftQty[draftKey] || String(current), 10) || 0;
                              const cur = rec?.quantity ?? 0;
                              const delta = next - cur;
                              if (delta === 0) return;
                              try {
                                await adjustInventory({
                                  warehouseId: Number(w.id),
                                  variantId: Number(item.id),
                                  delta,
                                  note: "set from app",
                                });
                                const invRes = await listInventory(Number(w.id));
                                setApiInventory((p) => ({ ...p, [Number(w.id)]: invRes.inventory }));
                                setDraftQty((p) => {
                                  const copy = { ...p };
                                  delete copy[draftKey];
                                  return copy;
                                });
                              } catch {
                                Alert.alert("Error", "Failed to update inventory.");
                              }
                            }}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>

                <AppButton
                  title="Delete variant"
                  variant="outline"
                  onPress={() =>
                    USE_REAL_API
                      ? Alert.alert("Coming soon", "Variant deletion is not enabled in the API yet.")
                      : removeVariant(item.id)
                  }
                  style={{ marginTop: 12 }}
                />
              </Card>
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
