// app/(auth)/role.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";

import AppButton from "../../components/ui/AppButton";
import AppText from "../../components/ui/AppText";
import Card from "../../components/ui/Card";
import { AppColors } from "../../constants/appColors";
import { useAuth } from "../../src/store/auth/AuthContext";
import { setRoleForPhone } from "../../src/store/auth/roleRegistry";

export default function RoleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string }>();
  const phone = (params.phone ?? "").trim();
  const { setRole } = useAuth();

  const [submitting, setSubmitting] = useState(false);

  const goSeller = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      setRole("seller");
      if (phone) await setRoleForPhone(phone, "seller");
      router.replace({ pathname: "/(auth)/info", params: { phone } } as any);
    } finally {
      setSubmitting(false);
    }
  };

  const goCustomer = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      setRole("customer");
      if (phone) await setRoleForPhone(phone, "customer");
      router.replace("/gate");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppText variant="title">Select a role</AppText>
      <AppText color={AppColors.muted} style={{ marginTop: 6 }}>
        Phone: {phone || "..."}
      </AppText>

      <Card style={{ marginTop: 16 }}>
        <AppText variant="subtitle">Continue as</AppText>

        <AppButton
          title={submitting ? "Please wait..." : "Seller"}
          onPress={goSeller}
          style={{ marginTop: 12 }}
          disabled={submitting}
        />
        <AppButton
          title="Customer"
          onPress={goCustomer}
          variant="outline"
          style={{ marginTop: 10 }}
          disabled={submitting}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    padding: 16,
    justifyContent: "center",
  },
});
