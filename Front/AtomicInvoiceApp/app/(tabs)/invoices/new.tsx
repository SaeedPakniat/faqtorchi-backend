// app/(tabs)/invoices/new.tsx
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";

import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppText from "@/components/ui/AppText";
import Card from "@/components/ui/Card";
import { AppColors } from "@/constants/appColors";
import { ApiError, apiPost, USE_REAL_API } from "@/src/lib/api";
import { getExchangeRate } from "@/src/lib/exchangeRateApi";
import { getBaseCurrency, getNotificationSettings } from "@/src/lib/sellerSettingsApi";
import { notifyNow } from "@/src/notifications/localNotifications";
import { useAuth } from "@/src/store/auth/AuthContext";
import { useInventory } from "@/src/store/inventory/InventoryContext";
import { useInvoices } from "@/src/store/invoices/InvoicesContext";
import type { CurrencyCode } from "@/src/store/invoices/models";

type DraftItem = { name: string; qty: string; unitPrice: string };

export default function NewInvoiceScreen() {
  const router = useRouter();
  const { auth } = useAuth();
  const { addInvoice, addPayment } = useInvoices();
  const { state: inventoryState } = useInventory();

  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [items, setItems] = useState<DraftItem[]>([
    { name: "", qty: "1", unitPrice: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
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

  // ✅ warehouse selection
  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  const [showWarehousePicker, setShowWarehousePicker] = useState(false);

  // ✅ attach payment (optional)
  const [attachPayment, setAttachPayment] = useState(false);
  const [payCurrency, setPayCurrency] = useState<CurrencyCode>("IRR");
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");

  const canSubmit = useMemo(() => {
    if (!auth.phone) return false;
    if (!customerPhone.trim()) return false;

    const parsed = items
      .map((it) => ({
        name: it.name.trim(),
        qty: Number(it.qty),
        unitPrice: Number(it.unitPrice),
      }))
      .filter((x) => x.name);

    if (!parsed.length) return false;
    if (!parsed.every((x) => x.qty > 0 && x.unitPrice > 0)) return false;

    if (attachPayment) {
      const n = Number(payAmount);
      if (!Number.isFinite(n) || n <= 0) return false;
    }

    return true;
  }, [auth.phone, customerPhone, items, attachPayment, payAmount]);

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

  useEffect(() => {
    if (currency === "USD" || currency === "EUR") {
      setPayCurrency(currency);
    }
  }, [currency]);

  const selectedWarehouseName = useMemo(() => {
    if (!warehouseId) return "Select";
    return (
      inventoryState.warehouses.find((w) => w.id === warehouseId)?.name ??
      "Select"
    );
  }, [warehouseId, inventoryState.warehouses]);

  async function onSubmit() {
    if (!canSubmit || !auth.phone) return;

    setSubmitting(true);
    try {
      if (USE_REAL_API) {
        const res = await apiPost<{ invoice: { id: number } }>(
          "/invoices/instant",
          {
            currency,
            customerName: customerName.trim() || undefined,
            customerPhone: customerPhone.trim(),
            extra:
              exchangeRateToToman && (currency === "USD" || currency === "EUR")
                ? { exchangeRateToToman }
                : undefined,
            items: items
              .map((it) => ({
                description: it.name.trim(),
                quantity: Number(it.qty),
                unitPrice: Number(it.unitPrice),
              }))
              .filter((x) => x.description),
          },
        );
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
        router.replace({
          pathname: "/(tabs)/invoices/[id]",
          params: { id: String(res.invoice.id) },
        });
      } else {
        const invoice = await addInvoice({
          sellerPhone: auth.phone,
          customerPhone: customerPhone.trim(),
          customerName: customerName.trim() || undefined,
          currency,
          exchangeRateToToman:
            exchangeRateToToman && (currency === "USD" || currency === "EUR")
              ? exchangeRateToToman
              : undefined,

          // ✅ اگر انبار انتخاب شد، فاکتور warehouse حسابش کن
          kind: warehouseId ? "warehouse" : "regular",
          warehouseId: warehouseId || undefined,

          items: items
            .map((it) => ({
              name: it.name.trim(),
              qty: Number(it.qty),
              unitPrice: Number(it.unitPrice),
            }))
            .filter((x) => x.name),
        });

        // ✅ (اختیاری) وصل کردن پرداخت همینجا
        if (attachPayment) {
          await addPayment(invoice.id, {
            amount: Number(payAmount),
            currency: payCurrency,
            note: payNote?.trim() || undefined,
          });
        }

        router.replace({
          pathname: "/(tabs)/invoices/[id]",
          params: { id: invoice.id },
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Title Row (Back + Title) */}
      <View style={styles.titleRow}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backBtn}
        >
          <Image
            source={require("../../assets/icons/common/back.png")}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </Pressable>

        <AppText style={styles.pageTitle}>Create Invoice</AppText>
      </View>

      <Card style={{ marginTop: 14 }}>
        <AppText variant="subtitle">Customer</AppText>

        <AppInput
          label="Phone Number"
          value={customerPhone}
          keyboardType="phone-pad"
          onChangeText={setCustomerPhone}
          placeholder="e.g. 0912..."
          style={{ marginTop: 10 }}
        />

        <AppInput
          label="Name (optional)"
          value={customerName}
          onChangeText={setCustomerName}
          placeholder="Customer name"
          style={{ marginTop: 10 }}
        />
      </Card>

      <Card style={{ marginTop: 12 }}>
        <AppText variant="subtitle">Currency</AppText>
        <View style={[styles.currencyRow, { marginTop: 8 }]}>
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

      {!USE_REAL_API && (
        <Card style={{ marginTop: 12 }}>
          <AppText variant="subtitle">Warehouse (optional)</AppText>

          <Pressable
            onPress={() => setShowWarehousePicker(true)}
            style={styles.selector}
          >
            <AppText style={styles.selectorText}>
              {selectedWarehouseName}
            </AppText>

            <Image
              // TODO: مسیر آیکن رو خودت ست کن
              source={require("../../assets/icons/common/chevron-down.png")}
              style={styles.selectorIcon}
              resizeMode="contain"
            />
          </Pressable>

          {!!warehouseId && (
            <Pressable
              onPress={() => setWarehouseId(null)}
              style={styles.clearBtn}
            >
              <AppText style={styles.clearText}>Clear warehouse</AppText>
            </Pressable>
          )}

          {!inventoryState.warehouses.length && (
            <AppText
              color={AppColors.muted}
              style={{ marginTop: 10, fontSize: 12 }}
            >
              No warehouses yet. Create one from Products → Warehouses.
            </AppText>
          )}
        </Card>
      )}

      <Card style={{ marginTop: 12 }}>
        <View style={styles.row}>
          <AppText variant="subtitle">Items</AppText>
          <AppButton
            title="+ Add"
            variant="outline"
            onPress={() =>
              setItems((p) => [...p, { name: "", qty: "1", unitPrice: "" }])
            }
          />
        </View>
        {(() => {
          const totalToman = items.reduce((sum, it) => {
            const qty = Number(it.qty) || 0;
            const price = Number(it.unitPrice) || 0;
            return sum + qty * price;
          }, 0);
          if (!totalToman) return null;
          if (currency === "USD" || currency === "EUR") {
            return (
              <AppText color={AppColors.muted} style={{ marginTop: 6, fontSize: 12 }}>
                Total:{" "}
                {exchangeRateToToman
                  ? `${(totalToman / exchangeRateToToman).toFixed(2)} ${currency} • ${totalToman.toLocaleString()} Toman`
                  : `${totalToman.toLocaleString()} Toman`}
              </AppText>
            );
          }
          return (
            <AppText color={AppColors.muted} style={{ marginTop: 6, fontSize: 12 }}>
              Total: {totalToman.toLocaleString()} {currency}
            </AppText>
          );
        })()}

        {items.map((it, idx) => (
          <View key={idx} style={{ marginTop: 12 }}>
            <AppInput
              label={`Item / Service #${idx + 1}`}
              value={it.name}
              onChangeText={(v) =>
                setItems((p) =>
                  p.map((x, i) => (i === idx ? { ...x, name: v } : x)),
                )
              }
              placeholder="e.g. Type-C cable"
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <AppInput
                  label="Qty"
                  value={it.qty}
                  keyboardType="number-pad"
                  onChangeText={(v) =>
                    setItems((p) =>
                      p.map((x, i) => (i === idx ? { ...x, qty: v } : x)),
                    )
                  }
                />
              </View>

              <View style={{ flex: 2 }}>
                <AppInput
                  label={`Unit Price (${currency})`}
                  value={it.unitPrice}
                  keyboardType="number-pad"
                  onChangeText={(v) =>
                    setItems((p) =>
                      p.map((x, i) => (i === idx ? { ...x, unitPrice: v } : x)),
                    )
                  }
                />
              </View>
            </View>
            {(() => {
              const qty = Number(it.qty) || 0;
              const price = Number(it.unitPrice) || 0;
              const lineTotalToman = qty * price;
              if (!lineTotalToman) return null;
              if (currency === "USD" || currency === "EUR") {
                return (
                  <AppText color={AppColors.muted} style={{ marginTop: 6, fontSize: 12 }}>
                    Line total:{" "}
                    {exchangeRateToToman
                      ? `${(lineTotalToman / exchangeRateToToman).toFixed(2)} ${currency} • ${lineTotalToman.toLocaleString()} Toman`
                      : `${lineTotalToman.toLocaleString()} Toman`}
                  </AppText>
                );
              }
              return (
                <AppText color={AppColors.muted} style={{ marginTop: 6, fontSize: 12 }}>
                  Line total: {lineTotalToman.toLocaleString()} {currency}
                </AppText>
              );
            })()}

            {items.length > 1 && (
              <AppButton
                title="Remove this item"
                variant="outline"
                onPress={() => setItems((p) => p.filter((_, i) => i !== idx))}
                style={{ marginTop: 8 }}
              />
            )}
          </View>
        ))}
      </Card>

      {!USE_REAL_API && (
        <Card style={{ marginTop: 12 }}>
          <View style={styles.row}>
            <AppText variant="subtitle">Payment</AppText>

            <Pressable
              onPress={() => setAttachPayment((p) => !p)}
              style={styles.toggleRow}
              hitSlop={10}
            >
              <View
                style={[
                  styles.checkOuter,
                  attachPayment && { borderColor: AppColors.accent },
                ]}
              >
                {attachPayment && <View style={styles.checkInner} />}
              </View>
              <AppText style={styles.toggleText}>Attach payment now</AppText>
            </Pressable>
          </View>

          {attachPayment && (
            <View style={{ marginTop: 10 }}>
              <View style={styles.currencyRow}>
                <AppButton
                  title="IRR"
                  variant={payCurrency === "IRR" ? "primary" : "outline"}
                  onPress={() => setPayCurrency("IRR")}
                  style={{ flex: 1, marginRight: 6 }}
                />
                <AppButton
                  title="IRT"
                  variant={payCurrency === "IRT" ? "primary" : "outline"}
                  onPress={() => setPayCurrency("IRT")}
                  style={{ flex: 1, marginHorizontal: 3 }}
                />
                <AppButton
                  title="USD"
                  variant={payCurrency === "USD" ? "primary" : "outline"}
                  onPress={() => setPayCurrency("USD")}
                  style={{ flex: 1, marginHorizontal: 3 }}
                />
                <AppButton
                  title="EUR"
                  variant={payCurrency === "EUR" ? "primary" : "outline"}
                  onPress={() => setPayCurrency("EUR")}
                  style={{ flex: 1, marginLeft: 6 }}
                />
              </View>

              <AppInput
                label="Amount"
                value={payAmount}
                onChangeText={setPayAmount}
                keyboardType="number-pad"
                placeholder="e.g. 500000"
                style={{ marginTop: 10 }}
              />

              <AppInput
                label="Note (optional)"
                value={payNote}
                onChangeText={setPayNote}
                placeholder="e.g. POS / Cash"
                style={{ marginTop: 10 }}
              />
            </View>
          )}
        </Card>
      )}

      <AppButton
        title={submitting ? "Submitting..." : "Submit Invoice"}
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

      {/* ✅ Warehouse picker overlay */}
      {!USE_REAL_API && showWarehousePicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <AppText style={styles.modalTitle}>Select Warehouse</AppText>

              <Pressable
                onPress={() => setShowWarehousePicker(false)}
                hitSlop={10}
              >
                <Image
                  // TODO: مسیر آیکن close رو خودت ست کن
                  source={require("../../assets/icons/common/close.png")}
                  style={{ width: 18, height: 18 }}
                  resizeMode="contain"
                />
              </Pressable>
            </View>

            <ScrollView
              style={{ maxHeight: 320 }}
              showsVerticalScrollIndicator={false}
            >
              {inventoryState.warehouses.map((w) => (
                <Pressable
                  key={w.id}
                  onPress={() => {
                    setWarehouseId(w.id);
                    setShowWarehousePicker(false);
                  }}
                  style={styles.wRow}
                >
                  <AppText style={styles.wName}>{w.name}</AppText>
                  {warehouseId === w.id && <View style={styles.wDot} />}
                </Pressable>
              ))}
            </ScrollView>

            <AppButton
              title="Close"
              variant="outline"
              onPress={() => setShowWarehousePicker(false)}
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { width: 18, height: 18 },
  pageTitle: { fontSize: 16, fontWeight: "700" },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  selector: {
    marginTop: 10,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorText: { fontSize: 13, fontWeight: "700", color: AppColors.text },
  selectorIcon: { width: 16, height: 16, opacity: 0.8 },

  clearBtn: { marginTop: 10, alignSelf: "flex-start" },
  clearText: {
    fontSize: 12,
    fontWeight: "700",
    color: AppColors.muted,
    textDecorationLine: "underline",
  },

  toggleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  toggleText: { fontSize: 12, fontWeight: "700", color: AppColors.muted },

  checkOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: AppColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AppColors.accent,
  },

  currencyRow: { flexDirection: "row", marginTop: 6 },

  modalOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 14,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalTitle: { fontSize: 14, fontWeight: "800", color: AppColors.text },

  wRow: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 12,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  wName: { fontSize: 13, fontWeight: "700", color: AppColors.text },
  wDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AppColors.success,
  },
});
