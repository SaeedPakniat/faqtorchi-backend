import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import AppButton from "../../../../components/ui/AppButton";
import AppInput from "../../../../components/ui/AppInput";
import AppText from "../../../../components/ui/AppText";
import Card from "../../../../components/ui/Card";
import { AppColors } from "../../../../constants/appColors";
import { USE_REAL_API } from "../../../../src/lib/api";
import {
  ApiProductDiscount,
  createProductDiscount,
  deleteProductDiscount,
  listProductDiscounts,
  updateProductDiscount,
} from "../../../../src/lib/productDiscountApi";
import { getNotificationSettings } from "../../../../src/lib/sellerSettingsApi";
import { notifyNow } from "../../../../src/notifications/localNotifications";
import {
  ApiInventory,
  ApiProduct,
  ApiWarehouse,
  addVariant as apiAddVariant,
  adjustInventory,
  listInventory,
  listInventoryLedger,
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
  const { loading, state, addVariant, removeVariant, setInventoryQty } =
    useInventory();
  const [apiLoading, setApiLoading] = useState(USE_REAL_API);
  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [apiWarehouses, setApiWarehouses] = useState<ApiWarehouse[]>([]);
  const [apiInventory, setApiInventory] = useState<Record<number, ApiInventory[]>>({});
  const [draftQty, setDraftQty] = useState<Record<string, string>>({});
  const [ledgerInvId, setLedgerInvId] = useState<number | null>(null);
  const [ledgerRows, setLedgerRows] = useState<any[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [apiDiscounts, setApiDiscounts] = useState<ApiProductDiscount[]>([]);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [productDiscountType, setProductDiscountType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [productDiscountValue, setProductDiscountValue] = useState("");
  const [productDiscountActive, setProductDiscountActive] = useState(true);
  const [productDiscountStartsAt, setProductDiscountStartsAt] = useState("");
  const [productDiscountEndsAt, setProductDiscountEndsAt] = useState("");
  const [variantDiscountDrafts, setVariantDiscountDrafts] = useState<
    Record<
      string,
      {
        id?: number;
        type: "PERCENT" | "FIXED";
        value: string;
        isActive: boolean;
        startsAt?: string;
        endsAt?: string;
      }
    >
  >({});

  const refreshDiscounts = async () => {
    if (!USE_REAL_API || !productId) return;
    try {
      setDiscountLoading(true);
      const res = await listProductDiscounts({ productId: Number(productId) });
      setApiDiscounts(res.discounts ?? []);
    } finally {
      setDiscountLoading(false);
    }
  };

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

  useEffect(() => {
    if (!USE_REAL_API || !productId) return;
    let mounted = true;
    (async () => {
      try {
        setDiscountLoading(true);
        const res = await listProductDiscounts({ productId: Number(productId) });
        if (!mounted) return;
        setApiDiscounts(res.discounts ?? []);
      } finally {
        if (mounted) setDiscountLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [productId]);

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

  const productDiscount = useMemo(
    () => apiDiscounts.find((d) => !d.variantId),
    [apiDiscounts],
  );

  useEffect(() => {
    if (!productDiscount) return;
    setProductDiscountType(productDiscount.type);
    setProductDiscountValue(String(productDiscount.value ?? ""));
    setProductDiscountActive(productDiscount.isActive);
    setProductDiscountStartsAt(productDiscount.startsAt ?? "");
    setProductDiscountEndsAt(productDiscount.endsAt ?? "");
  }, [productDiscount]);

  useEffect(() => {
    if (!USE_REAL_API) return;
    const next: Record<
      string,
      { id?: number; type: "PERCENT" | "FIXED"; value: string; isActive: boolean; startsAt?: string; endsAt?: string }
    > = {};
    for (const v of variants) {
      const d = apiDiscounts.find((x) => String(x.variantId) === String(v.id));
      next[String(v.id)] = {
        id: d?.id,
        type: d?.type ?? "PERCENT",
        value: d?.value != null ? String(d.value) : "",
        isActive: d?.isActive ?? true,
        startsAt: d?.startsAt ?? "",
        endsAt: d?.endsAt ?? "",
      };
    }
    setVariantDiscountDrafts(next);
  }, [apiDiscounts, variants, USE_REAL_API]);

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <AppText variant="title">{product.name}</AppText>

      <Card style={{ marginTop: 14 }}>
        <AppText variant="subtitle">Add variant</AppText>

        <View style={{ gap: 10, marginTop: 10 }}>
          <AppInput
            label="Color"
            value={color}
            onChangeText={setColor}
            placeholder="Example: Blue"
          />
          <AppInput
            label="Capacity"
            value={capacity}
            onChangeText={setCapacity}
            placeholder="Example: 128GB"
          />
          <AppInput
            label="Warranty"
            value={warranty}
            onChangeText={setWarranty}
            placeholder="Example: 18 months"
          />
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

      {USE_REAL_API && (
        <Card style={{ marginTop: 12 }}>
          <AppText variant="subtitle">Product discount</AppText>
          {discountLoading && (
            <AppText color={AppColors.muted} style={{ marginTop: 6 }}>
              Loading discounts...
            </AppText>
          )}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <AppButton
              title="PERCENT"
              variant={productDiscountType === "PERCENT" ? "primary" : "outline"}
              onPress={() => setProductDiscountType("PERCENT")}
              style={{ flex: 1, height: 34 }}
            />
            <AppButton
              title="FIXED"
              variant={productDiscountType === "FIXED" ? "primary" : "outline"}
              onPress={() => setProductDiscountType("FIXED")}
              style={{ flex: 1, height: 34 }}
            />
          </View>
          <AppInput
            label="Value"
            value={productDiscountValue}
            onChangeText={setProductDiscountValue}
            placeholder="10"
            keyboardType="number-pad"
            style={{ marginTop: 10 }}
          />
          <AppInput
            label="Starts At (YYYY-MM-DD)"
            value={productDiscountStartsAt}
            onChangeText={setProductDiscountStartsAt}
            placeholder="2026-02-14"
            style={{ marginTop: 10 }}
          />
          <AppInput
            label="Ends At (YYYY-MM-DD)"
            value={productDiscountEndsAt}
            onChangeText={setProductDiscountEndsAt}
            placeholder="2026-03-14"
            style={{ marginTop: 10 }}
          />
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <AppButton
              title={productDiscountActive ? "Active" : "Inactive"}
              variant={productDiscountActive ? "primary" : "outline"}
              onPress={() => setProductDiscountActive((v) => !v)}
              style={{ flex: 1, height: 34 }}
            />
            <AppButton
              title={productDiscount ? "Update" : "Create"}
              onPress={async () => {
                const value = parseInt(productDiscountValue || "0", 10) || 0;
                if (!value) return;
                if (productDiscount?.id) {
                  await updateProductDiscount(productDiscount.id, {
                    productId: Number(productId),
                    type: productDiscountType,
                    value,
                    isActive: productDiscountActive,
                    startsAt: productDiscountStartsAt || undefined,
                    endsAt: productDiscountEndsAt || undefined,
                  });
                } else {
                  await createProductDiscount({
                    productId: Number(productId),
                    type: productDiscountType,
                    value,
                    isActive: productDiscountActive,
                    startsAt: productDiscountStartsAt || undefined,
                    endsAt: productDiscountEndsAt || undefined,
                  });
                }
                await refreshDiscounts();
              }}
              style={{ flex: 1, height: 34 }}
            />
          </View>
          {productDiscount?.id && (
            <AppButton
              title="Remove product discount"
              variant="outline"
              onPress={async () => {
                await deleteProductDiscount(productDiscount.id);
                await refreshDiscounts();
              }}
              style={{ marginTop: 10, height: 34 }}
            />
          )}
        </Card>
      )}

      <Card style={{ marginTop: 12 }}>
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
          <View style={{ marginTop: 10 }}>
            {variants.map((item) => (
              <Card key={item.id} style={{ marginTop: 10 }}>
                <AppText variant="subtitle">{getVariantTitle(item)}</AppText>
                <AppText color={AppColors.muted} style={{ marginTop: 6 }}>
                  Price: {formatToman(item.priceToman)}
                </AppText>

                <View style={{ marginTop: 10, gap: 10 }}>
                  {warehouses.map((w) => {
                    const rec = USE_REAL_API
                      ? apiInventory[Number(w.id)]?.find(
                          (r) => String(r.variantId) === item.id,
                        )
                      : state.inventory.find(
                          (r) => r.warehouseId === w.id && r.variantId === item.id,
                        );
                    const current = USE_REAL_API ? rec?.quantity ?? 0 : rec?.qty ?? 0;
                    const draftKey = `${w.id}_${item.id}`;
                    return (
                      <View key={w.id} style={styles.row}>
                        <AppText>{w.name}</AppText>
                        <View
                          style={{
                            flexDirection: "row",
                            gap: 10,
                            alignItems: "center",
                          }}
                        >
                          <AppText color={AppColors.muted}>Stock:</AppText>
                          <AppInput
                            style={{ minWidth: 90 }}
                            value={draftQty[draftKey] ?? String(current)}
                            keyboardType="number-pad"
                            onChangeText={(t) => {
                              if (USE_REAL_API) {
                                setDraftQty((p) => ({ ...p, [draftKey]: t }));
                              } else {
                                setInventoryQty(
                                  w.id,
                                  item.id,
                                  parseInt(t || "0", 10) || 0,
                                );
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
                                try {
                                  const settings = await getNotificationSettings();
                                  if (settings.notifyLowStock && next <= settings.lowStockThreshold) {
                                    await notifyNow({
                                      title: "Low stock alert",
                                      body: `${product.name} is low in ${w.name} (stock: ${next}).`,
                                      channelId: "invoice-reminders",
                                    });
                                  }
                                } catch {
                                  // ignore notification errors
                                }
                              } catch {
                                Alert.alert("Error", "Failed to update inventory.");
                              }
                            }}
                          />
                          {USE_REAL_API && rec?.id ? (
                            <AppButton
                              title={ledgerInvId === rec.id ? "Hide" : "History"}
                              variant="outline"
                              onPress={async () => {
                                if (ledgerInvId === rec.id) {
                                  setLedgerInvId(null);
                                  setLedgerRows([]);
                                  return;
                                }
                                try {
                                  setLedgerLoading(true);
                                  setLedgerInvId(rec.id);
                                  const res = await listInventoryLedger(rec.id);
                                  setLedgerRows(res.ledger ?? []);
                                } catch {
                                  Alert.alert("Error", "Failed to load history.");
                                } finally {
                                  setLedgerLoading(false);
                                }
                              }}
                              style={{ height: 30, borderRadius: 8 }}
                            />
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>

                {USE_REAL_API &&
                  ledgerInvId &&
                  ledgerRows.length > 0 &&
                  warehouses.some((w) =>
                    apiInventory[Number(w.id)]?.some(
                      (r) => r.id === ledgerInvId && String(r.variantId) === item.id,
                    ),
                  ) && (
                  <Card style={{ marginTop: 10, padding: 10 }}>
                    <AppText variant="subtitle">Inventory History</AppText>
                    {ledgerLoading ? (
                      <AppText color={AppColors.muted} style={{ marginTop: 6 }}>
                        Loading...
                      </AppText>
                    ) : (
                      <View style={{ marginTop: 8, gap: 6 }}>
                        {ledgerRows.map((r: any) => (
                          <AppText key={r.id} color={AppColors.muted} style={{ fontSize: 12 }}>
                            {r.changeType} • {r.delta} •{" "}
                            {r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}{" "}
                            {r.note ? `• ${r.note}` : ""}
                          </AppText>
                        ))}
                      </View>
                    )}
                  </Card>
                )}

                {USE_REAL_API && variantDiscountDrafts[item.id] && (
                  <Card style={{ marginTop: 10, padding: 10 }}>
                    <AppText variant="subtitle">Variant discount</AppText>
                    <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                      <AppButton
                        title="PERCENT"
                        variant={
                          variantDiscountDrafts[item.id].type === "PERCENT"
                            ? "primary"
                            : "outline"
                        }
                        onPress={() =>
                          setVariantDiscountDrafts((p) => ({
                            ...p,
                            [item.id]: { ...p[item.id], type: "PERCENT" },
                          }))
                        }
                        style={{ flex: 1, height: 34 }}
                      />
                      <AppButton
                        title="FIXED"
                        variant={
                          variantDiscountDrafts[item.id].type === "FIXED"
                            ? "primary"
                            : "outline"
                        }
                        onPress={() =>
                          setVariantDiscountDrafts((p) => ({
                            ...p,
                            [item.id]: { ...p[item.id], type: "FIXED" },
                          }))
                        }
                        style={{ flex: 1, height: 34 }}
                      />
                    </View>
                    <AppInput
                      label="Value"
                      value={variantDiscountDrafts[item.id].value}
                      onChangeText={(t) =>
                        setVariantDiscountDrafts((p) => ({
                          ...p,
                          [item.id]: { ...p[item.id], value: t },
                        }))
                      }
                      placeholder="10"
                      keyboardType="number-pad"
                      style={{ marginTop: 10 }}
                    />
                    <AppInput
                      label="Starts At (YYYY-MM-DD)"
                      value={variantDiscountDrafts[item.id].startsAt || ""}
                      onChangeText={(t) =>
                        setVariantDiscountDrafts((p) => ({
                          ...p,
                          [item.id]: { ...p[item.id], startsAt: t },
                        }))
                      }
                      placeholder="2026-02-14"
                      style={{ marginTop: 10 }}
                    />
                    <AppInput
                      label="Ends At (YYYY-MM-DD)"
                      value={variantDiscountDrafts[item.id].endsAt || ""}
                      onChangeText={(t) =>
                        setVariantDiscountDrafts((p) => ({
                          ...p,
                          [item.id]: { ...p[item.id], endsAt: t },
                        }))
                      }
                      placeholder="2026-03-14"
                      style={{ marginTop: 10 }}
                    />
                    <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                      <AppButton
                        title={
                          variantDiscountDrafts[item.id].isActive ? "Active" : "Inactive"
                        }
                        variant={
                          variantDiscountDrafts[item.id].isActive ? "primary" : "outline"
                        }
                        onPress={() =>
                          setVariantDiscountDrafts((p) => ({
                            ...p,
                            [item.id]: {
                              ...p[item.id],
                              isActive: !p[item.id].isActive,
                            },
                          }))
                        }
                        style={{ flex: 1, height: 34 }}
                      />
                      <AppButton
                        title={variantDiscountDrafts[item.id].id ? "Update" : "Create"}
                        onPress={async () => {
                          const draft = variantDiscountDrafts[item.id];
                          const value = parseInt(draft.value || "0", 10) || 0;
                          if (!value) return;
                          if (draft.id) {
                            await updateProductDiscount(draft.id, {
                              productId: Number(productId),
                              variantId: Number(item.id),
                              type: draft.type,
                              value,
                              isActive: draft.isActive,
                              startsAt: draft.startsAt || undefined,
                              endsAt: draft.endsAt || undefined,
                            });
                          } else {
                            await createProductDiscount({
                              productId: Number(productId),
                              variantId: Number(item.id),
                              type: draft.type,
                              value,
                              isActive: draft.isActive,
                              startsAt: draft.startsAt || undefined,
                              endsAt: draft.endsAt || undefined,
                            });
                          }
                          await refreshDiscounts();
                        }}
                        style={{ flex: 1, height: 34 }}
                      />
                    </View>
                    {variantDiscountDrafts[item.id].id && (
                      <AppButton
                        title="Remove variant discount"
                        variant="outline"
                        onPress={async () => {
                          await deleteProductDiscount(variantDiscountDrafts[item.id].id!);
                          await refreshDiscounts();
                        }}
                        style={{ marginTop: 10, height: 34 }}
                      />
                    )}
                  </Card>
                )}

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
            ))}
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    padding: 16,
    paddingTop: 24,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
