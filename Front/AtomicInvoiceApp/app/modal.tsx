// app/modal.tsx
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";
import { AppColors } from "@/constants/appColors";

export default function ModalScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <AppText style={styles.title}>This is a modal</AppText>

      <AppButton
        title="Close"
        onPress={() => router.back()}
        style={styles.btn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: AppColors.text,
  },
  btn: {
    marginTop: 14,
    height: 42,
    borderRadius: 12,
    paddingHorizontal: 18,
  },
});
