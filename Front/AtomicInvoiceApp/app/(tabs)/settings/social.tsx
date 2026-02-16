import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";
import { AppColors } from "@/constants/appColors";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from "react-native";

export default function SocialSettingsScreen() {
  const router = useRouter();

  const safeGoBack = () => {
    if (router.canGoBack?.()) {
      router.back();
      return;
    }
    router.push("/(tabs)/settings");
  };

  const [instagramId, setInstagramId] = useState("");
  const [whatsAppNumber, setWhatsAppNumber] = useState("");
  const [telegramId, setTelegramId] = useState("");

  const canSubmit = useMemo(() => {
    // اگر خواستی سختگیرانه‌ترش کنی (مثلاً حداقل یکی پر باشه)، همین خوبه:
    return (
      instagramId.trim().length > 0 ||
      whatsAppNumber.trim().length > 0 ||
      telegramId.trim().length > 0
    );
  }, [instagramId, telegramId, whatsAppNumber]);

  const onSubmit = async () => {
    // فعلا UI only — بعدا اینجا ذخیره‌سازی/API رو اضافه می‌کنیم
    // مثال:
    // await saveSocialSettings({ instagramId, whatsAppNumber, telegramId });
    safeGoBack();
  };

  return (
    <View style={styles.screen}>
      {/* هدر ثابت اپ */}
      {/* <DashboardHeader /> */}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title Row (Back کنار عنوان، مثل دیزاین) */}
          <View style={styles.titleRow}>
            <Pressable onPress={() => safeGoBack()} hitSlop={10}>
              <Image
                source={require("../../assets/icons/common/back.png")}
                style={styles.backIcon}
                resizeMode="contain"
              />
            </Pressable>

            <AppText style={styles.pageTitle}>Social Media</AppText>
          </View>

          {/* Inputs */}
          <View style={{ marginTop: 10 }}>
            <View style={styles.inputRow}>
              <Image
                source={require("../../assets/icons/common/instagram.png")}
                style={styles.leftIcon}
                resizeMode="contain"
              />
              <TextInput
                value={instagramId}
                onChangeText={setInstagramId}
                placeholder="Instagram ID"
                placeholderTextColor={AppColors.muted}
                style={styles.input}
              />
            </View>

            <View style={styles.inputRow}>
              <Image
                source={require("../../assets/icons/common/whatsapp.png")}
                style={styles.leftIcon}
                resizeMode="contain"
              />
              <TextInput
                value={whatsAppNumber}
                onChangeText={setWhatsAppNumber}
                placeholder="WhatsApp Number"
                placeholderTextColor={AppColors.muted}
                keyboardType="phone-pad"
                style={styles.input}
              />
            </View>

            <View style={styles.inputRow}>
              <Image
                source={require("../../assets/icons/common/telegram.png")}
                style={styles.leftIcon}
                resizeMode="contain"
              />
              <TextInput
                value={telegramId}
                onChangeText={setTelegramId}
                placeholder="Telegram ID"
                placeholderTextColor={AppColors.muted}
                style={styles.input}
              />
            </View>
          </View>

          {/* Submit */}
          <AppButton
            title="Submit"
            onPress={onSubmit}
            disabled={!canSubmit}
            style={{ marginTop: 18 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginTop: 6,
  },
  backIcon: { width: 22, height: 22 },

  pageTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: AppColors.text,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginTop: 12,
  },
  leftIcon: {
    width: 22,
    height: 22,
    marginRight: 10,
    opacity: 0.9,
  },
  input: {
    flex: 1,
    color: AppColors.text,
    paddingVertical: 0,
  },
});
