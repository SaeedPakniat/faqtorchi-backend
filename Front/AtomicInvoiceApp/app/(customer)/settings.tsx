// app/(customer)/settings.tsx
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet } from "react-native";

import AppButton from "../../components/ui/AppButton";
import AppText from "../../components/ui/AppText";
import Card from "../../components/ui/Card";
import { AppColors } from "../../constants/appColors";
import { useAuth } from "../../src/store/auth/AuthContext";

export default function CustomerSettings() {
  const { auth, logout } = useAuth();
  const router = useRouter();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <AppText variant="title">Settings</AppText>

      <Card style={{ marginTop: 16 }}>
        <AppText variant="subtitle">User Information</AppText>

        <AppText color={AppColors.muted} style={{ marginTop: 6 }}>
          Phone: {auth.phone}
        </AppText>

        <AppText color={AppColors.muted} style={{ marginTop: 6 }}>
          Role: Customer
        </AppText>

        <AppButton
          title="Sign out"
          onPress={() => {
            logout();
            router.replace("/gate");
          }}
          style={{ marginTop: 12 }}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    padding: 16,
    paddingTop: 100,
  },
});
