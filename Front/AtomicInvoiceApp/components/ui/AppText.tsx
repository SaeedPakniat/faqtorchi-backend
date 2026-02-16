// app/components/ui/AppText.tsx
import { AppColors } from "@/constants/appColors";
import { Typography } from "@/constants/typography";
import React from "react";
import { StyleSheet, Text, TextProps } from "react-native";

type Props = TextProps & {
  variant?: "title" | "subtitle" | "body" | "small";
  color?: string;
};

export default function AppText({
  variant = "body",
  color = AppColors.text,
  style,
  ...rest
}: Props) {
  return (
    <Text style={[styles.base, styles[variant], { color }, style]} {...rest} />
  );
}

const styles = StyleSheet.create({
  base: {
    // بعداً فونت فارسی رو همینجا ست می‌کنیم
  },

  title: { ...Typography.title },
  subtitle: { ...Typography.subtitle },
  body: { ...Typography.body },
  small: { ...Typography.small },
});
