// app/(customer)/invoice/[id].tsx
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import AppButton from "../../../components/ui/AppButton";
import AppText from "../../../components/ui/AppText";
import Card from "../../../components/ui/Card";
import StatusBadge from "../../../components/ui/StatusBadge";
import { AppColors } from "../../../constants/appColors";
import { apiGet, ApiError, USE_REAL_API } from "../../../src/lib/api";
import { useInvoices } from "../../../src/store/invoices/InvoicesContext";
import type { CurrencyCode } from "../../../src/store/invoices/models";
import { formatDate, formatToman } from "../../../src/utils/format";
import { shareInvoicePdf } from "../../../src/utils/invoicePdf";

import { calculateInvoiceTotal } from "../../../src/store/invoices/calculations";
import { paymentToInvoiceCurrency } from "../../../src/store/invoices/currency";

type ApiInvoice = {
  id: number;
  customerName?: string | null;
  customerPhone?: string | null;
  status?: string | null;
  currency?: string | null;
  subtotal?: string | number | null;
  discount?: string | number | null;
  tax?: string | number | null;
  total?: string | number | null;
  issuedAt?: string | null;
  items?: Array<{
    id: number;
    description?: string | null;
    quantity: number;
    unitPrice: string | number;
    lineTotal?: string | number | null;
    variant?: { product?: { name?: string | null } | null } | null;
  }>;
  payments?: Array<{
    id: number;
    amount: string | number;
    amountInvoiceCurrency?: string | number | null;
    currency: string;
    paidAt: string;
    note?: string | null;
  }>;
};

function currencyLabel(c: CurrencyCode) {
  switch (c) {
    case "IRR":
      return "Toman";
    case "USD":
      return "USD";
    case "EUR":
      return "EUR";
    default:
      return c;
  }
}

function formatMoney(amount: number, currency: CurrencyCode) {
  if (currency === "IRR") return formatToman(amount);
  return `${amount.toLocaleString()} ${currencyLabel(currency)}`;
}

function toNumber(v: unknown) {
  if (typeof v === "number") return v;
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "string") return Number(v);
  return 0;
}

function mapStatus(status?: string | null) {
  if (status === "PAID") return "paid";
  if (status === "PARTIALLY_PAID") return "unpaid";
  if (status === "ISSUED" || status === "DRAFT") return "unpaid";
  if (status === "CANCELED") return "canceled";
  return "unpaid";
}

function shortInvoiceId(id: string) {
  if (!id) return "";
  const clean = id.trim();
  if (clean.length <= 10) return clean;
  return `${clean.slice(0, 12)}...`;
}

export default function CustomerInvoiceDetails() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ?? "";

  const { invoices } = useInvoices();
  const invoice = useMemo(
    () => invoices.find((x) => x.id === id),
    [id, invoices],
  );

  const [apiInvoice, setApiInvoice] = useState<ApiInvoice | null>(null);
  const [apiLoading, setApiLoading] = useState(USE_REAL_API);
  const [apiError, setApiError] = useState("");

  useFocusEffect(
    useCallback(() => {
      if (!USE_REAL_API) return;
      let active = true;
      setApiLoading(true);
      setApiError("");

      (async () => {
        try {
          const res = await apiGet<{ invoice: ApiInvoice }>(`/customer/invoices/${id}`);
          if (active) setApiInvoice(res.invoice ?? null);
        } catch (e) {
          const err = e as ApiError;
          if (active) setApiError(err.message || "Failed to load invoice");
        } finally {
          if (active) setApiLoading(false);
        }
      })();

      return () => {
        active = false;
      };
    }, [id]),
  );

  if (USE_REAL_API) {
    if (apiLoading) {
      return (
        <View style={styles.container}>
          <AppText color={AppColors.muted}>Loading...</AppText>
        </View>
      );
    }
    if (apiError) {
      return (
        <View style={styles.container}>
          <AppText color={AppColors.danger}>{apiError}</AppText>
          <AppButton
            title="Back"
            onPress={() => router.back()}
            style={{ marginTop: 16 }}
          />
        </View>
      );
    }
    if (!apiInvoice) {
      return (
        <View style={styles.container}>
          <AppText variant="title">Invoice not found</AppText>
          <AppButton
            title="Back"
            onPress={() => router.back()}
            style={{ marginTop: 16 }}
          />
        </View>
      );
    }

    const currency = (apiInvoice.currency ?? "IRR") as CurrencyCode;
    const exchangeRateToToman = toNumber(
      (apiInvoice as any).exchangeRateValue ?? (apiInvoice as any).exchangeRateToToman,
    );
    const totalAmount = toNumber(apiInvoice.total);
    const paid = (apiInvoice.payments ?? []).reduce(
      (s, p) => s + toNumber(p.amountInvoiceCurrency ?? p.amount),
      0,
    );
    const remainingAmount = Math.max(0, totalAmount - paid);

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="title">Invoice #{apiInvoice.id}</AppText>

        <Card style={{ marginTop: 16 }}>
          <View style={styles.row}>
            <AppText variant="subtitle">
              {apiInvoice.customerName ?? apiInvoice.customerPhone ?? "-"}
            </AppText>
            <StatusBadge status={mapStatus(apiInvoice.status)} />
          </View>

          <AppText color={AppColors.muted} style={{ marginTop: 8 }}>
            Date: {apiInvoice.issuedAt ? formatDate(apiInvoice.issuedAt) : "-"}
          </AppText>

          <AppText color={AppColors.muted} style={{ marginTop: 8 }}>
            Currency: {currencyLabel(currency)}
          </AppText>

          <AppText variant="subtitle" style={{ marginTop: 12 }}>
            Total: {formatMoney(totalAmount, currency)}
          </AppText>
          {currency !== "IRR" && currency !== "IRT" && exchangeRateToToman > 0 && (
            <AppText color={AppColors.muted} style={{ marginTop: 4, fontSize: 12 }}>
              Total (Toman):{" "}
              {(totalAmount * exchangeRateToToman).toLocaleString()} Toman
            </AppText>
          )}

          <AppText color={AppColors.muted} style={{ marginTop: 6 }}>
            Paid: {formatMoney(paid, currency)} • Remaining:{" "}
            {formatMoney(remainingAmount, currency)}
          </AppText>
        </Card>

        <Card style={{ marginTop: 12 }}>
          <AppText variant="subtitle">Items</AppText>
          {(apiInvoice.items ?? []).map((it) => {
            const name =
              it.description ??
              it.variant?.product?.name ??
              `Item #${it.id}`;
            const lineTotal =
              it.lineTotal != null
                ? toNumber(it.lineTotal)
                : toNumber(it.unitPrice) * it.quantity;
            return (
              <View key={it.id} style={styles.itemBlock}>
                <AppText style={styles.itemTitle}>
                  {name} × {it.quantity}
                </AppText>
                <AppText color={AppColors.muted} style={styles.itemPrice}>
                  {formatMoney(lineTotal, currency)}
                  {currency !== "IRR" && currency !== "IRT" && exchangeRateToToman > 0
                    ? ` • ${(lineTotal * exchangeRateToToman).toLocaleString()} Toman`
                    : ""}
                </AppText>
              </View>
            );
          })}

          {(toNumber(apiInvoice.discount) > 0 || toNumber(apiInvoice.tax) > 0) && (
            <View style={{ marginTop: 12 }}>
              {toNumber(apiInvoice.discount) > 0 && (
                <View style={[styles.row, { marginTop: 6 }]}>
                  <AppText color={AppColors.muted}>Discount</AppText>
                  <AppText color={AppColors.muted}>
                    {formatMoney(toNumber(apiInvoice.discount), currency)}
                  </AppText>
                </View>
              )}
              {toNumber(apiInvoice.tax) > 0 && (
                <View style={[styles.row, { marginTop: 6 }]}>
                  <AppText color={AppColors.muted}>Tax</AppText>
                  <AppText color={AppColors.muted}>
                    {formatMoney(toNumber(apiInvoice.tax), currency)}
                  </AppText>
                </View>
              )}
            </View>
          )}
        </Card>

        {!!(apiInvoice.payments ?? []).length && (
          <Card style={{ marginTop: 12 }}>
            <AppText variant="subtitle">Payments</AppText>
            <View style={{ marginTop: 10 }}>
              {(apiInvoice.payments ?? []).map((p) => (
                <View key={p.id} style={[styles.row, { marginTop: 6 }]}>
                  <AppText>{formatDate(p.paidAt)}</AppText>
                  <AppText color={AppColors.muted}>
                    {formatMoney(
                      toNumber(p.amountInvoiceCurrency ?? p.amount),
                      currency,
                    )}
                  </AppText>
                </View>
              ))}
            </View>
          </Card>
        )}

        <AppButton
          title="Back"
          variant="outline"
          onPress={() => router.back()}
          style={{ marginTop: 16 }}
        />
      </ScrollView>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.container}>
        <AppText variant="title">Invoice not found</AppText>
        <AppButton
          title="Back"
          onPress={() => router.back()}
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  const total = calculateInvoiceTotal(invoice);

  const paidInInvoiceCurrency = invoice.payments.reduce(
    (sum, p) => sum + paymentToInvoiceCurrency(invoice, p),
    0,
  );

  const remaining = Math.max(0, total - paidInInvoiceCurrency);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <AppText variant="title">Invoice #{shortInvoiceId(invoice.id)}</AppText>

      <Card style={{ marginTop: 16 }}>
        <View style={styles.row}>
          <AppText variant="subtitle">
            {invoice.customerName ?? invoice.customerPhone}
          </AppText>
          <StatusBadge status={invoice.status} />
        </View>

        <AppText color={AppColors.muted} style={{ marginTop: 8 }}>
          Date: {formatDate(invoice.createdAt)}
        </AppText>

        <AppText color={AppColors.muted} style={{ marginTop: 8 }}>
          Currency: {currencyLabel(invoice.currency)}
          {invoice.currency !== "IRR" && invoice.exchangeRateToToman
            ? ` • Rate: ${invoice.exchangeRateToToman.toLocaleString()} Toman`
            : ""}
        </AppText>

        <AppText variant="subtitle" style={{ marginTop: 12 }}>
          Total: {formatMoney(total, invoice.currency)}
        </AppText>

        <AppText color={AppColors.muted} style={{ marginTop: 6 }}>
          Paid: {formatMoney(paidInInvoiceCurrency, invoice.currency)} •
          Remaining: {formatMoney(remaining, invoice.currency)}
        </AppText>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <AppText variant="subtitle">Items</AppText>

        {invoice.items.map((it) => {
          const lineTotal = it.qty * it.unitPrice;

          return (
            <View key={it.id} style={styles.itemBlock}>
              {/* ✅ Line 1: name + qty */}
              <AppText style={styles.itemTitle}>
                {it.name} × {it.qty}
              </AppText>

              {/* ✅ Line 2: price under it */}
              <AppText color={AppColors.muted} style={styles.itemPrice}>
                {formatMoney(lineTotal, invoice.currency)}
              </AppText>
            </View>
          );
        })}

        {(invoice.discount || invoice.tax) && (
          <View style={{ marginTop: 12 }}>
            {invoice.discount && (
              <View style={[styles.row, { marginTop: 6 }]}>
                <AppText color={AppColors.muted}>Discount</AppText>
                <AppText color={AppColors.muted}>
                  {invoice.discount.type === "percent"
                    ? `${invoice.discount.value}%`
                    : formatMoney(invoice.discount.value, invoice.currency)}
                </AppText>
              </View>
            )}

            {invoice.tax && (
              <View style={[styles.row, { marginTop: 6 }]}>
                <AppText color={AppColors.muted}>Tax</AppText>
                <AppText color={AppColors.muted}>
                  {invoice.tax.type === "percent"
                    ? `${invoice.tax.value}%`
                    : formatMoney(invoice.tax.value, invoice.currency)}
                </AppText>
              </View>
            )}
          </View>
        )}
      </Card>

      {!!invoice.payments.length && (
        <Card style={{ marginTop: 12 }}>
          <AppText variant="subtitle">Payments</AppText>

          <View style={{ marginTop: 10 }}>
            {invoice.payments.map((p) => (
              <View key={p.id} style={[styles.row, { marginTop: 6 }]}>
                <AppText>{formatDate(p.paidAt)}</AppText>
                <AppText color={AppColors.muted}>
                  {formatMoney(p.amount, p.currency)}
                </AppText>
              </View>
            ))}
          </View>
        </Card>
      )}

      <AppButton
        title="Invoice PDF"
        onPress={async () => {
          try {
            await shareInvoicePdf(invoice);
          } catch {
            // ignore
          }
        }}
        style={{ marginTop: 12 }}
      />

      <AppButton
        title="Back"
        variant="outline"
        onPress={() => router.back()}
        style={{ marginTop: 16 }}
      />
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
    gap: 10,
  },

  // ✅ Items layout
  itemBlock: {
    marginTop: 10,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: AppColors.text,
  },
  itemPrice: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "left",
  },
});
