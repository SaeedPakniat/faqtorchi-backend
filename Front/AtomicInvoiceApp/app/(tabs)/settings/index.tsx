import AppText from "@/components/ui/AppText";
import Card from "@/components/ui/Card";
import { AppColors } from "@/constants/appColors";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, TextInput, View } from "react-native";

type SettingRoute =
  | "/(tabs)/settings/invoice"
  | "/(tabs)/settings/product"
  | "/(tabs)/settings/printer"
  | "/(tabs)/settings/send"
  | "/(tabs)/settings/bank"
  | "/(tabs)/settings/social"
  | "/(tabs)/settings/notification"
  | "/(tabs)/settings/users"
  | "/(tabs)/settings/currency";

type SettingItem = {
  key: string;
  title: string;
  icon: any;
  href: SettingRoute;
};

export default function SettingsScreen() {
  const [q, setQ] = useState("");
  const router = useRouter();

  const items: SettingItem[] = useMemo(
    () => [
      {
        key: "invoice",
        title: "Invoice Settings",
        icon: require("../../assets/icons/settings/invoice-setting.png"),
        href: "/(tabs)/settings/invoice",
      },
      {
        key: "product",
        title: "Product Settings",
        icon: require("../../assets/icons/settings/product-setting.png"),
        href: "/(tabs)/settings/product",
      },
      {
        key: "printer",
        title: "Printer Settings",
        icon: require("../../assets/icons/settings/print-setting.png"),
        href: "/(tabs)/settings/printer",
      },
      {
        key: "send",
        title: "Send Settings",
        icon: require("../../assets/icons/settings/send-setting.png"),
        href: "/(tabs)/settings/send",
      },
      {
        key: "bank",
        title: "Bank Account",
        icon: require("../../assets/icons/settings/bank-account.png"),
        href: "/(tabs)/settings/bank",
      },
      {
        key: "social",
        title: "Social Media",
        icon: require("../../assets/icons/settings/social-media.png"),
        href: "/(tabs)/settings/social",
      },
      {
        key: "notification",
        title: "Notifications",
        icon: require("../../assets/icons/settings/notification.png"),
        href: "/(tabs)/settings/notification",
      },
      {
        key: "currency",
        title: "Currency",
        icon: require("../../assets/icons/settings/invoice-setting.png"),
        href: "/(tabs)/settings/currency",
      },
      {
        key: "users",
        title: "Multi Users",
        icon: require("../../assets/icons/settings/multi-users.png"),
        href: "/(tabs)/settings/users",
      },
    ],
    [],
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter((x) => x.title.toLowerCase().includes(query));
  }, [items, q]);

  const rows = useMemo(() => {
    const out: SettingItem[][] = [];
    for (let i = 0; i < filtered.length; i += 2)
      out.push(filtered.slice(i, i + 2));
    return out;
  }, [filtered]);

  return (
    <View style={styles.screen}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="search"
          placeholderTextColor={AppColors.muted}
          style={styles.searchInput}
        />
        <Image
          source={require("../../assets/icons/common/search-icon.png")}
          style={styles.searchIcon}
          resizeMode="contain"
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {rows.map((pair, idx) => (
          <View key={idx} style={styles.gridRow}>
            {pair.map((it) => (
              <Card
                key={it.key}
                style={styles.gridCard}
                onPress={() => router.push(it.href)}
              >
                <Image
                  source={it.icon}
                  style={styles.cardIcon}
                  resizeMode="contain"
                />
                <AppText style={styles.cardTitle}>{it.title}</AppText>
              </Card>
            ))}

            {pair.length === 1 && (
              <View style={[styles.gridCard, { opacity: 0 }]} />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
    paddingHorizontal: 16,
  },

  searchWrap: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, paddingVertical: 10, color: AppColors.text },
  searchIcon: { width: 18, height: 18, opacity: 0.6 },

  gridRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  gridCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: "#fff",
  },
  cardIcon: { width: 52, height: 52, marginBottom: 10 },
  cardTitle: { fontSize: 13, fontWeight: "700", textAlign: "center" },
});
