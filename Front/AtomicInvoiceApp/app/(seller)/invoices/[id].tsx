import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { BackHandler, Linking, ScrollView, Share, StyleSheet, View } from "react-native";
import AppButton from "../../../components/ui/AppButton";
import AppInput from "../../../components/ui/AppInput";
import AppText from "../../../components/ui/AppText";
import Card from "../../../components/ui/Card";
import StatusBadge from "../../../components/ui/StatusBadge";
import { AppColors } from "../../../constants/appColors";
import { API_BASE_URL, apiGet, apiPost, ApiError, USE_REAL_API } from "../../../src/lib/api";
import { getAccessToken } from "../../../src/store/auth/authStorage";
import { downloadAndSharePdf } from "../../../src/utils/remotePdf";
import { generateInvoicePdf, listInvoicePayments, cancelInvoice } from "../../../src/lib/invoiceApi";
import { getNotificationSettings } from "../../../src/lib/sellerSettingsApi";
import { voidPayment } from "../../../src/lib/paymentApi";
import { notifyNow, scheduleAt } from "../../../src/notifications/localNotifications";
import {
  ApiReminder,
  createInvoiceReminders,
  listInvoiceReminders,
  cancelReminder,
} from "../../../src/lib/reminderApi";
import { calculateInvoiceTotal } from "../../../src/store/invoices/calculations";
import { paymentToInvoiceCurrency } from "../../../src/store/invoices/currency";
import {
  createInstallments,
  getInstallmentPaid,
} from "../../../src/store/invoices/installments";
import { useInvoices } from "../../../src/store/invoices/InvoicesContext";
import type { CurrencyCode } from "../../../src/store/invoices/models";
import { formatDate, formatToman } from "../../../src/utils/format";
import { shareInvoicePdf } from "../../../src/utils/invoicePdf";

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
    status?: string | null;
  }>;
};

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

function currencyLabel(c: CurrencyCode | string) {
  switch (c) {
    case "IRR":
    case "IRT":
      return "Toman";
    case "USD":
      return "Dollar";
    case "EUR":
      return "Euro";
    default:
      return c;
  }
}

function formatMoney(amount: number, currency: CurrencyCode | string) {
  if (currency === "IRR" || currency === "IRT") return formatToman(amount);
  return `${amount.toLocaleString()} ${currencyLabel(currency)}`;
}

export default function SellerInvoiceDetails() {
  const router = useRouter();
  const safeGoBack = useCallback(() => {
    // Some versions have canGoBack, some don't.
    if (router.canGoBack?.()) {
      router.back();
      return;
    }
    // No history: go back to seller invoices list.
    router.replace("/(seller)/invoices");
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        safeGoBack();
        return true; // handled
      });
      return () => sub.remove();
    }, [safeGoBack]),
  );

  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ?? "";

  const { invoices, addPayment, setInvoiceDueAt, setInvoiceInstallments } =
    useInvoices();

  const [apiInvoice, setApiInvoice] = useState<ApiInvoice | null>(null);
  const [apiLoading, setApiLoading] = useState(USE_REAL_API);
  const [apiError, setApiError] = useState("");

  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("Payment");
  const [payCurrency, setPayCurrency] = useState<CurrencyCode>("IRR");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  const [pdfInfo, setPdfInfo] = useState<{ url?: string; token?: string } | null>(null);
  const [pdfError, setPdfError] = useState("");

  const [reminders, setReminders] = useState<ApiReminder[]>([]);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderError, setReminderError] = useState("");
  const [dueInDays, setDueInDays] = useState("7");
  const [remindDaysBefore, setRemindDaysBefore] = useState("2");
  const [reminderChannel, setReminderChannel] = useState<"SMS" | "NOTIF">("SMS");

  const [dueDays, setDueDays] = useState("7");
  const [instCount, setInstCount] = useState("3");

  const invoice = useMemo(
    () => invoices.find((x) => x.id === id),
    [id, invoices],
  );

  useFocusEffect(
    useCallback(() => {
      if (!USE_REAL_API) return;
      let active = true;
      setApiLoading(true);
      setApiError("");

      (async () => {
        try {
          const res = await apiGet<{ invoice: ApiInvoice }>(`/invoices/${id}`);
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

  const total = useMemo(
    () => (invoice ? calculateInvoiceTotal(invoice) : 0),
    [invoice],
  );

  const paidInInvoiceCurrency = useMemo(() => {
    if (!invoice) return 0;
    return invoice.payments.reduce(
      (sum, p) => sum + paymentToInvoiceCurrency(invoice, p),
      0,
    );
  }, [invoice]);

  const remaining = useMemo(
    () => Math.max(0, total - paidInInvoiceCurrency),
    [total, paidInInvoiceCurrency],
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
            onPress={safeGoBack}
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
            onPress={safeGoBack}
            style={{ marginTop: 16 }}
          />
        </View>
      );
    }

    const currency = apiInvoice.currency ?? "IRR";
    const exchangeRateToToman = toNumber(
      (apiInvoice as any).exchangeRateValue ?? (apiInvoice as any).exchangeRateToToman,
    );
    const paymentCurrency = currency === "IRR" ? payCurrency : currency;
    const totalAmount = toNumber(apiInvoice.total);
    const paid = (apiInvoice.payments ?? []).reduce(
      (s, p) => s + toNumber(p.amountInvoiceCurrency ?? p.amount),
      0,
    );
    const remainingAmount = Math.max(0, totalAmount - paid);
    const publicPdfUrl = pdfInfo?.url
      ? pdfInfo.url.startsWith("http")
        ? pdfInfo.url
        : (() => {
            const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
            if (pdfInfo.url.startsWith("/api/v1/")) return `${origin}${pdfInfo.url}`;
            return `${API_BASE_URL}${pdfInfo.url.startsWith("/") ? "" : "/"}${pdfInfo.url}`;
          })()
      : undefined;

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
            Invoice currency: {currencyLabel(currency)}
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
              <View key={it.id} style={[styles.row, { marginTop: 10 }]}>
                <AppText>
                  {name} × {it.quantity}
                </AppText>
                <AppText color={AppColors.muted}>
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

        <Card style={{ marginTop: 12 }}>
          <AppText variant="subtitle">Payments</AppText>

          <View style={[styles.row, { marginTop: 10 }]}>
            <AppButton
              title="IRR"
              variant={payCurrency === "IRR" ? "primary" : "outline"}
              onPress={() => setPayCurrency("IRR")}
              style={{ flex: 1, marginRight: 6 }}
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
            label={`Record new payment (${currencyLabel(paymentCurrency)})`}
            keyboardType="number-pad"
            value={payAmount}
            onChangeText={setPayAmount}
            placeholder="Example: 500000"
          />

          <AppInput
            label="Note (optional)"
            value={payNote}
            onChangeText={setPayNote}
            placeholder="Example: POS terminal"
            style={{ marginTop: 8 }}
          />

          {!!payError && (
            <AppText color={AppColors.danger} style={{ marginTop: 8 }}>
              {payError}
            </AppText>
          )}

          <AppButton
            title={paying ? "Submitting..." : "Record payment"}
            disabled={paying || !payAmount.trim()}
            onPress={async () => {
              const amount = Number(payAmount);
              if (!amount || amount <= 0) return;

              setPaying(true);
              setPayError("");
              try {
                await apiPost(`/invoices/${id}/payments`, {
                  amount,
                  currency: paymentCurrency,
                  method: "CASH",
                  note: payNote?.trim() || undefined,
                });
                const res = await apiGet<{ invoice: ApiInvoice }>(
                  `/invoices/${id}`,
                );
                setApiInvoice(res.invoice ?? null);
                setPayAmount("");
                setPayNote("Payment");
                try {
                  const settings = await getNotificationSettings();
                  if (settings.notifyInvoiceStatusChange) {
                    await notifyNow({
                      title: "Payment recorded",
                      body: `Payment recorded for invoice #${id}.`,
                      channelId: "invoice-reminders",
                    });
                  }
                } catch {
                  // ignore notification errors
                }
              } catch (e) {
                const err = e as ApiError;
                setPayError(err.message || "Payment failed");
              } finally {
                setPaying(false);
              }
            }}
            style={{ marginTop: 8 }}
          />

          {!!(apiInvoice.payments ?? []).length ? (
            <View style={{ marginTop: 10 }}>
              {(apiInvoice.payments ?? []).map((p) => (
                <View key={p.id} style={[styles.row, { marginTop: 6 }]}>
                  <View style={{ flex: 1 }}>
                    <AppText>{formatDate(p.paidAt)}</AppText>
                    {!!p.status && (
                      <AppText color={AppColors.muted} style={{ marginTop: 2 }}>
                        {p.status}
                      </AppText>
                    )}
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <AppText color={AppColors.muted}>
                      {formatMoney(
                        toNumber(p.amountInvoiceCurrency ?? p.amount),
                        currency,
                      )}
                    </AppText>
                    {p.status !== "VOIDED" && (
                      <AppButton
                        title="Void"
                        variant="outline"
                        onPress={async () => {
                          try {
                            await voidPayment(p.id);
                            const res = await listInvoicePayments(Number(id));
                            setApiInvoice((prev) =>
                              prev ? { ...prev, payments: res.payments as any[] } : prev,
                            );
                          } catch (e) {
                            const err = e as ApiError;
                            setPayError(err.message || "Failed to void payment");
                          }
                        }}
                        style={{ height: 32, marginTop: 6 }}
                      />
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <AppText color={AppColors.muted} style={{ marginTop: 8 }}>
              No payments recorded.
            </AppText>
          )}
        </Card>

        <Card style={{ marginTop: 12 }}>
          <AppText variant="subtitle">Invoice actions</AppText>

          {!!pdfError && (
            <AppText color={AppColors.danger} style={{ marginTop: 8 }}>
              {pdfError}
            </AppText>
          )}

          <View style={[styles.row, { marginTop: 10 }]}>
            <AppButton
              title="Generate PDF"
              onPress={async () => {
                setPdfError("");
                try {
                  const res = await generateInvoicePdf(Number(id));
                  setPdfInfo({
                    url: res.pdfUrlPublic,
                    token: res.pdfToken,
                  });
                } catch (e) {
                  const err = e as ApiError;
                  setPdfError(err.message || "Failed to generate PDF");
                }
              }}
              style={{ flex: 1, marginRight: 6 }}
            />
            <AppButton
              title="Public PDF"
              variant="outline"
              disabled={!publicPdfUrl}
              onPress={() => {
                if (publicPdfUrl) Linking.openURL(publicPdfUrl);
              }}
              style={{ flex: 1, marginLeft: 6 }}
            />
          </View>

          <AppButton
            title="Share Public PDF"
            variant="outline"
            onPress={async () => {
              setPdfError("");
              try {
                let url = publicPdfUrl;
                if (!url) {
                  const res = await generateInvoicePdf(Number(id));
                  const raw = res.pdfUrlPublic;
                  url = raw
                    ? raw.startsWith("http")
                      ? raw
                      : (() => {
                          const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
                          if (raw.startsWith("/api/v1/")) return `${origin}${raw}`;
                          return `${API_BASE_URL}${raw.startsWith("/") ? "" : "/"}${raw}`;
                        })()
                    : undefined;
                  setPdfInfo({ url: raw, token: res.pdfToken });
                }
                if (!url) throw new Error("PDF link not available");
                await Share.share({ message: url, url });
              } catch (e) {
                const err = e as ApiError;
                setPdfError(err.message || "Failed to share PDF");
              }
            }}
            style={{ marginTop: 10 }}
          />

          <AppButton
            title="Seller PDF"
            variant="outline"
            onPress={async () => {
              setPdfError("");
              try {
                const token = await getAccessToken();
                if (!token) {
                  setPdfError("No access token. Please sign in again.");
                  return;
                }
                const pdfUrl = `${API_BASE_URL}/invoices/${id}/pdf`;
                await downloadAndSharePdf({
                  url: pdfUrl,
                  fileName: `invoice-${id}.pdf`,
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
              } catch (e) {
                const err = e as ApiError;
                setPdfError(err.message || "Failed to fetch PDF");
              }
            }}
            style={{ marginTop: 10 }}
          />

          <AppButton
            title="Refresh payments"
            variant="outline"
            onPress={async () => {
              try {
                const res = await listInvoicePayments(Number(id));
                setApiInvoice((prev) =>
                  prev ? { ...prev, payments: res.payments as any[] } : prev,
                );
              } catch (e) {
                const err = e as ApiError;
                setPayError(err.message || "Failed to refresh payments");
              }
            }}
            style={{ marginTop: 10 }}
          />

          <AppButton
            title="Cancel invoice"
            variant="outline"
            onPress={async () => {
              try {
                await cancelInvoice(Number(id));
                try {
                  const settings = await getNotificationSettings();
                  if (settings.notifyInvoiceStatusChange) {
                    await notifyNow({
                      title: "Invoice canceled",
                      body: `Invoice #${id} was canceled.`,
                      channelId: "invoice-reminders",
                    });
                  }
                } catch {
                  // ignore notification errors
                }
                const res = await apiGet<{ invoice: ApiInvoice }>(`/invoices/${id}`);
                setApiInvoice(res.invoice ?? null);
              } catch (e) {
                const err = e as ApiError;
                setPayError(err.message || "Failed to cancel invoice");
              }
            }}
            style={{ marginTop: 8 }}
          />
        </Card>

        <Card style={{ marginTop: 12 }}>
          <AppText variant="subtitle">Reminders</AppText>

          {!!reminderError && (
            <AppText color={AppColors.danger} style={{ marginTop: 8 }}>
              {reminderError}
            </AppText>
          )}

          <View style={[styles.row, { marginTop: 10 }]}>
            <AppButton
              title="SMS"
              variant={reminderChannel === "SMS" ? "primary" : "outline"}
              onPress={() => setReminderChannel("SMS")}
              style={{ flex: 1, marginRight: 6 }}
            />
            <AppButton
              title="NOTIF"
              variant={reminderChannel === "NOTIF" ? "primary" : "outline"}
              onPress={() => setReminderChannel("NOTIF")}
              style={{ flex: 1, marginLeft: 6 }}
            />
          </View>

          <AppInput
            label="Due in (days)"
            keyboardType="number-pad"
            value={dueInDays}
            onChangeText={setDueInDays}
            placeholder="Example: 7"
            style={{ marginTop: 8 }}
          />
          <AppInput
            label="Remind days before"
            keyboardType="number-pad"
            value={remindDaysBefore}
            onChangeText={setRemindDaysBefore}
            placeholder="1-3"
            style={{ marginTop: 8 }}
          />

          <AppButton
            title={reminderLoading ? "Saving..." : "Create reminder"}
            disabled={reminderLoading}
            onPress={async () => {
              const dueDaysNum = Number(dueInDays);
              const remindDaysNum = Number(remindDaysBefore);
              if (!dueDaysNum || dueDaysNum <= 0) return;
              if (!remindDaysNum || remindDaysNum < 1 || remindDaysNum > 3) return;
              setReminderLoading(true);
              setReminderError("");
              try {
                const dueAt = new Date(Date.now() + dueDaysNum * 24 * 60 * 60 * 1000).toISOString();
                const res = await createInvoiceReminders(Number(id), {
                  installments: [
                    {
                      dueAt,
                      remindDaysBefore: remindDaysNum,
                      channel: reminderChannel,
                    },
                  ],
                });
                setReminders(res.reminders ?? []);
                try {
                  const settings = await getNotificationSettings();
                  if (settings.notifyPaymentReminder) {
                    for (const r of res.reminders ?? []) {
                      if (!r.remindAt) continue;
                      await scheduleAt({
                        title: "Payment reminder",
                        body: `Invoice #${id} is due soon.`,
                        date: new Date(r.remindAt),
                        channelId: "invoice-reminders",
                      });
                    }
                  }
                } catch {
                  // ignore notification errors
                }
              } catch (e) {
                const err = e as ApiError;
                setReminderError(err.message || "Failed to create reminder");
              } finally {
                setReminderLoading(false);
              }
            }}
            style={{ marginTop: 8 }}
          />

          <AppButton
            title="Load reminders"
            variant="outline"
            onPress={async () => {
              setReminderError("");
              try {
                const res = await listInvoiceReminders(Number(id));
                setReminders(res.reminders ?? []);
              } catch (e) {
                const err = e as ApiError;
                setReminderError(err.message || "Failed to load reminders");
              }
            }}
            style={{ marginTop: 8 }}
          />

          {!!reminders.length ? (
            <View style={{ marginTop: 10 }}>
              {reminders.map((r) => (
                <View key={r.id} style={[styles.row, { marginTop: 6 }]}>
                  <View style={{ flex: 1 }}>
                    <AppText>{formatDate(r.remindAt)}</AppText>
                    <AppText color={AppColors.muted} style={{ marginTop: 2 }}>
                      {r.channel} • {r.status}
                    </AppText>
                  </View>
                  {r.status !== "CANCELED" && (
                    <AppButton
                      title="Cancel"
                      variant="outline"
                      onPress={async () => {
                        try {
                          await cancelReminder(r.id);
                          const res = await listInvoiceReminders(Number(id));
                          setReminders(res.reminders ?? []);
                        } catch (e) {
                          const err = e as ApiError;
                          setReminderError(err.message || "Failed to cancel reminder");
                        }
                      }}
                      style={{ height: 32 }}
                    />
                  )}
                </View>
              ))}
            </View>
          ) : (
            <AppText color={AppColors.muted} style={{ marginTop: 8 }}>
              No reminders yet.
            </AppText>
          )}
        </Card>

        <AppButton
          title="Back"
          variant="outline"
          onPress={safeGoBack}
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
          onPress={safeGoBack}
          style={{ marginTop: 16 }}
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
      <AppText variant="title">Invoice #{invoice.id}</AppText>

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
          Invoice currency: {currencyLabel(invoice.currency)}
          {invoice.currency !== "IRR" && invoice.exchangeRateToToman
            ? ` • Rate: ${invoice.exchangeRateToToman.toLocaleString()} Toman`
            : ""}
        </AppText>

        <AppText variant="subtitle" style={{ marginTop: 12 }}>
          Total: {formatMoney(total, invoice.currency)}
        </AppText>
        {invoice.currency !== "IRR" && invoice.currency !== "IRT" && invoice.exchangeRateToToman && (
          <AppText color={AppColors.muted} style={{ marginTop: 4, fontSize: 12 }}>
            Total (Toman): {(total * invoice.exchangeRateToToman).toLocaleString()} Toman
          </AppText>
        )}

        <AppText color={AppColors.muted} style={{ marginTop: 6 }}>
          Paid: {formatMoney(paidInInvoiceCurrency, invoice.currency)} •
          Remaining: {formatMoney(remaining, invoice.currency)}
        </AppText>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <AppText variant="subtitle">Items</AppText>
        {invoice.items.map((it) => (
          <View key={it.id} style={[styles.row, { marginTop: 10 }]}>
            <AppText>
              {it.name} × {it.qty}
            </AppText>
            <AppText color={AppColors.muted}>
              {formatMoney(it.qty * it.unitPrice, invoice.currency)}
              {invoice.currency !== "IRR" &&
              invoice.currency !== "IRT" &&
              invoice.exchangeRateToToman
                ? ` • ${((it.qty * it.unitPrice) * invoice.exchangeRateToToman).toLocaleString()} Toman`
                : ""}
            </AppText>
          </View>
        ))}

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

      {!USE_REAL_API && (
        <Card style={{ marginTop: 12 }}>
          <AppText variant="subtitle">Payments</AppText>

          <View style={[styles.row, { marginTop: 10 }]}>
            <AppButton
              title={`Toman`}
              variant={payCurrency === "IRR" ? "primary" : "outline"}
              onPress={() => setPayCurrency("IRR")}
              style={{ flex: 1, marginRight: 6 }}
            />
            <AppButton
              title={`USD`}
              variant={payCurrency === "USD" ? "primary" : "outline"}
              onPress={() => setPayCurrency("USD")}
              style={{ flex: 1, marginHorizontal: 3 }}
            />
            <AppButton
              title={`EUR`}
              variant={payCurrency === "EUR" ? "primary" : "outline"}
              onPress={() => setPayCurrency("EUR")}
              style={{ flex: 1, marginLeft: 6 }}
            />
          </View>

          <AppInput
            label={`Record new payment (${currencyLabel(payCurrency)})`}
            keyboardType="number-pad"
            value={payAmount}
            onChangeText={setPayAmount}
            placeholder="Example: 500000"
          />

          <AppInput
            label="Note (optional)"
            value={payNote}
            onChangeText={setPayNote}
            placeholder="Example: POS terminal"
            style={{ marginTop: 8 }}
          />

          <AppButton
            title={paying ? "Submitting..." : "Record payment"}
            disabled={paying || !payAmount.trim()}
            onPress={async () => {
              const amount = Number(payAmount);
              if (!amount || amount <= 0) return;

              setPaying(true);
              try {
                await addPayment(invoice.id, {
                  amount,
                  currency: payCurrency,
                  note: payNote?.trim() || undefined,
                });
                setPayAmount("");
                setPayNote("Payment");
              } finally {
                setPaying(false);
              }
            }}
            style={{ marginTop: 8 }}
          />

          {!!invoice.payments.length && (
            <View style={{ marginTop: 10 }}>
              <AppText color={AppColors.muted}>Payments list:</AppText>
              {invoice.payments.map((p) => (
                <View key={p.id} style={[styles.row, { marginTop: 6 }]}>
                  <AppText>{formatDate(p.paidAt)}</AppText>
                  <AppText color={AppColors.muted}>
                    {formatMoney(p.amount, p.currency)}
                  </AppText>
                </View>
              ))}
            </View>
          )}
        </Card>
      )}

      {!USE_REAL_API && (
        <Card style={{ marginTop: 12 }}>
          <AppText variant="subtitle">Due date & installments</AppText>

          <AppInput
            label="Overall due date (days from today)"
            keyboardType="number-pad"
            value={dueDays}
            onChangeText={setDueDays}
            placeholder="Example: 7"
          />

          <AppButton
            title="Set overall due date"
            onPress={async () => {
              const days = Number(dueDays);
              if (!days || days <= 0) return;
              const d = new Date();
              d.setDate(d.getDate() + days);
              await setInvoiceDueAt(invoice.id, d.toISOString());
            }}
            style={{ marginTop: 8 }}
          />

          <AppInput
            label="Installments count"
            keyboardType="number-pad"
            value={instCount}
            onChangeText={setInstCount}
            placeholder="Example: 3"
            style={{ marginTop: 12 }}
          />

          <AppButton
            title="Create installments (monthly)"
            onPress={async () => {
              const count = Number(instCount);
              if (!count || count <= 1) return;

              const total2 = calculateInvoiceTotal(invoice);
              const first = new Date();
              first.setDate(first.getDate() + 7);

              const installments = createInstallments({
                total: total2,
                count,
                firstDueAt: first,
                intervalDays: 30,
              });

              await setInvoiceInstallments(invoice.id, installments);
            }}
            style={{ marginTop: 8 }}
          />

          {!!invoice.installments?.length && (
            <View style={{ marginTop: 10 }}>
              <AppText color={AppColors.muted}>Installments:</AppText>

              {invoice.installments
                .slice()
                .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
                .map((inst) => {
                  const paid = getInstallmentPaid(invoice, inst.id);
                  const instRemaining = Math.max(0, inst.amount - paid);

                  return (
                    <View key={inst.id} style={{ marginTop: 10 }}>
                      <View style={styles.row}>
                        <AppText>{formatDate(inst.dueAt)}</AppText>
                        <AppText color={AppColors.muted}>
                          {formatMoney(inst.amount, invoice.currency)}
                        </AppText>
                      </View>

                      <AppText
                        color={AppColors.muted}
                        style={{ marginTop: 4, fontSize: 12 }}
                      >
                        Paid: {formatMoney(paid, invoice.currency)} •
                        Remaining: {formatMoney(instRemaining, invoice.currency)}
                      </AppText>
                    </View>
                  );
                })}
            </View>
          )}
        </Card>
      )}

      {!USE_REAL_API && (
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
      )}

      <AppButton
        title="Back"
        variant="outline"
        onPress={safeGoBack}
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
  },
});
