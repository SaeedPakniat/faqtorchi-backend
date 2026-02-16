import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppText from "@/components/ui/AppText";
import Card from "@/components/ui/Card";
import { AppColors } from "@/constants/appColors";
import { ApiError, USE_REAL_API } from "@/src/lib/api";
import { ApiCustomer, listCustomers } from "@/src/lib/customerApi";

type CustomerRow = {
  id: number | string;
  name?: string | null;
  phone: string;
  notes?: string | null;
  balances?: { currency: "IRR" | "IRT" | "USD" | "EUR"; due: number }[];
};

const FAKE_CUSTOMERS: CustomerRow[] = [
  { id: "00324", name: "Sajedeh Badi'e", phone: "09173829972", notes: "active" },
  { id: "00384", name: "Saeed Pakniat", phone: "09039600338", notes: "active" },
];

export default function CustomersScreen() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [apiLoading, setApiLoading] = useState(USE_REAL_API);
  const [apiError, setApiError] = useState("");
  const [apiCustomers, setApiCustomers] = useState<ApiCustomer[]>([]);

  useEffect(() => {
    if (!USE_REAL_API) return;
    let mounted = true;
    (async () => {
      try {
        setApiError("");
        const res = await listCustomers({ page: 1, pageSize: 50, q: q.trim() || undefined });
        if (mounted) setApiCustomers(res.customers);
      } catch (e) {
        const err = e as ApiError;
        if (mounted) setApiError(err.message || "Failed to load customers");
      } finally {
        if (mounted) setApiLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [q]);

  const rows = useMemo(() => {
    if (USE_REAL_API) {
      return apiCustomers.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        notes: c.notes,
        balances:
          c.balances?.map((b) => ({
            currency: b.currency,
            due: Number(b.due ?? 0),
          })) ?? [],
      }));
    }
    const query = q.trim().toLowerCase();
    if (!query) return FAKE_CUSTOMERS;
    return FAKE_CUSTOMERS.filter((c) => (c.name ?? "").toLowerCase().includes(query));
  }, [apiCustomers, q]);

  return (
    <View style={styles.screen}>
      <View style={styles.topRow}>
        <AppButton
          title="New Customer"
          onPress={() => router.push("/(tabs)/customers/new")}
          style={styles.newBtn}
        />
      </View>

      <View style={styles.searchWrap}>
        <AppInput
          placeholder="Search Customer Name or Phone"
          value={q}
          onChangeText={setQ}
          style={styles.searchInput}
        />
      </View>

      <Card style={{ marginTop: 12, flex: 1 }}>
        <AppText variant="subtitle">Customers</AppText>

        {(USE_REAL_API ? apiLoading : false) ? (
          <AppText color={AppColors.muted} style={{ marginTop: 10 }}>
            Loading...
          </AppText>
        ) : apiError ? (
          <AppText color={AppColors.danger} style={{ marginTop: 10 }}>
            {apiError}
          </AppText>
        ) : rows.length === 0 ? (
          <AppText color={AppColors.muted} style={{ marginTop: 10 }}>
            No customers found.
          </AppText>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(it) => String(it.id)}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
            renderItem={({ item }) => (
              <Card
                style={{ marginTop: 10 }}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/customers/[id]",
                    params: { id: String(item.id) },
                  })
                }
              >
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="subtitle">{item.name || "—"}</AppText>
                    <AppText color={AppColors.muted} style={{ marginTop: 4 }}>
                      {item.phone}
                    </AppText>
                    {!!item.balances?.length && (
                      <AppText color={AppColors.muted} style={{ marginTop: 6, fontSize: 12 }}>
                        Due:{" "}
                        {item.balances
                          .map((b) => `${b.due.toLocaleString()} ${b.currency}`)
                          .join(" • ")}
                      </AppText>
                    )}
                  </View>
                  <AppButton
                    title="New Invoice"
                    onPress={() => router.push("/(tabs)/invoices/new")}
                    style={{ height: 36, borderRadius: 10 }}
                  />
                </View>

                {!!item.notes && (
                  <AppText color={AppColors.muted} style={{ marginTop: 8, fontSize: 12 }}>
                    {item.notes}
                  </AppText>
                )}
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
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  topRow: { flexDirection: "row", alignItems: "center" },
  newBtn: { height: 40, borderRadius: 12 },
  searchWrap: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 6,
  },
  searchInput: { borderWidth: 0, backgroundColor: "transparent" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
});
