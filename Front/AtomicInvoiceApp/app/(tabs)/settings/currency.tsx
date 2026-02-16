import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";
import Card from "@/components/ui/Card";
import { AppColors } from "@/constants/appColors";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ApiError, USE_REAL_API } from "@/src/lib/api";
import {
  CurrencyCode,
  getBaseCurrency,
  setBaseCurrency,
} from "@/src/lib/sellerSettingsApi";

const CURRENCIES: CurrencyCode[] = ["IRT", "IRR", "USD", "EUR"];

export default function CurrencySettingsScreen() {
  const router = useRouter();
  const [baseCurrency, setBaseCurrencyState] = useState<CurrencyCode>("IRT");
  const [loading, setLoading] = useState(USE_REAL_API);
  const [error, setError] = useState("");

  const safeGoBack = () => {
    if (router.canGoBack?.()) {
      router.back();
      return;
    }
    router.push("/(tabs)/settings");
  };

  useEffect(() => {
    if (!USE_REAL_API) return;
    let mounted = true;
    (async () => {
      try {
        setError("");
        const res = await getBaseCurrency();
        if (mounted) setBaseCurrencyState(res.baseCurrency);
      } catch (e) {
        const err = e as ApiError;
        if (mounted) setError(err.message || "Failed to load currency");
      } finally {
        if (mounted) setLoading(false);
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
      <View style={styles.titleRow}>
        <Pressable onPress={safeGoBack} hitSlop={12} style={styles.backBtn}>
          <Image
            source={require("../../assets/icons/common/back.png")}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </Pressable>
        <AppText style={styles.pageTitle}>Currency</AppText>
      </View>

      <Card style={styles.panel}>
        <AppText variant="subtitle">Base currency</AppText>
        <AppText color={AppColors.muted} style={{ marginTop: 6 }}>
          Used as the default currency for new invoices.
        </AppText>

        {loading ? (
          <AppText color={AppColors.muted} style={{ marginTop: 10 }}>
            Loading...
          </AppText>
        ) : (
          <View style={styles.currencyRow}>
            {CURRENCIES.map((c) => (
              <AppButton
                key={c}
                title={c}
                variant={baseCurrency === c ? "primary" : "outline"}
                onPress={() => setBaseCurrencyState(c)}
                style={{ flex: 1, height: 36 }}
              />
            ))}
          </View>
        )}

        {!!error && (
          <AppText color={AppColors.danger} style={{ marginTop: 8 }}>
            {error}
          </AppText>
        )}

        <AppButton
          title="Save"
          onPress={async () => {
            if (!USE_REAL_API) return;
            try {
              setError("");
              setLoading(true);
              const res = await setBaseCurrency(baseCurrency);
              setBaseCurrencyState(res.baseCurrency);
            } catch (e) {
              const err = e as ApiError;
              setError(err.message || "Failed to save currency");
            } finally {
              setLoading(false);
            }
          }}
          style={{ marginTop: 12 }}
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
  currencyRow: { flexDirection: "row", gap: 8, marginTop: 10 },
});
