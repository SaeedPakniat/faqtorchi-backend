import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppText from "@/components/ui/AppText";
import Card from "@/components/ui/Card";
import { AppColors } from "@/constants/appColors";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";

type RadioOption<T extends string> = { key: T; label: string };

function RadioRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: RadioOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ marginTop: 12 }}>
      <AppText style={styles.fieldLabel}>{label}</AppText>

      <View style={styles.radioRow}>
        {options.map((op) => {
          const active = op.key === value;
          return (
            <Pressable
              key={op.key}
              onPress={() => onChange(op.key)}
              style={styles.radioItem}
              hitSlop={10}
            >
              <View
                style={[
                  styles.radioOuter,
                  { borderColor: active ? "#F59E0B" : AppColors.border },
                ]}
              >
                {active && <View style={styles.radioInner} />}
              </View>
              <AppText style={styles.radioText}>{op.label}</AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function ProductSettingsScreen() {
  const router = useRouter();

  const safeGoBack = () => {
    if (router.canGoBack?.()) {
      router.back();
      return;
    }
    router.push("/(tabs)/settings");
  };

  const [displayType, setDisplayType] = useState<"list" | "with_photo">("list");
  const [tax, setTax] = useState<"active" | "not_active">("active");
  const [taxPercent, setTaxPercent] = useState("");
  const [barcode, setBarcode] = useState<"active" | "not_active">("active");

  const canSubmit = useMemo(() => {
    // اگر tax فعال بود، درصد باید عدد معتبر باشه (اختیاری: می‌تونی سخت‌گیرتر کنی)
    if (tax === "active") {
      const n = Number(taxPercent);
      if (!taxPercent.trim()) return false;
      if (!Number.isFinite(n) || n < 0 || n > 100) return false;
    }
    return true;
  }, [tax, taxPercent]);

  return (
    <View style={styles.screen}>
      {/* ✅ Header ثابت اپ */}
      {/* <DashboardHeader /> */}

      {/* ✅ Title row (Back کنار عنوان) */}
      <View style={styles.titleRow}>
        <Pressable onPress={() => safeGoBack()} hitSlop={12}>
          <Image
            source={require("../../assets/icons/common/back.png")}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </Pressable>

        <AppText style={styles.pageTitle}>product Settings</AppText>
      </View>

      <Card style={styles.panel}>
        <RadioRow
          label="Display type:"
          value={displayType}
          onChange={setDisplayType}
          options={[
            { key: "list", label: "List" },
            { key: "with_photo", label: "with photo" },
          ]}
        />

        <RadioRow
          label="tax:"
          value={tax}
          onChange={setTax}
          options={[
            { key: "active", label: "active" },
            { key: "not_active", label: "not active" },
          ]}
        />

        <View style={{ marginTop: 12 }}>
          <AppInput
            label="Tax percentage:"
            value={taxPercent}
            onChangeText={setTaxPercent}
            placeholder="Tax percentage"
            keyboardType="number-pad"
            editable={tax === "active"}
            style={tax !== "active" ? { opacity: 0.5 } : undefined}
          />
        </View>

        <RadioRow
          label="Barcode generation:"
          value={barcode}
          onChange={setBarcode}
          options={[
            { key: "active", label: "active" },
            { key: "not_active", label: "not active" },
          ]}
        />

        <AppButton
          title="Submit"
          disabled={!canSubmit}
          onPress={() => {
            // TODO: save settings in store later
            router.back();
          }}
          style={{ marginTop: 16 }}
        />
      </Card>
    </View>
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
    marginTop: 4,
    marginBottom: 10,
  },
  backIcon: { width: 18, height: 18 },
  pageTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: AppColors.text,
  },

  panel: {
    marginTop: 8,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: "#fff",
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: AppColors.text,
  },

  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginTop: 10,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F59E0B",
  },
  radioText: {
    fontSize: 12,
    fontWeight: "700",
    color: AppColors.text,
  },
});
