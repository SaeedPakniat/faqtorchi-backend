//app/_layout.tsx
import Constants from "expo-constants";
import React from "react";
import { Platform } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider } from "../src/store/auth/AuthContext";
import { InventoryProvider } from "../src/store/inventory/InventoryContext";
import { InvoicesProvider } from "../src/store/invoices/InvoicesContext";

function isExpoGo() {
  return Constants.appOwnership === "expo";
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  React.useEffect(() => {
    // ✅ روی Expo Go اصلاً Notifications رو فعال نکن (و حتی import هم نکن)
    if (isExpoGo()) return;

    let mounted = true;

    (async () => {
      try {
        const Notifications = await import("expo-notifications");
        if (!mounted) return;

        // نمایش نوتیفیکیشن وقتی اپ بازه
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            // بعضی نسخه‌ها این دو گزینه رو نمی‌شناسن؛ ولی مشکلی ایجاد نمی‌کنه
            // @ts-ignore
            shouldShowBanner: true,
            // @ts-ignore
            shouldShowList: true,
          }),
        });

        const perm = await Notifications.getPermissionsAsync();
        if (perm.status !== "granted") {
          await Notifications.requestPermissionsAsync();
        }

        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("invoice-reminders", {
            name: "Invoice Reminders",
            importance: Notifications.AndroidImportance.HIGH,
          });
        }
      } catch {
        // اگر به هر دلیلی ماژول لود نشد، اپ نباید کرش کنه
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <InvoicesProvider>
          <InventoryProvider>
            <ThemeProvider
              value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
            >
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(seller)" />
                <Stack.Screen name="(customer)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="gate" />
                <Stack.Screen
                  name="modal"
                  options={{ presentation: "modal", title: "Modal" }}
                />
              </Stack>
              <StatusBar style="auto" />
            </ThemeProvider>
          </InventoryProvider>
        </InvoicesProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
