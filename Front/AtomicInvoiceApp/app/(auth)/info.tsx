// app/(auth)/info.tsx
import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppText from "@/components/ui/AppText";
import DashboardHeader from "@/components/ui/DashboardHeader";
import { AppColors } from "@/constants/appColors";
import { useAuth } from "@/src/store/auth/AuthContext";
import { setProfileForPhone } from "@/src/store/auth/profileRegistry";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

export default function InfoCompletionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string }>();
  const { auth } = useAuth();

  // phone can come from onboarding (params) OR edit mode (auth)
  const initialPhone = (params.phone ?? auth.phone ?? "").trim();

  const [businessType, setBusinessType] = useState<"restaurant" | "shop">(
    "shop",
  );
  const [shopName, setShopName] = useState("");
  const [desc, setDesc] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState(initialPhone);
  const [socialMedia, setSocialMedia] = useState("");

  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Bottom sheet state + animation
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetAnim = useRef(new Animated.Value(0)).current; // 0 closed, 1 open

  const nameLabel = businessType === "shop" ? "Shop Name:" : "Restaurant Name:";
  const namePlaceholder =
    businessType === "shop" ? "shop name" : "restaurant name";

  const canSubmit = useMemo(() => {
    return (
      shopName.trim().length >= 2 &&
      desc.trim().length >= 2 &&
      address.trim().length >= 2 &&
      phone.trim().length >= 8
    );
  }, [shopName, desc, address, phone]);

  const openSheet = () => {
    setSheetOpen(true);
    Animated.timing(sheetAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setSheetOpen(false);
    });
  };

  async function pickFromLibrary() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
        aspect: [1, 1],
      });

      if (!res.canceled && res.assets?.[0]?.uri) {
        setLogoUri(res.assets[0].uri);
      }
    } finally {
      closeSheet();
    }
  }

  async function pickFromCamera() {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;

      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.85,
        aspect: [1, 1],
      });

      if (!res.canceled && res.assets?.[0]?.uri) {
        setLogoUri(res.assets[0].uri);
      }
    } finally {
      closeSheet();
    }
  }

  const overlayOpacity = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.35],
  });

  const sheetTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [220, 0],
  });

  return (
    <View style={styles.screen}>
      {/* Fixed header (do not change the menu) */}
      <DashboardHeader />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title row: back next to the title */}
        <View style={styles.titleRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.backBtn}
          >
            <Image
              source={require("../assets/icons/common/back.png")}
              style={styles.backIcon}
              resizeMode="contain"
            />
          </Pressable>

          <AppText style={styles.title}>Complete Profile</AppText>
        </View>

        {/* Upload (tap to open bottom sheet) */}
        <Pressable onPress={openSheet} style={styles.uploadWrap} hitSlop={10}>
          <View style={styles.uploadCircle}>
            {logoUri ? (
              <Image
                source={{ uri: logoUri }}
                style={styles.logoPreview}
                resizeMode="cover"
              />
            ) : (
              <Image
                source={require("../assets/icons/common/upload-img.png")}
                style={styles.uploadIcon}
                resizeMode="contain"
              />
            )}
          </View>

          <AppText color={AppColors.muted} style={styles.uploadLabel}>
            logo image
          </AppText>
        </Pressable>

        {/* Radio: restaurant / shop */}
        <View style={styles.radioRow}>
          <RadioItem
            label="restaurant"
            active={businessType === "restaurant"}
            onPress={() => setBusinessType("restaurant")}
          />
          <RadioItem
            label="shop"
            active={businessType === "shop"}
            onPress={() => setBusinessType("shop")}
          />
        </View>

        {/* Form */}
        <View style={styles.panel}>
          <AppInput
            label={nameLabel}
            value={shopName}
            onChangeText={setShopName}
            placeholder={namePlaceholder}
          />

          {/* bigger description box */}
          <AppInput
            label="Descriptions"
            value={desc}
            onChangeText={setDesc}
            placeholder="Descriptions"
            style={styles.bigInput}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <AppInput
            label="Address:"
            value={address}
            onChangeText={setAddress}
            placeholder="Address"
            style={{ marginTop: 10 }}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Phone row + Clear button */}
          <View style={styles.phoneRow}>
            <View style={{ flex: 1 }}>
              <AppInput
                label="Phone:"
                value={phone}
                onChangeText={setPhone}
                placeholder="phone"
                keyboardType="number-pad"
              />
            </View>

            <Pressable
              onPress={() => setPhone("")}
              style={styles.newBtn}
              hitSlop={10}
              disabled={submitting}
            >
              <AppText style={styles.newBtnText}>Clear</AppText>
            </Pressable>
          </View>

          {/* Social media */}
          <AppInput
            label="Social media:"
            value={socialMedia}
            onChangeText={setSocialMedia}
            placeholder="e.g. @yourpage..."
            style={{ marginTop: 10 }}
          />

          <AppButton
            title={submitting ? "Submitting..." : "Submit"}
            disabled={!canSubmit || submitting}
            onPress={async () => {
              if (!canSubmit || submitting) return;

              setSubmitting(true);
              try {
                await setProfileForPhone(phone.trim(), {
                  shopName: shopName.trim(),
                  description: desc.trim(),
                  address: address.trim(),
                  phone: phone.trim(),
                  businessType,
                  socialMedia: socialMedia.trim() || undefined,
                  logoUri: logoUri || undefined,
                } as any);

                router.replace("/gate");
              } finally {
                setSubmitting(false);
              }
            }}
            style={{ marginTop: 16 }}
          />
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Bottom Sheet (Gallery / Camera) */}
      <Modal visible={sheetOpen} transparent animationType="none">
        <View style={StyleSheet.absoluteFill}>
          {/* Overlay */}
          <Pressable onPress={closeSheet} style={StyleSheet.absoluteFill}>
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: "#000", opacity: overlayOpacity },
              ]}
            />
          </Pressable>

          {/* Sheet */}
          <Animated.View
            style={[
              styles.sheet,
              {
                transform: [{ translateY: sheetTranslateY }],
              },
            ]}
          >
            <Pressable
              style={styles.sheetRowLeftIcon}
              onPress={pickFromLibrary}
            >
              <Image
                source={require("../assets/icons/common/gallery.png")}
                style={styles.sheetIcon}
                resizeMode="contain"
              />
              <AppText style={styles.sheetText}>Choose from gallery</AppText>
            </Pressable>

            <View style={styles.sheetDivider} />

            <Pressable style={styles.sheetRowLeftIcon} onPress={pickFromCamera}>
              <Image
                source={require("../assets/icons/common/camera.png")}
                style={styles.sheetIcon}
                resizeMode="contain"
              />
              <AppText style={styles.sheetText}>Take photo</AppText>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

function RadioItem(props: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { label, active, onPress } = props;
  return (
    <Pressable onPress={onPress} style={styles.radioItem} hitSlop={10}>
      <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
        {active ? <View style={styles.radioInner} /> : null}
      </View>
      <AppText style={styles.radioLabel}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 12,
    gap: 3,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { width: 24, height: 24 },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: AppColors.primary,
  },

  uploadWrap: { alignItems: "center", marginBottom: 14, marginTop: 6 },
  uploadCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#EFEFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  uploadIcon: { width: 34, height: 34, opacity: 0.6 },
  logoPreview: { width: "100%", height: "100%" },
  uploadLabel: { marginTop: 8, fontSize: 12 },

  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 22,
    marginBottom: 12,
    marginTop: 6,
  },
  radioItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  radioOuterActive: { borderColor: AppColors.primary },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.primary,
  },
  radioLabel: { fontSize: 12, fontWeight: "600" },

  panel: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
  },

  bigInput: {
    marginTop: 10,
    minHeight: 120,
  },

  phoneRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    marginTop: 10,
  },
  newBtn: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: AppColors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  newBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },

  // Bottom Sheet styles
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 18,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  sheetRowLeftIcon: {
    height: 62,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 12,
  },
  sheetText: {
    fontSize: 14,
    fontWeight: "700",
    color: AppColors.text,
  },
  sheetIcon: {
    width: 22,
    height: 22,
    opacity: 0.9,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: AppColors.border,
    marginHorizontal: 16,
  },
});
