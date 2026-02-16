import React from "react";
import { StyleSheet, TextInput, TextInputProps, View } from "react-native";
import { AppColors } from "../../constants/appColors";
import AppText from "./AppText";

type Props = TextInputProps & {
  label?: string;
  error?: string;
};

export default function AppInput({ label, error, style, ...rest }: Props) {
  return (
    <View style={{ gap: 6 }}>
      {label ? <AppText variant="subtitle">{label}</AppText> : null}

      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={AppColors.muted}
        {...rest}
      />

      {error ? (
        <AppText variant="small" color={AppColors.danger}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: AppColors.text,
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: AppColors.danger,
  },
});
