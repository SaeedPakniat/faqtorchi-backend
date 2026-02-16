import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import AppButton from "../../../components/ui/AppButton";
import AppInput from "../../../components/ui/AppInput";
import AppText from "../../../components/ui/AppText";
import Card from "../../../components/ui/Card";
import { AppColors } from "../../../constants/appColors";
import { ApiError, apiPost, USE_REAL_API } from "../../../src/lib/api";
import { getExchangeRate } from "../../../src/lib/exchangeRateApi";
import { getBaseCurrency, getNotificationSettings } from "../../../src/lib/sellerSettingsApi";
import { notifyNow } from "../../../src/notifications/localNotifications";
import { useAuth } from "../../../src/store/auth/AuthContext";
import { useInvoices } from "../../../src/store/invoices/InvoicesContext";
import type { CurrencyCode } from "../../../src/store/invoices/models";

type DraftItem = { name: string; qty: string; unitPrice: string };

export default function NewInvoiceScreen() {
  const router = useRouter();
  const { auth } = useAuth();
  const { addInvoice } = useInvoices();

  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [items, setItems] = useState<DraftItem[]>([{ name: "", qty: "1", unitPrice: "" }]);
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
    return parsed.every((x) => x.qty > 0 && x.unitPrice > 0);
  }, [auth.phone, customerPhone, items]);

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

  async function onSubmit() {
    if (!canSubmit || !auth.phone) return;
    setSubmitting(true);
    try {
      if (USE_REAL_API) {
        const res = await apiPost<{ invoice: { id: number } }>("/invoices/instant", {
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
        });
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
        router.replace({ pathname: "/(seller)/invoices/[id]", params: { id: String(res.invoice.id) } });
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
          items: items
            .map((it) => ({ name: it.name.trim(), qty: Number(it.qty), unitPrice: Number(it.unitPrice) }))
            .filter((x) => x.name),
        });
        router.replace({ pathname: "/(seller)/invoices/[id]", params: { id: invoice.id } });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <AppText variant="title">Create Invoice (Quick)</AppText>

      <Card style={{ marginTop: 16 }}>
        <AppText variant="subtitle">Customer Info</AppText>
        <AppInput
          label="Phone Number"
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
        <View style={styles.row}>
          <AppText variant="subtitle">Items</AppText>
          <AppButton
            title="+ Add"
            variant="outline"
            onPress={() => setItems((p) => [...p, { name: "", qty: "1", unitPrice: "" }])}
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
              label={`Item/Service #${idx + 1}`}
              value={it.name}
              onChangeText={(v) => setItems((p) => p.map((x, i) => (i === idx ? { ...x, name: v } : x)))}
              placeholder="Example: Type-C cable"
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <AppInput
                  label="Quantity"
                  value={it.qty}
                  keyboardType="number-pad"
                  onChangeText={(v) => setItems((p) => p.map((x, i) => (i === idx ? { ...x, qty: v } : x)))}
                />
              </View>
              <View style={{ flex: 2 }}>
                <AppInput
                  label={`Unit price (${currency})`}
                  value={it.unitPrice}
                  keyboardType="number-pad"
                  onChangeText={(v) => setItems((p) => p.map((x, i) => (i === idx ? { ...x, unitPrice: v } : x)))}
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
                title="Remove row"
                variant="outline"
                onPress={() => setItems((p) => p.filter((_, i) => i !== idx))}
                style={{ marginTop: 8 }}
              />
            )}
          </View>
        ))}
      </Card>

      <AppButton
        title={submitting ? "Submitting..." : "Create invoice"}
        onPress={onSubmit}
        disabled={!canSubmit || submitting}
        style={{ marginTop: 16 }}
      />
      <AppButton title="Cancel" variant="outline" onPress={() => router.back()} style={{ marginTop: 10 }} />

      <AppText color={AppColors.muted} style={{ marginTop: 12, fontSize: 12 }}>
        This quick flow only creates a manual (Instant) invoice. Next we’ll add warehouse items and payments.
      </AppText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background, padding: 16, paddingTop: 24 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
