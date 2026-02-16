// import { AppColors } from "@/constants/appColors";
// import React from "react";
// import { StyleSheet, View, ViewProps } from "react-native";

// export default function Card({ style, ...rest }: ViewProps) {
//   return <View style={[styles.card, style]} {...rest} />;
// }

// const styles = StyleSheet.create({
//   card: {
//     backgroundColor: AppColors.surface,
//     borderRadius: 16,
//     padding: 16,
//     borderWidth: 1,
//     borderColor: AppColors.border,
//   },
// });

// components/ui/Card.tsx
import React from "react";
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from "react-native";

type Props = {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  onPress?: PressableProps["onPress"];
} & Omit<ViewProps, "style">;

export default function Card({ style, children, onPress, ...rest }: Props) {
  const Container: any = onPress ? Pressable : View;

  return (
    <Container
      {...rest}
      onPress={onPress}
      android_ripple={onPress ? { color: "rgba(0,0,0,0.06)" } : undefined}
      style={[styles.card, style]}
    >
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    padding: 14,
  },
});
