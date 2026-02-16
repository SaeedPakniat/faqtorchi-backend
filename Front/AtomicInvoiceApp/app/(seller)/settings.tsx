import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import AppButton from "../../components/ui/AppButton";
import AppText from "../../components/ui/AppText";
import Card from "../../components/ui/Card";
import { AppColors } from "../../constants/appColors";
import {
  cancelAllInvoiceReminders,
  scheduleInvoiceReminders,
} from "../../src/notifications/invoiceReminders";
import { useAuth } from "../../src/store/auth/AuthContext";
import { useInvoices } from "../../src/store/invoices/InvoicesContext";

export default function SellerSettings() {
  const { auth, logout } = useAuth();
  const router = useRouter();
  const [daysBefore, setDaysBefore] = useState<1 | 2 | 3>(2);
  const { invoices } = useInvoices();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <AppText variant="title">Settings</AppText>

      <Card style={{ marginTop: 16 }}>
        <AppText variant="subtitle">User Info</AppText>
        <AppText color={AppColors.muted} style={{ marginTop: 6 }}>
          Phone: {auth.phone}
        </AppText>
        <AppText color={AppColors.muted} style={{ marginTop: 6 }}>
          Role: Seller
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

      <Card style={{ marginTop: 12 }}>
        <AppText variant="subtitle">Reminders</AppText>
        <AppText color={AppColors.muted} style={{ marginTop: 6 }}>
          Remind how many days before due date:
        </AppText>

        <View style={{ flexDirection: "row", marginTop: 10 }}>
          <AppButton
            title="1 day"
            variant={daysBefore === 1 ? "primary" : "outline"}
            onPress={() => setDaysBefore(1)}
            style={{ flex: 1, marginRight: 6 }}
          />
          <AppButton
            title="2 days"
            variant={daysBefore === 2 ? "primary" : "outline"}
            onPress={() => setDaysBefore(2)}
            style={{ flex: 1, marginHorizontal: 3 }}
          />
          <AppButton
            title="3 days"
            variant={daysBefore === 3 ? "primary" : "outline"}
            onPress={() => setDaysBefore(3)}
            style={{ flex: 1, marginLeft: 6 }}
          />
        </View>

        <AppButton
          title="Enable reminders for open invoices"
          onPress={async () => {
            // ساده: اول همه scheduleهای قبلی را پاک می‌کنیم
            await cancelAllInvoiceReminders();

            const openInvoices = invoices.filter((x) => x.status !== "paid");
            for (const inv of openInvoices) {
              await scheduleInvoiceReminders({ invoice: inv, daysBefore });
            }
          }}
          style={{ marginTop: 12 }}
        />

        <AppButton
          title="Remove all reminders"
          variant="outline"
          onPress={async () => {
            await cancelAllInvoiceReminders();
          }}
          style={{ marginTop: 10 }}
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
    // justifyContent: "center",
  },
});
