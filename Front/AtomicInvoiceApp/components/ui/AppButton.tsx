import { AppColors } from "@/constants/appColors";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from "react-native";
import AppText from "./AppText";

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>; // ✅ اضافه شد
  variant?: "primary" | "outline";
  textVariant?: "title" | "subtitle" | "body" | "small"; // ✅ اختیاری برای کنترل variant
};

export default function AppButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
  variant = "primary",
  textVariant = "subtitle",
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        variant === "primary" ? styles.primary : styles.outline,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator />
      ) : (
        <AppText
          variant={textVariant}
          color={variant === "primary" ? "#fff" : AppColors.primary}
          style={textStyle} // ✅ اینجا اعمال میشه
        >
          {title}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primary: { backgroundColor: AppColors.primary },
  outline: {
    borderWidth: 1,
    borderColor: AppColors.primary,
    backgroundColor: "transparent",
  },
  disabled: { opacity: 0.6 },
});
