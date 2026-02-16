import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppText from "@/components/ui/AppText";
import Card from "@/components/ui/Card";
import { AppColors } from "@/constants/appColors";
import { API_BASE_URL, apiGet, ApiError, USE_REAL_API } from "@/src/lib/api";
import { registerUser, refreshSession, logoutSession } from "@/src/lib/authApi";
import {
  ApiDiscountCode,
  createDiscountCode,
  listDiscountCodes,
  updateDiscountCode,
} from "@/src/lib/discountApi";
import { getExchangeRate } from "@/src/lib/exchangeRateApi";
import {
  getAccountsReceivableReport,
  getDiscountsReport,
  getLowStockReport,
  getSalesReport,
  getTopProductsReport,
} from "@/src/lib/reportApi";
import {
  requestPublicInvoiceToken,
  listPublicInvoices,
} from "@/src/lib/publicApi";
import {
  registerCustomerPortal,
  loginCustomerPortal,
} from "@/src/lib/customerPortalApi";

function pretty(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function InvoiceSettingsScreen() {
  const [meResult, setMeResult] = useState("");

  const [rateBase, setRateBase] = useState<"IRR" | "IRT" | "USD" | "EUR">("IRT");
  const [rateQuote, setRateQuote] = useState<"IRR" | "IRT" | "USD" | "EUR">("USD");
  const [rateResult, setRateResult] = useState("");
  const [rateFetchedAt, setRateFetchedAt] = useState("");
  const hasNavasanKey = (process.env.EXPO_PUBLIC_NAVASAN_API_KEY ?? "").length > 0;

  const [discounts, setDiscounts] = useState<ApiDiscountCode[]>([]);
  const [discountCode, setDiscountCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [discountValue, setDiscountValue] = useState("10");
  const [discountVariantId, setDiscountVariantId] = useState("");
  const [discountMaxUses, setDiscountMaxUses] = useState("");
  const [discountActive, setDiscountActive] = useState(true);
  const [discountError, setDiscountError] = useState("");

  const [reportResult, setReportResult] = useState("");
  const [reportFrom, setReportFrom] = useState("");
  const [reportTo, setReportTo] = useState("");
  const [reportTopLimit, setReportTopLimit] = useState("10");
  const [reportLowThreshold, setReportLowThreshold] = useState("5");
  const [reportLowWarehouse, setReportLowWarehouse] = useState("");

  const [publicPhone, setPublicPhone] = useState("");
  const [publicToken, setPublicToken] = useState("");
  const [publicResult, setPublicResult] = useState("");

  const [customerPhone, setCustomerPhone] = useState("");
  const [customerPass, setCustomerPass] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerAuthResult, setCustomerAuthResult] = useState("");

  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPass, setRegisterPass] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [authResult, setAuthResult] = useState("");

  const canUseApi = USE_REAL_API;
  const modeLabel = USE_REAL_API ? "Live API" : "Mock data";

  const discountPayload = useMemo(() => {
    const valueNum = Number(discountValue);
    const variantId = discountVariantId ? Number(discountVariantId) : undefined;
    const maxUses = discountMaxUses ? Number(discountMaxUses) : undefined;
    return {
      code: discountCode.trim() || undefined,
      type: discountType,
      value: Number.isFinite(valueNum) ? valueNum : discountValue,
      variantId: Number.isFinite(variantId as number) ? (variantId as number) : undefined,
      maxUses: Number.isFinite(maxUses as number) ? (maxUses as number) : undefined,
      isActive: discountActive,
    };
  }, [discountActive, discountCode, discountMaxUses, discountType, discountValue, discountVariantId]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <AppText variant="title">Invoice Tools</AppText>
      <AppText color={AppColors.muted} style={{ marginTop: 6 }}>
        Server-connected utilities for finance, reporting, and customer access.
      </AppText>

      <Card style={{ marginTop: 12 }}>
        <AppText variant="subtitle">Environment</AppText>
        <AppText color={AppColors.muted} style={{ marginTop: 6 }}>
          Mode: {modeLabel}
        </AppText>
        <AppText color={AppColors.muted} style={{ marginTop: 4 }}>
          Base URL: {API_BASE_URL}
        </AppText>
        {!canUseApi && (
          <AppText color={AppColors.warning} style={{ marginTop: 8 }}>
            Real API is disabled. Enable EXPO_PUBLIC_USE_REAL_API=true.
          </AppText>
        )}
      </Card>

      <Card style={{ marginTop: 12 }}>
        <AppText variant="subtitle">Profile</AppText>
        <AppText color={AppColors.muted} style={{ marginTop: 4 }}>
          Verify your authenticated seller context.
        </AppText>
        <AppButton
          title="Load Profile"
          variant="outline"
          onPress={async () => {
            try {
              const res = await apiGet("/me");
              setMeResult(pretty(res));
            } catch (e) {
              const err = e as ApiError;
              setMeResult(err.message || "Failed to load /me");
            }
          }}
          style={{ marginTop: 8 }}
        />
        {!!meResult && (
          <View style={styles.resultBox}>
            <AppText style={styles.result} selectable>
              {meResult}
            </AppText>
          </View>
        )}
      </Card>

      <Card style={{ marginTop: 12 }}>
        <AppText variant="subtitle">Exchange Rate</AppText>
        <AppText color={AppColors.muted} style={{ marginTop: 4 }}>
          Get current FX between supported currencies.
        </AppText>
        {!hasNavasanKey && (
          <AppText color={AppColors.warning} style={{ marginTop: 6 }}>
            Missing EXPO_PUBLIC_NAVASAN_API_KEY in your Expo env.
          </AppText>
        )}
        <View style={styles.row}>
          <AppInput
            label="Base"
            value={rateBase}
            onChangeText={(v) => setRateBase(v as any)}
            placeholder="IRT"
            style={{ flex: 1, marginRight: 6 }}
          />
          <AppInput
            label="Quote"
            value={rateQuote}
            onChangeText={(v) => setRateQuote(v as any)}
            placeholder="USD"
            style={{ flex: 1, marginLeft: 6 }}
          />
        </View>
        <AppButton
          title="Fetch Rate"
          onPress={async () => {
            try {
              const res = await getExchangeRate({ base: rateBase, quote: rateQuote });
              setRateResult(pretty(res.rate ?? res));
              setRateFetchedAt(res.rate?.fetchedAt ?? "");
            } catch (e) {
              const err = e as ApiError;
              setRateResult(err.message || "Failed to fetch rate");
              setRateFetchedAt("");
            }
          }}
          style={{ marginTop: 8 }}
        />
        {!!rateResult && (
          <View style={styles.resultBox}>
            <AppText style={styles.result} selectable>
              {rateResult}
            </AppText>
            {!!rateFetchedAt && (
              <AppText color={AppColors.muted} style={{ marginTop: 6, fontSize: 12 }}>
                Last updated: {new Date(rateFetchedAt).toLocaleString()}
              </AppText>
            )}
          </View>
        )}
      </Card>

      <Card style={{ marginTop: 12 }}>
        <AppText variant="subtitle">Discount Codes</AppText>
        <AppText color={AppColors.muted} style={{ marginTop: 4 }}>
          Create and manage promotional codes.
        </AppText>
        {!!discountError && (
          <AppText color={AppColors.danger} style={{ marginTop: 6 }}>
            {discountError}
          </AppText>
        )}
        <AppInput
          label="Code (optional)"
          value={discountCode}
          onChangeText={setDiscountCode}
          placeholder="AUTO"
          style={{ marginTop: 8 }}
        />
        <View style={[styles.row, { marginTop: 8 }]}>
          <AppButton
            title="PERCENT"
            variant={discountType === "PERCENT" ? "primary" : "outline"}
            onPress={() => setDiscountType("PERCENT")}
            style={{ flex: 1, marginRight: 6 }}
          />
          <AppButton
            title="FIXED"
            variant={discountType === "FIXED" ? "primary" : "outline"}
            onPress={() => setDiscountType("FIXED")}
            style={{ flex: 1, marginLeft: 6 }}
          />
        </View>
        <AppInput
          label="Value"
          value={discountValue}
          onChangeText={setDiscountValue}
          keyboardType="number-pad"
          placeholder="10"
          style={{ marginTop: 8 }}
        />
        <AppInput
          label="Variant ID (optional)"
          value={discountVariantId}
          onChangeText={setDiscountVariantId}
          keyboardType="number-pad"
          placeholder="123"
          style={{ marginTop: 8 }}
        />
        <AppInput
          label="Max Uses (optional)"
          value={discountMaxUses}
          onChangeText={setDiscountMaxUses}
          keyboardType="number-pad"
          placeholder="100"
          style={{ marginTop: 8 }}
        />
        <AppButton
          title={discountActive ? "Active" : "Inactive"}
          variant={discountActive ? "primary" : "outline"}
          onPress={() => setDiscountActive((v) => !v)}
          style={{ marginTop: 8 }}
        />
        <AppButton
          title="Create Discount Code"
          onPress={async () => {
            setDiscountError("");
            try {
              await createDiscountCode(discountPayload);
              const res = await listDiscountCodes();
              setDiscounts(res.discounts ?? []);
            } catch (e) {
              const err = e as ApiError;
              setDiscountError(err.message || "Failed to create discount code");
            }
          }}
          style={{ marginTop: 8 }}
        />
        <AppButton
          title="Load Codes"
          variant="outline"
          onPress={async () => {
            setDiscountError("");
            try {
              const res = await listDiscountCodes();
              setDiscounts(res.discounts ?? []);
            } catch (e) {
              const err = e as ApiError;
              setDiscountError(err.message || "Failed to load codes");
            }
          }}
          style={{ marginTop: 8 }}
        />

        {!!discounts.length && (
          <View style={{ marginTop: 10 }}>
            {discounts.map((d) => (
              <View key={d.id} style={[styles.row, { marginTop: 6 }]}>
                <View style={{ flex: 1 }}>
                  <AppText>{d.code}</AppText>
                  <AppText color={AppColors.muted} style={{ marginTop: 2 }}>
                    {d.type} • {String(d.value)} • {d.isActive ? "Active" : "Inactive"}
                  </AppText>
                </View>
                <AppButton
                  title={d.isActive ? "Deactivate" : "Activate"}
                  variant="outline"
                  onPress={async () => {
                    try {
                      await updateDiscountCode(d.id, { isActive: !d.isActive });
                      const res = await listDiscountCodes();
                      setDiscounts(res.discounts ?? []);
                    } catch (e) {
                      const err = e as ApiError;
                      setDiscountError(err.message || "Failed to update code");
                    }
                  }}
                  style={{ height: 34 }}
                />
              </View>
            ))}
          </View>
        )}
      </Card>

      <Card style={{ marginTop: 12 }}>
        <AppText variant="subtitle">Reports</AppText>
        <AppText color={AppColors.muted} style={{ marginTop: 4 }}>
          Sales performance and inventory health.
        </AppText>
        <AppInput
          label="From (ISO datetime)"
          value={reportFrom}
          onChangeText={setReportFrom}
          placeholder="2025-01-01T00:00:00.000Z"
          style={{ marginTop: 8 }}
        />
        <AppInput
          label="To (ISO datetime)"
          value={reportTo}
          onChangeText={setReportTo}
          placeholder="2025-12-31T23:59:59.000Z"
          style={{ marginTop: 8 }}
        />
        <AppInput
          label="Top products limit"
          value={reportTopLimit}
          onChangeText={setReportTopLimit}
          keyboardType="number-pad"
          placeholder="10"
          style={{ marginTop: 8 }}
        />
        <AppInput
          label="Low stock threshold"
          value={reportLowThreshold}
          onChangeText={setReportLowThreshold}
          keyboardType="number-pad"
          placeholder="5"
          style={{ marginTop: 8 }}
        />
        <AppInput
          label="Low stock warehouse ID (optional)"
          value={reportLowWarehouse}
          onChangeText={setReportLowWarehouse}
          keyboardType="number-pad"
          placeholder="1"
          style={{ marginTop: 8 }}
        />

        <View style={[styles.row, { marginTop: 8 }]}>
          <AppButton
            title="Sales"
            onPress={async () => {
              try {
                const res = await getSalesReport({
                  from: reportFrom || undefined,
                  to: reportTo || undefined,
                });
                setReportResult(pretty(res));
              } catch (e) {
                const err = e as ApiError;
                setReportResult(err.message || "Failed to load sales report");
              }
            }}
            style={{ flex: 1, marginRight: 6 }}
          />
          <AppButton
            title="Discounts"
            variant="outline"
            onPress={async () => {
              try {
                const res = await getDiscountsReport({
                  from: reportFrom || undefined,
                  to: reportTo || undefined,
                });
                setReportResult(pretty(res));
              } catch (e) {
                const err = e as ApiError;
                setReportResult(err.message || "Failed to load discounts report");
              }
            }}
            style={{ flex: 1, marginLeft: 6 }}
          />
        </View>
        <View style={[styles.row, { marginTop: 8 }]}>
          <AppButton
            title="Accounts Receivable"
            onPress={async () => {
              try {
                const res = await getAccountsReceivableReport();
                setReportResult(pretty(res));
              } catch (e) {
                const err = e as ApiError;
                setReportResult(err.message || "Failed to load accounts receivable");
              }
            }}
            style={{ flex: 1, marginRight: 6 }}
          />
          <AppButton
            title="Top Products"
            variant="outline"
            onPress={async () => {
              try {
                const res = await getTopProductsReport({
                  limit: Number(reportTopLimit) || undefined,
                });
                setReportResult(pretty(res));
              } catch (e) {
                const err = e as ApiError;
                setReportResult(err.message || "Failed to load top products");
              }
            }}
            style={{ flex: 1, marginLeft: 6 }}
          />
        </View>
        <AppButton
          title="Low Stock"
          variant="outline"
          onPress={async () => {
            try {
              const res = await getLowStockReport({
                threshold: Number(reportLowThreshold) || undefined,
                warehouseId: reportLowWarehouse ? Number(reportLowWarehouse) : undefined,
              });
              setReportResult(pretty(res));
            } catch (e) {
              const err = e as ApiError;
              setReportResult(err.message || "Failed to load low stock");
            }
          }}
          style={{ marginTop: 8 }}
        />

        {!!reportResult && (
          <View style={styles.resultBox}>
            <AppText style={styles.result} selectable>
              {reportResult}
            </AppText>
          </View>
        )}
      </Card>

      <Card style={{ marginTop: 12 }}>
        <AppText variant="subtitle">Public Invoice Access</AppText>
        <AppText color={AppColors.muted} style={{ marginTop: 4 }}>
          Allow customers to view invoices via token.
        </AppText>
        <AppInput
          label="Customer phone"
          value={publicPhone}
          onChangeText={setPublicPhone}
          placeholder="0912..."
          keyboardType="phone-pad"
          style={{ marginTop: 8 }}
        />
        <AppInput
          label="Token"
          value={publicToken}
          onChangeText={setPublicToken}
          placeholder="token"
          style={{ marginTop: 8 }}
        />
        <View style={[styles.row, { marginTop: 8 }]}>
          <AppButton
            title="Request Token"
            onPress={async () => {
              try {
                const res = await requestPublicInvoiceToken(publicPhone);
                setPublicResult(pretty(res));
              } catch (e) {
                const err = e as ApiError;
                setPublicResult(err.message || "Failed to request token");
              }
            }}
            style={{ flex: 1, marginRight: 6 }}
          />
          <AppButton
            title="List Invoices"
            variant="outline"
            onPress={async () => {
              try {
                const res = await listPublicInvoices({
                  phone: publicPhone,
                  token: publicToken,
                });
                setPublicResult(pretty(res));
              } catch (e) {
                const err = e as ApiError;
                setPublicResult(err.message || "Failed to load public invoices");
              }
            }}
            style={{ flex: 1, marginLeft: 6 }}
          />
        </View>
        {!!publicResult && (
          <View style={styles.resultBox}>
            <AppText style={styles.result} selectable>
              {publicResult}
            </AppText>
          </View>
        )}
      </Card>

      <Card style={{ marginTop: 12 }}>
        <AppText variant="subtitle">Customer Portal Auth</AppText>
        <AppText color={AppColors.muted} style={{ marginTop: 4 }}>
          Register or log in a customer portal account.
        </AppText>
        <AppInput
          label="Phone"
          value={customerPhone}
          onChangeText={setCustomerPhone}
          placeholder="0912..."
          keyboardType="phone-pad"
          style={{ marginTop: 8 }}
        />
        <AppInput
          label="Password"
          value={customerPass}
          onChangeText={setCustomerPass}
          placeholder="password"
          secureTextEntry
          style={{ marginTop: 8 }}
        />
        <AppInput
          label="Email (register only)"
          value={customerEmail}
          onChangeText={setCustomerEmail}
          placeholder="test@example.com"
          style={{ marginTop: 8 }}
        />
        <AppInput
          label="Name (register only)"
          value={customerName}
          onChangeText={setCustomerName}
          placeholder="Customer"
          style={{ marginTop: 8 }}
        />
        <View style={[styles.row, { marginTop: 8 }]}>
          <AppButton
            title="Register"
            onPress={async () => {
              try {
                const res = await registerCustomerPortal({
                  phone: customerPhone,
                  password: customerPass,
                  email: customerEmail || undefined,
                  name: customerName || undefined,
                });
                setCustomerAuthResult(pretty(res));
              } catch (e) {
                const err = e as ApiError;
                setCustomerAuthResult(err.message || "Failed to register");
              }
            }}
            style={{ flex: 1, marginRight: 6 }}
          />
          <AppButton
            title="Login"
            variant="outline"
            onPress={async () => {
              try {
                const res = await loginCustomerPortal({
                  phone: customerPhone,
                  password: customerPass,
                });
                setCustomerAuthResult(pretty(res));
              } catch (e) {
                const err = e as ApiError;
                setCustomerAuthResult(err.message || "Failed to login");
              }
            }}
            style={{ flex: 1, marginLeft: 6 }}
          />
        </View>
        {!!customerAuthResult && (
          <View style={styles.resultBox}>
            <AppText style={styles.result} selectable>
              {customerAuthResult}
            </AppText>
          </View>
        )}
      </Card>

      <Card style={{ marginTop: 12 }}>
        <AppText variant="subtitle">Auth (Register / Refresh / Logout)</AppText>
        <AppText color={AppColors.muted} style={{ marginTop: 4 }}>
          Seller authentication utilities.
        </AppText>
        <AppInput
          label="Phone"
          value={registerPhone}
          onChangeText={setRegisterPhone}
          placeholder="0912..."
          keyboardType="phone-pad"
          style={{ marginTop: 8 }}
        />
        <AppInput
          label="Password"
          value={registerPass}
          onChangeText={setRegisterPass}
          placeholder="password"
          secureTextEntry
          style={{ marginTop: 8 }}
        />
        <AppInput
          label="Email (optional)"
          value={registerEmail}
          onChangeText={setRegisterEmail}
          placeholder="test@example.com"
          style={{ marginTop: 8 }}
        />
        <AppInput
          label="Name (optional)"
          value={registerName}
          onChangeText={setRegisterName}
          placeholder="User"
          style={{ marginTop: 8 }}
        />
        <View style={[styles.row, { marginTop: 8 }]}>
          <AppButton
            title="Register"
            onPress={async () => {
              try {
                const res = await registerUser({
                  phone: registerPhone,
                  password: registerPass,
                  email: registerEmail || undefined,
                  name: registerName || undefined,
                });
                setAuthResult(pretty(res));
              } catch (e) {
                const err = e as ApiError;
                setAuthResult(err.message || "Failed to register");
              }
            }}
            style={{ flex: 1, marginRight: 6 }}
          />
          <AppButton
            title="Refresh"
            variant="outline"
            onPress={async () => {
              try {
                const res = await refreshSession();
                setAuthResult(pretty(res));
              } catch (e) {
                const err = e as ApiError;
                setAuthResult(err.message || "Failed to refresh");
              }
            }}
            style={{ flex: 1, marginLeft: 6 }}
          />
        </View>
        <AppButton
          title="Logout"
          variant="outline"
          onPress={async () => {
            try {
              const res = await logoutSession();
              setAuthResult(pretty(res));
            } catch (e) {
              const err = e as ApiError;
              setAuthResult(err.message || "Failed to logout");
            }
          }}
          style={{ marginTop: 8 }}
        />
        {!!authResult && (
          <View style={styles.resultBox}>
            <AppText style={styles.result} selectable>
              {authResult}
            </AppText>
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
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  result: {
    fontSize: 12,
    color: AppColors.muted,
  },
  resultBox: {
    marginTop: 10,
    backgroundColor: AppColors.primarySoft,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
});
