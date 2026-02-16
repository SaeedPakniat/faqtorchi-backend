import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppText from "@/components/ui/AppText";
import Card from "@/components/ui/Card";
import { AppColors } from "@/constants/appColors";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ApiError, USE_REAL_API } from "@/src/lib/api";
import {
  getNotificationSettings,
  setNotificationSettings,
} from "@/src/lib/sellerSettingsApi";

function RadioRow({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const yellow = "#F5B700";

  return (
    <View style={styles.radioRow}>
      <Pressable style={styles.radioItem} onPress={() => onChange(true)}>
        <View
          style={[
            styles.radioDot,
            { backgroundColor: value ? yellow : "transparent" },
          ]}
        />
        <AppText style={styles.radioText}>active</AppText>
      </Pressable>

      <Pressable style={styles.radioItem} onPress={() => onChange(false)}>
        <View
          style={[
            styles.radioDot,
            { backgroundColor: !value ? yellow : "transparent" },
          ]}
        />
        <AppText style={styles.radioText}>not active</AppText>
      </Pressable>
    </View>
  );
}

export default function NotificationSettingsScreen() {
  const router = useRouter();

  const safeGoBack = () => {
    if (router.canGoBack?.()) {
      router.back();
      return;
    }
    router.push("/(tabs)/settings");
  };

  const [sendInvoiceSms, setSendInvoiceSms] = useState(true);
  const [sendInvoiceWhatsapp, setSendInvoiceWhatsapp] = useState(true);
  const [invoicePaymentDetails, setInvoicePaymentDetails] = useState("");

  const [welcomeSms, setWelcomeSms] = useState(true);
  const [welcomeWhatsapp, setWelcomeWhatsapp] = useState(true);
  const [welcomeSmsFormat, setWelcomeSmsFormat] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [apiError, setApiError] = useState("");
  const [apiLoading, setApiLoading] = useState(USE_REAL_API);

  useEffect(() => {
    if (!USE_REAL_API) return;
    let mounted = true;
    (async () => {
      try {
        const res = await getNotificationSettings();
        if (!mounted) return;
        setSendInvoiceSms(res.notifyInvoiceIssued);
        setWelcomeSms(res.notifyPaymentReminder);
        setSendInvoiceWhatsapp(res.notifyInvoiceStatusChange);
        setWelcomeWhatsapp(res.notifyLowStock);
        setLowStockThreshold(String(res.lowStockThreshold ?? 5));
      } catch (e) {
        const err = e as ApiError;
        if (mounted) setApiError(err.message || "Failed to load settings");
      } finally {
        if (mounted) setApiLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 28 }}
      showsVerticalScrollIndicator={false}
    >
      {/* <DashboardHeader /> */}

      {/* Title row */}
      <View style={styles.titleRow}>
        <Pressable
          onPress={() => safeGoBack()}
          hitSlop={12}
          style={styles.backBtn}
        >
          <Image
            source={require("../../assets/icons/common/back.png")}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </Pressable>
        <AppText style={styles.pageTitle}>Notification</AppText>
      </View>

      <Card style={styles.panel}>
        <View>
          <AppText style={styles.label}>
            Sending invoice amount with SMS
          </AppText>
          <RadioRow value={sendInvoiceSms} onChange={setSendInvoiceSms} />
        </View>

        <View style={{ marginTop: 10 }}>
          <AppText style={styles.label}>Sending invoice with Whatsapp</AppText>
          <RadioRow
            value={sendInvoiceWhatsapp}
            onChange={setSendInvoiceWhatsapp}
          />
        </View>

        <View style={{ marginTop: 10 }}>
          <AppInput
            label="Invoice payment details"
            value={invoicePaymentDetails}
            onChangeText={setInvoicePaymentDetails}
            placeholder="Invoice payment details"
            multiline
            style={{ minHeight: 92 }}
          />
        </View>

        <View style={{ marginTop: 10 }}>
          <AppText style={styles.label}>Welcome SMS</AppText>
          <RadioRow value={welcomeSms} onChange={setWelcomeSms} />
        </View>

        <View style={{ marginTop: 10 }}>
          <AppText style={styles.label}>Welcome whatsapp</AppText>
          <RadioRow value={welcomeWhatsapp} onChange={setWelcomeWhatsapp} />
        </View>

        <View style={{ marginTop: 10 }}>
          <AppInput
            label="Welcome SMS format"
            value={welcomeSmsFormat}
            onChangeText={setWelcomeSmsFormat}
            placeholder="Welcome SMS format"
            multiline
            style={{ minHeight: 110 }}
          />
        </View>
        <View style={{ marginTop: 10 }}>
          <AppInput
            label="Low stock threshold"
            value={lowStockThreshold}
            onChangeText={setLowStockThreshold}
            placeholder="5"
            keyboardType="number-pad"
          />
        </View>
        {!!apiError && (
          <AppText color={AppColors.danger} style={{ marginTop: 10 }}>
            {apiError}
          </AppText>
        )}

        <AppButton
          title={apiLoading ? "Saving..." : "Submit"}
          disabled={apiLoading}
          onPress={async () => {
            if (!USE_REAL_API) return;
            try {
              setApiError("");
              setApiLoading(true);
              await setNotificationSettings({
                notifyInvoiceIssued: sendInvoiceSms,
                notifyInvoiceStatusChange: sendInvoiceWhatsapp,
                notifyPaymentReminder: welcomeSms,
                notifyLowStock: welcomeWhatsapp,
                lowStockThreshold: Number(lowStockThreshold) || 5,
              });
              router.back();
            } catch (e) {
              const err = e as ApiError;
              setApiError(err.message || "Failed to save settings");
            } finally {
              setApiLoading(false);
            }
          }}
          style={{ marginTop: 16 }}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
    paddingHorizontal: 16,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
    marginBottom: 10,
  },
  backBtn: { padding: 6 },
  backIcon: { width: 20, height: 20 },
  pageTitle: { fontSize: 16, fontWeight: "800", color: AppColors.text },

  panel: { marginTop: 6, padding: 14 },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: AppColors.text,
    marginBottom: 6,
  },

  radioRow: { flexDirection: "row", gap: 22, alignItems: "center" },
  radioItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  radioText: { fontSize: 12, fontWeight: "600", color: AppColors.text },
});
