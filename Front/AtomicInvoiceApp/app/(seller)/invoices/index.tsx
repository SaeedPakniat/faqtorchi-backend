import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import InvoiceListItem from "../../../components/invoices/InvoiceListItem";
import AppButton from "../../../components/ui/AppButton";
import AppText from "../../../components/ui/AppText";
import { AppColors } from "../../../constants/appColors";
import { apiGet, ApiError, USE_REAL_API } from "../../../src/lib/api";
import { useAuth } from "../../../src/store/auth/AuthContext";
import { useInvoices } from "../../../src/store/invoices/InvoicesContext";

type ApiInvoice = {
  id: number;
  customerName?: string | null;
  customerPhone?: string | null;
  total?: string | number | null;
  currency?: "IRR" | "IRT" | "USD" | "EUR";
  exchangeRateValue?: string | number | null;
  issuedAt?: string | null;
  status?: string | null;
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

export default function SellerInvoices() {
  const router = useRouter();
  const { auth } = useAuth();
  const { invoices, loading } = useInvoices();

  const [apiInvoices, setApiInvoices] = useState<ApiInvoice[]>([]);
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
          const res = await apiGet<{
            invoices: ApiInvoice[];
          }>("/invoices", { query: { page: 1, pageSize: 20 } });
          if (active) setApiInvoices(res.invoices ?? []);
        } catch (e) {
          const err = e as ApiError;
          if (active) setApiError(err.message || "Failed to load invoices");
        } finally {
          if (active) setApiLoading(false);
        }
      })();

      return () => {
        active = false;
      };
    }, []),
  );

  const data = useMemo(() => {
    if (USE_REAL_API) {
      return apiInvoices.map((inv) => ({
        id: String(inv.id),
        customerName: inv.customerName ?? inv.customerPhone ?? "-",
        total: toNumber(inv.total),
        currency: inv.currency ?? "IRT",
        exchangeRateToToman: toNumber(inv.exchangeRateValue),
        createdAt: inv.issuedAt ?? new Date().toISOString(),
        status: mapStatus(inv.status),
        items: [],
      }));
    }
    return invoices.filter((i) => i.sellerPhone === auth.phone);
  }, [apiInvoices, invoices, auth.phone]);

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <AppText variant="title">Invoices</AppText>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <AppButton title="Quick" variant="outline" onPress={() => router.push("/(seller)/invoices/new")} />
          <AppButton title="From warehouse" onPress={() => router.push("/(seller)/invoices/warehouse")} />
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <InvoiceListItem
            invoice={{
              id: item.id,
              customerName: item.customerName ?? item.customerPhone,
              total: item.items?.length
                ? item.items.reduce((s, x) => s + x.qty * x.unitPrice, 0)
                : item.total,
              currency: (item as any).currency,
              exchangeRateToToman: (item as any).exchangeRateToToman,
              createdAt: item.createdAt,
              status: item.status,
              items: item.items?.map
                ? item.items.map((x) => ({ name: x.name, qty: x.qty, unitPrice: x.unitPrice }))
                : [],
            }}
            onPress={() => router.push({ pathname: "/(seller)/invoices/[id]", params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={
          USE_REAL_API ? (
            apiLoading ? (
              <AppText color={AppColors.muted} style={{ marginTop: 12 }}>
                Loading...
              </AppText>
            ) : apiError ? (
              <AppText color={AppColors.danger} style={{ marginTop: 12 }}>
                {apiError}
              </AppText>
            ) : (
              <AppText color={AppColors.muted} style={{ marginTop: 12 }}>
                No invoices yet.
              </AppText>
            )
          ) : loading ? (
            <AppText color={AppColors.muted} style={{ marginTop: 12 }}>
              Loading...
            </AppText>
          ) : (
            <AppText color={AppColors.muted} style={{ marginTop: 12 }}>
              No invoices yet.
            </AppText>
          )
        }
        showsVerticalScrollIndicator={false}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background, padding: 16, paddingTop: 24 },
});
