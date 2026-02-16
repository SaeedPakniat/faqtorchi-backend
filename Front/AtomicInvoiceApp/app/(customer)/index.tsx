// app/(customer)/index.tsx
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

import AppText from "../../components/ui/AppText";
import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge";
import { AppColors } from "../../constants/appColors";
import { apiGet, ApiError, USE_REAL_API } from "../../src/lib/api";
import { useAuth } from "../../src/store/auth/AuthContext";
import { useInvoices } from "../../src/store/invoices/InvoicesContext";
import { formatDate, formatToman } from "../../src/utils/format";

type ApiInvoice = {
  id: number;
  customerName?: string | null;
  customerPhone?: string | null;
  total?: string | number | null;
  issuedAt?: string | null;
  status?: string | null;
};

function shortInvoiceId(id: string) {
  // Example: inv_9c10d212a4e85_1770888139515 -> inv_9c10...
  if (!id) return "";
  const clean = id.trim();
  if (clean.length <= 10) return clean;
  return `${clean.slice(0, 8)}...`;
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

export default function CustomerInvoices() {
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
          const res = await apiGet<{ invoices: ApiInvoice[] }>("/customer/invoices", {
            query: { page: 1, pageSize: 20 },
          });
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

  const data = useMemo(
    () => {
      if (USE_REAL_API) {
        return apiInvoices.map((inv) => ({
          id: String(inv.id),
          customerName: inv.customerName ?? inv.customerPhone ?? "-",
          total: toNumber(inv.total),
          createdAt: inv.issuedAt ?? new Date().toISOString(),
          status: mapStatus(inv.status),
          items: [],
        }));
      }
      return invoices.filter((i) => i.customerPhone === auth.phone);
    },
    [apiInvoices, invoices, auth.phone],
  );

  return (
    <View style={styles.container}>
      <AppText variant="title" style={styles.pageTitle}>
        My Invoices
      </AppText>

      <FlatList
        data={data}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
        renderItem={({ item }) => {
          const total = item.items.length
            ? item.items.reduce((s, x) => s + x.qty * x.unitPrice, 0)
            : item.total ?? 0;

          return (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(customer)/invoice/[id]",
                  params: { id: item.id },
                })
              }
              style={{ marginBottom: 12 }}
            >
              <Card>
                <View style={styles.row}>
                  {/* ✅ Keep badge visible by truncating title */}
                  <View style={styles.titleWrap}>
                    <AppText
                      variant="subtitle"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={styles.invoiceTitle}
                    >
                      Invoice #{shortInvoiceId(item.id)}
                    </AppText>
                  </View>

                  <StatusBadge status={item.status} />
                </View>

                <AppText color={AppColors.muted} style={{ marginTop: 6 }}>
                  Date: {formatDate(item.createdAt)}
                </AppText>

                <AppText style={{ marginTop: 6 }}>
                  Total: {formatToman(total)}
                </AppText>
              </Card>
            </Pressable>
          );
        }}
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
                No invoices found.
              </AppText>
            )
          ) : loading ? (
            <AppText color={AppColors.muted} style={{ marginTop: 12 }}>
              Loading...
            </AppText>
          ) : (
            <AppText color={AppColors.muted} style={{ marginTop: 12 }}>
              No invoices found for this phone number.
            </AppText>
          )
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    paddingHorizontal: 16,

    // ✅ Title closer to header
    paddingTop: 10,
  },

  pageTitle: {
    marginTop: 4,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },

  // ✅ Helps truncation work correctly
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  invoiceTitle: {
    flexShrink: 1,
  },
});
