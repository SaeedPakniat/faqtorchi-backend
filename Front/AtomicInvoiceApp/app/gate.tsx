//app/gate.tsx
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { AppColors } from "../constants/appColors";
import { useAuth } from "../src/store/auth/AuthContext";

export default function Gate() {
  const router = useRouter();
  const { auth } = useAuth();
  const didRoute = useRef(false);

  useEffect(() => {
    if (didRoute.current) return;

    // Wait until auth finishes loading from SecureStore
    if (auth.loading) return;

    didRoute.current = true;

    if (!auth.isAuthenticated) {
      router.replace("/(auth)/login");
      return;
    }

    if (!auth.role) {
      router.replace("/(auth)/role");
      return;
    }

    if (auth.role === "seller") {
      router.replace("/(tabs)");
      return;
    }

    router.replace("/(customer)");
  }, [auth.loading, auth.isAuthenticated, auth.role, router]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: AppColors.background,
      }}
    >
      <ActivityIndicator />
    </View>
  );
}
