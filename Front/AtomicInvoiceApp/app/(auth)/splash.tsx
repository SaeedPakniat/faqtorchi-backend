// app/(auth)/splash.tsx
import AppText from "@/components/ui/AppText";
import { AppColors } from "@/constants/appColors";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Image, View } from "react-native";
import { authStyles } from "../../src/design/authStyles";

export default function SplashScreen() {
  const router = useRouter();
  const w = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(w, {
      toValue: 1,
      duration: 1400,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) router.replace("/(auth)/login");
    });
  }, [router, w]);

  const widthInterpolate = w.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 180],
  });

  return (
    <View style={[authStyles.screen, authStyles.center]}>
      <Image
        source={require("../assets/images/logo/logo-icon.png")}
        style={{ width: 90, height: 90, borderRadius: 22 }}
        resizeMode="contain"
      />

      <AppText
        style={{
          marginTop: 14,
          fontSize: 22,
          fontWeight: "900",
          color: AppColors.text,
        }}
      >
        Faqtori
      </AppText>

      <AppText color={AppColors.muted} style={{ marginTop: 6, fontSize: 12 }}>
        Sales management and invoicing
      </AppText>

      <View style={authStyles.progressTrack}>
        <Animated.View
          style={[authStyles.progressFill, { width: widthInterpolate }]}
        />
      </View>

      <AppText
        color={AppColors.muted}
        style={{ position: "absolute", bottom: 20, fontSize: 11 }}
      >
        1.0.0
      </AppText>
    </View>
  );
}
