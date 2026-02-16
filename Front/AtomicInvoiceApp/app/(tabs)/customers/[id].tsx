import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";
import Card from "@/components/ui/Card";
import { AppColors } from "@/constants/appColors";
import { ApiError, USE_REAL_API } from "@/src/lib/api";
import { ApiCustomer, getCustomerById } from "@/src/lib/customerApi";

export default function CustomerDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ? Number(params.id) : NaN;

  const [apiCustomer, setApiCustomer] = useState<ApiCustomer | null>(null);
  const [apiLoading, setApiLoading] = useState(USE_REAL_API);
  const [apiError, setApiError] = useState("");

  useFocusEffect(
    useCallback(() => {
      if (!USE_REAL_API || !Number.isFinite(id)) return;
      let active = true;
      setApiLoading(true);
      setApiError("");

      (async () => {
        try {
          const res = await getCustomerById(id);
          if (active) setApiCustomer(res.customer ?? null);
        } catch (e) {
          const err = e as ApiError;
          if (active) setApiError(err.message || "Failed to load customer");
        } finally {
          if (active) setApiLoading(false);
        }
      })();

      return () => {
        active = false;
      };
    }, [id]),
  );

  if (!USE_REAL_API) {
    return (
      <View style={styles.container}>
        <AppText variant="title">Customer</AppText>
        <AppText color={AppColors.muted} style={{ marginTop: 8 }}>
          Customer details are only available in real API mode.
        </AppText>
      </View>
    );
  }

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
          variant="outline"
          onPress={() => router.back()}
          style={{ marginTop: 12 }}
        />
      </View>
    );
  }

  if (!apiCustomer) {
    return (
      <View style={styles.container}>
        <AppText variant="title">Customer not found</AppText>
        <AppButton
          title="Back"
          variant="outline"
          onPress={() => router.back()}
          style={{ marginTop: 12 }}
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
      <AppText variant="title">{apiCustomer.name || "Customer"}</AppText>

      <Card style={{ marginTop: 12 }}>
        <AppText variant="subtitle">Contact</AppText>
        <AppText color={AppColors.muted} style={{ marginTop: 6 }}>
          Phone: {apiCustomer.phone}
        </AppText>
        {!!apiCustomer.notes && (
          <AppText color={AppColors.muted} style={{ marginTop: 6 }}>
            Notes: {apiCustomer.notes}
          </AppText>
        )}
        {!!apiCustomer.balances?.length && (
          <AppText color={AppColors.muted} style={{ marginTop: 8, fontSize: 12 }}>
            Due:{" "}
            {apiCustomer.balances
              .map((b) => `${Number(b.due ?? 0).toLocaleString()} ${b.currency}`)
              .join(" • ")}
          </AppText>
        )}
      </Card>

      <AppButton
        title="Create Invoice"
        onPress={() => router.push("/(tabs)/invoices/new")}
        style={{ marginTop: 16 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    paddingHorizontal: 16,
    paddingTop: 0,
  },
});
