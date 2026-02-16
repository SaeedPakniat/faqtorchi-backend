import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import AppButton from "../../../components/ui/AppButton";
import AppInput from "../../../components/ui/AppInput";
import AppText from "../../../components/ui/AppText";
import Card from "../../../components/ui/Card";
import { AppColors } from "../../../constants/appColors";
import { ApiError, apiPost, USE_REAL_API } from "../../../src/lib/api";
import { getExchangeRate } from "../../../src/lib/exchangeRateApi";
import { getBaseCurrency, getNotificationSettings } from "../../../src/lib/sellerSettingsApi";
import { notifyNow } from "../../../src/notifications/localNotifications";
import {
  ApiInventory,
  ApiProduct,
  ApiWarehouse,
  listInventory,
  listProducts,
  listWarehouses,
  toNumber,
} from "../../../src/lib/inventoryApi";
import { useAuth } from "../../../src/store/auth/AuthContext";
import { useInventory } from "../../../src/store/inventory/InventoryContext";
import { useInvoices } from "../../../src/store/invoices/InvoicesContext";
import type { CurrencyCode, InvoiceItem } from "../../../src/store/invoices/models";

type CartRow = { variantId: string; qty: string };

type CartViewRow = {
  variantId: string;
  title: string;
  priceToman: number;
  stock: number;
  qty: string;
};

function formatAttributes(attrs?: Record<string, string | undefined>) {
  if (!attrs) return "";
  const entries = Object.entries(attrs).filter(([, v]) =>
    String(v ?? "").trim(),
  );
  if (!entries.length) return "";
  return entries.map(([k, v]) => `${k}: ${String(v ?? "")}`).join(" • ");
}

export default function WarehouseInvoiceScreen() {
  const router = useRouter();
  const { auth } = useAuth();
  const { addInvoice } = useInvoices();
  const { state, adjustInventoryQty, loading: invLoading } = useInventory();
  const [apiLoading, setApiLoading] = useState(USE_REAL_API);
  const [apiWarehouses, setApiWarehouses] = useState<ApiWarehouse[]>([]);
  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [apiInventory, setApiInventory] = useState<ApiInventory[]>([]);

  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("IRR");
  const [exchangeRateToToman, setExchangeRateToToman] = useState<number | null>(null);
  const [exchangeRateUpdatedAt, setExchangeRateUpdatedAt] = useState<string>("");
  const [exchangeRateError, setExchangeRateError] = useState("");
  const [exchangeRateLoading, setExchangeRateLoading] = useState(false);

  useEffect(() => {
    if (!USE_REAL_API) return;
    let mounted = true;
    (async () => {
      try {
        const res = await getBaseCurrency();
        if (mounted) setCurrency(res.baseCurrency as CurrencyCode);
      } catch {
        // ignore and keep default
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  const [warehouseId, setWarehouseId] = useState<string>(
    state.warehouses[0]?.id ?? "",
  );
  const [cart, setCart] = useState<CartRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const warehousesForSelect = USE_REAL_API
    ? apiWarehouses.map((w) => ({ id: String(w.id), name: w.name }))
    : state.warehouses;

  useEffect(() => {
    if (!USE_REAL_API) return;
    let mounted = true;
    (async () => {
      try {
        const [prodRes, whRes] = await Promise.all([
          listProducts(),
          listWarehouses(),
        ]);
        if (!mounted) return;
        setApiProducts(prodRes.products);
        setApiWarehouses(whRes.warehouses);
        if (!warehouseId && whRes.warehouses[0]) {
          setWarehouseId(String(whRes.warehouses[0].id));
        }
      } finally {
        if (mounted) setApiLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!USE_REAL_API || !warehouseId) return;
    let mounted = true;
    (async () => {
      const invRes = await listInventory(Number(warehouseId));
      if (mounted) setApiInventory(invRes.inventory);
    })();
    return () => {
      mounted = false;
    };
  }, [warehouseId]);

  useEffect(() => {
    let mounted = true;
    async function loadRate() {
      if (currency !== "USD" && currency !== "EUR") {
        setExchangeRateToToman(null);
        setExchangeRateUpdatedAt("");
        setExchangeRateError("");
        return;
      }
      setExchangeRateLoading(true);
      setExchangeRateError("");
      try {
        const res = await getExchangeRate({ base: currency, quote: "IRT" });
        if (!mounted) return;
        setExchangeRateToToman(res.rate.rate);
        setExchangeRateUpdatedAt(res.rate.fetchedAt ?? "");
      } catch (e) {
        if (!mounted) return;
        const err = e as ApiError;
        setExchangeRateError(err.message || "Failed to fetch exchange rate");
        setExchangeRateToToman(null);
        setExchangeRateUpdatedAt("");
      } finally {
        if (mounted) setExchangeRateLoading(false);
      }
    }
    loadRate();
    return () => {
      mounted = false;
    };
  }, [currency]);

  const variantsInWarehouse = useMemo(() => {
    const wh = warehouseId;
    if (!wh) return [];

    if (USE_REAL_API) {
      const qtyByVariant = new Map<number, number>();
      apiInventory.forEach((r) => qtyByVariant.set(r.variantId, r.quantity));

      const variants = apiProducts.flatMap((p) =>
        p.variants.map((v) => ({
          ...v,
          productName: p.name,
        })),
      );

      return variants
        .map((v) => {
          const qty = qtyByVariant.get(v.id) ?? 0;
          return {
            variantId: String(v.id),
            productName: v.productName ?? "(Product)",
            attributesText: formatAttributes(v.attributes as any),
            priceToman: toNumber(v.price),
            stock: qty,
          };
        })
        .filter((x) => x.stock > 0)
        .sort((a, b) => a.productName.localeCompare(b.productName));
    }

    const qtyByVariant = new Map<string, number>();
    state.inventory
      .filter((r) => r.warehouseId === wh)
      .forEach((r) => qtyByVariant.set(r.variantId, r.qty));

    return state.variants
      .map((v) => {
        const product = state.products.find((p) => p.id === v.productId);
        const qty = qtyByVariant.get(v.id) ?? 0;

        return {
          variantId: v.id,
          productName: product?.name ?? "(Product)",
          attributesText: formatAttributes(v.attributes),
          priceToman: v.priceToman,
          stock: qty,
        };
      })
      .filter((x) => x.stock > 0)
      .sort((a, b) => a.productName.localeCompare(b.productName));
  }, [apiInventory, apiProducts, state.inventory, state.products, state.variants, warehouseId]);

  const cartView = useMemo((): CartViewRow[] => {
    const wh = warehouseId;

    if (USE_REAL_API) {
      const stockMap = new Map<string, number>();
      apiInventory.forEach((r) => stockMap.set(String(r.variantId), r.quantity));

      const variants = apiProducts.flatMap((p) =>
        p.variants.map((v) => ({ ...v, productName: p.name })),
      );

      const mapped = cart.map((row) => {
        const v = variants.find((x) => String(x.id) === row.variantId);
        if (!v) return null;
        const attrs = formatAttributes(v.attributes as any);
        const stock = stockMap.get(row.variantId) ?? 0;

        return {
          variantId: row.variantId,
          title: `${v.productName ?? "(Product)"}${attrs ? " — " + attrs : ""}`,
          priceToman: toNumber(v.price),
          stock,
          qty: row.qty,
        } satisfies CartViewRow;
      });

      return mapped.filter((x): x is CartViewRow => x !== null);
    }

    const stockMap = new Map<string, number>();
    state.inventory
      .filter((r) => r.warehouseId === wh)
      .forEach((r) => stockMap.set(r.variantId, r.qty));

    const mapped = cart.map((row) => {
      const v = state.variants.find((x) => x.id === row.variantId);
      if (!v) return null;

      const p = state.products.find((x) => x.id === v.productId);
      const attrs = formatAttributes(v.attributes);
      const stock = stockMap.get(row.variantId) ?? 0;

      return {
        variantId: row.variantId,
        title: `${p?.name ?? "(Product)"}${attrs ? " — " + attrs : ""}`,
        priceToman: v.priceToman,
        stock,
        qty: row.qty,
      } satisfies CartViewRow;
    });

    return mapped.filter((x): x is CartViewRow => x !== null);
  }, [apiInventory, apiProducts, cart, state.inventory, state.products, state.variants, warehouseId]);

  const totals = useMemo(() => {
    const items = cartView
      .map((x) => ({ ...x, qtyN: Number(x.qty) }))
      .filter((x) => Number.isFinite(x.qtyN) && x.qtyN > 0);

    const total = items.reduce((s, x) => s + x.qtyN * x.priceToman, 0);
    return { total, items };
  }, [cartView]);

  const canSubmit = useMemo(() => {
    if (!auth.phone) return false;
    if (USE_REAL_API ? apiLoading : invLoading) return false;
    if (!warehouseId) return false;
    if (!customerPhone.trim()) return false;
    if (!totals.items.length) return false;

    return totals.items.every(
      (x) => x.qtyN > 0 && x.qtyN <= x.stock && x.priceToman > 0,
    );
  }, [auth.phone, customerPhone, invLoading, totals.items, warehouseId]);

  function addToCart(variantId: string) {
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.variantId === variantId);
      if (idx !== -1) {
        const copy = prev.slice();
        const cur = Number(copy[idx].qty) || 1;
        copy[idx] = { ...copy[idx], qty: String(cur + 1) };
        return copy;
      }
      return [...prev, { variantId, qty: "1" }];
    });
  }

  async function onSubmit() {
    if (!canSubmit || !auth.phone) return;

    setSubmitting(true);
    try {
      if (USE_REAL_API) {
        // re-check stocks right before commit
        const stockMap = new Map<string, number>();
        apiInventory.forEach((r) => stockMap.set(String(r.variantId), r.quantity));

        for (const row of totals.items) {
          const cur = stockMap.get(row.variantId) ?? 0;
          if (row.qtyN > cur) {
            Alert.alert("Insufficient stock", `${row.title}\nCurrent stock: ${cur}`);
            return;
          }
        }

        const res = await apiPost<{ invoice: { id: number } }>(
          "/invoices/warehouse",
          {
            warehouseId: Number(warehouseId),
            currency,
            customerName: customerName.trim() || undefined,
            customerPhone: customerPhone.trim(),
            items: totals.items.map((row) => ({
              variantId: Number(row.variantId),
              quantity: row.qtyN,
              description: row.title,
            })),
          },
        );

        const invRes = await listInventory(Number(warehouseId));
        setApiInventory(invRes.inventory);

        try {
          const settings = await getNotificationSettings();
          if (settings.notifyInvoiceIssued) {
            await notifyNow({
              title: "Invoice created",
              body: `Invoice #${res.invoice.id} issued.`,
              channelId: "invoice-reminders",
            });
          }
        } catch {
          // ignore notification errors
        }

        Alert.alert("Saved", "Warehouse invoice created.");
        router.replace({
          pathname: "/(seller)/invoices/[id]",
          params: { id: String(res.invoice.id) },
        });
      } else {
        // re-check stocks right before commit
        const wh = warehouseId;
        const stockMap = new Map<string, number>();
        state.inventory
          .filter((r) => r.warehouseId === wh)
          .forEach((r) => stockMap.set(r.variantId, r.qty));

        for (const row of totals.items) {
          const cur = stockMap.get(row.variantId) ?? 0;
          if (row.qtyN > cur) {
            Alert.alert("Insufficient stock", `${row.title}\nCurrent stock: ${cur}`);
            return;
          }
        }

        // 1) deduct inventory
        totals.items.forEach((row) => {
          adjustInventoryQty(wh, row.variantId, -row.qtyN);
        });

        // 2) create invoice (items WITHOUT id; provider generates id)
        const itemsPayload: Omit<InvoiceItem, "id">[] = totals.items.map(
          (row) => ({
            name: row.title,
            qty: row.qtyN,
            unitPrice: row.priceToman,
          }),
        );

        const invoice = await addInvoice({
          kind: "warehouse",
          warehouseId: wh,
          sellerPhone: auth.phone,
          customerPhone: customerPhone.trim(),
          customerName: customerName.trim() || undefined,
          currency,
          exchangeRateToToman:
            exchangeRateToToman && (currency === "USD" || currency === "EUR")
              ? exchangeRateToToman
              : undefined,
          items: itemsPayload,
        });

        Alert.alert("Saved", "Warehouse invoice created and stock reduced.");
        router.replace({
          pathname: "/(seller)/invoices/[id]",
          params: { id: invoice.id },
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <AppText variant="title">Warehouse invoice</AppText>

      <Card style={{ marginTop: 16 }}>
        <AppText variant="subtitle">Select warehouse</AppText>
        {warehousesForSelect.length ? (
          <View style={{ marginTop: 10 }}>
            {warehousesForSelect.map((w) => {
              const active = w.id === warehouseId;
              return (
                <AppButton
                  key={w.id}
                  title={active ? `✓ ${w.name}` : w.name}
                  variant={active ? "primary" : "outline"}
                  onPress={() => setWarehouseId(w.id)}
                  style={{ marginTop: 8 }}
                />
              );
            })}
          </View>
        ) : (
          <AppText color={AppColors.muted} style={{ marginTop: 8 }}>
            No warehouses yet. Create one in the Warehouse tab.
          </AppText>
        )}
      </Card>

      <Card style={{ marginTop: 12 }}>
        <AppText variant="subtitle">Customer info</AppText>
        <AppInput
          label="Phone number"
          value={customerPhone}
          keyboardType="phone-pad"
          onChangeText={setCustomerPhone}
          placeholder="Example: 0912..."
        />
        <AppInput
          label="Name (optional)"
          value={customerName}
          onChangeText={setCustomerName}
          placeholder="Customer name"
        />
      </Card>

      <Card style={{ marginTop: 12 }}>
        <AppText variant="subtitle">Currency</AppText>
        <View style={[styles.row, { marginTop: 8 }]}>
          <AppButton
            title="IRR"
            variant={currency === "IRR" ? "primary" : "outline"}
            onPress={() => setCurrency("IRR")}
            style={{ flex: 1, marginRight: 6 }}
          />
          <AppButton
            title="IRT"
            variant={currency === "IRT" ? "primary" : "outline"}
            onPress={() => setCurrency("IRT")}
            style={{ flex: 1, marginHorizontal: 3 }}
          />
          <AppButton
            title="USD"
            variant={currency === "USD" ? "primary" : "outline"}
            onPress={() => setCurrency("USD")}
            style={{ flex: 1, marginHorizontal: 3 }}
          />
          <AppButton
            title="EUR"
            variant={currency === "EUR" ? "primary" : "outline"}
            onPress={() => setCurrency("EUR")}
            style={{ flex: 1, marginLeft: 6 }}
          />
        </View>

        {(currency === "USD" || currency === "EUR") && (
          <View style={{ marginTop: 8 }}>
            {!!exchangeRateError && (
              <AppText color={AppColors.danger} style={{ fontSize: 12 }}>
                {exchangeRateError}
              </AppText>
            )}
            {!exchangeRateError && exchangeRateLoading && (
              <AppText color={AppColors.muted} style={{ fontSize: 12 }}>
                Fetching latest exchange rate…
              </AppText>
            )}
            {!exchangeRateError && !exchangeRateLoading && exchangeRateToToman && (
              <AppText color={AppColors.muted} style={{ fontSize: 12 }}>
                1 {currency} ≈ {exchangeRateToToman.toLocaleString()} Toman
                {!!exchangeRateUpdatedAt && (
                  <>
                    {" "}
                    • Updated: {new Date(exchangeRateUpdatedAt).toLocaleString()}
                  </>
                )}
              </AppText>
            )}
          </View>
        )}
      </Card>

      <Card style={{ marginTop: 12 }}>
        <AppText variant="subtitle">Available products</AppText>
        <AppText color={AppColors.muted} style={{ marginTop: 6, fontSize: 12 }}>
          Tap a product to add it to the invoice. (Multiple taps increase quantity)
        </AppText>

        {variantsInWarehouse.length ? (
          <View style={{ marginTop: 10 }}>
            {variantsInWarehouse.map((v) => (
              <View key={v.variantId} style={{ marginTop: 10 }}>
                <AppButton
                  title={`${v.productName}${v.attributesText ? " — " + v.attributesText : ""}  |  Stock: ${v.stock}`}
                  variant="outline"
                  onPress={() => addToCart(v.variantId)}
                />
              </View>
            ))}
          </View>
        ) : (
          <AppText color={AppColors.muted} style={{ marginTop: 10 }}>
            No in-stock products for this warehouse.
          </AppText>
        )}
      </Card>

      <Card style={{ marginTop: 12 }}>
        <View style={styles.row}>
          <AppText variant="subtitle">Invoice items</AppText>
          <AppText color={AppColors.muted}>
            {totals.total
              ? currency === "USD" || currency === "EUR"
                ? exchangeRateToToman
                  ? `${(totals.total / exchangeRateToToman).toFixed(2)} ${currency} • ${totals.total.toLocaleString()} Toman`
                  : `${totals.total.toLocaleString()} Toman`
                : `${totals.total.toLocaleString()} ${currency}`
              : ""}
          </AppText>
        </View>
        {totals.total > 0 && (currency === "USD" || currency === "EUR") && exchangeRateToToman && (
          <AppText color={AppColors.muted} style={{ marginTop: 6, fontSize: 12 }}>
            Total: {(totals.total / exchangeRateToToman).toFixed(2)} {currency}
          </AppText>
        )}

        {cartView.length ? (
          cartView.map((row, idx) => (
            <View key={row.variantId} style={{ marginTop: 12 }}>
              <AppText>{row.title}</AppText>
              <AppText color={AppColors.muted} style={{ marginTop: 2, fontSize: 12 }}>
                Line total:{" "}
                {currency === "USD" || currency === "EUR"
                  ? exchangeRateToToman
                    ? `${((row.priceToman * (Number(row.qty) || 0)) / exchangeRateToToman).toFixed(2)} ${currency} • ${(row.priceToman * (Number(row.qty) || 0)).toLocaleString()} Toman`
                    : `${(row.priceToman * (Number(row.qty) || 0)).toLocaleString()} Toman`
                  : `${(row.priceToman * (Number(row.qty) || 0)).toLocaleString()} ${currency}`}
              </AppText>
              <AppText
                color={AppColors.muted}
                style={{ marginTop: 4, fontSize: 12 }}
              >
                Unit price:{" "}
                {currency === "USD" || currency === "EUR"
                  ? exchangeRateToToman
                    ? `${(row.priceToman / exchangeRateToToman).toFixed(2)} ${currency} • ${row.priceToman.toLocaleString()} Toman`
                    : `${row.priceToman.toLocaleString()} Toman`
                  : `${row.priceToman.toLocaleString()} ${currency}`}{" "}
                • Stock: {row.stock}
              </AppText>

              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  marginTop: 8,
                  alignItems: "flex-end",
                }}
              >
                <View style={{ flex: 1 }}>
                  <AppInput
                    label="Quantity"
                    value={row.qty}
                    keyboardType="number-pad"
                    onChangeText={(v) =>
                      setCart((p) =>
                        p.map((x) =>
                          x.variantId === row.variantId ? { ...x, qty: v } : x,
                        ),
                      )
                    }
                    placeholder="1"
                  />
                </View>
                <View style={{ width: 120 }}>
                  <AppButton
                    title="Remove"
                    variant="outline"
                    onPress={() =>
                      setCart((p) =>
                        p.filter((x) => x.variantId !== row.variantId),
                      )
                    }
                  />
                </View>
              </View>

              {idx !== cartView.length - 1 && <View style={styles.divider} />}
            </View>
          ))
        ) : (
          <AppText color={AppColors.muted} style={{ marginTop: 10 }}>
            Nothing selected yet.
          </AppText>
        )}
      </Card>

      <AppButton
        title={submitting ? "Submitting..." : "Create invoice & reduce stock"}
        onPress={onSubmit}
        disabled={!canSubmit || submitting}
        style={{ marginTop: 16 }}
      />
      <AppButton
        title="Cancel"
        variant="outline"
        onPress={() => router.back()}
        style={{ marginTop: 10 }}
      />

      {!canSubmit && (
        <AppText
          color={AppColors.muted}
          style={{ marginTop: 12, fontSize: 12 }}
        >
          Note: To create an invoice, select a warehouse, enter a customer, and
          make sure quantities do not exceed stock.
        </AppText>
      )}
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
  divider: { height: 1, backgroundColor: AppColors.border, marginTop: 12 },
});
