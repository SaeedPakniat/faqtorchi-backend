import DashboardHeader from "@/components/ui/DashboardHeader";
import { AppColors } from "@/constants/appColors";
import { Tabs } from "expo-router";
import React from "react";
import { Image, StyleSheet, View } from "react-native";

function TabIcon(props: { source: any; focused: boolean }) {
  const { source, focused } = props;

  return (
    <View style={styles.iconWrap}>
      <Image source={source} resizeMode="contain" style={styles.icon} />
      {focused ? (
        <View style={styles.activeLine} />
      ) : (
        <View style={styles.inactiveLine} />
      )}
    </View>
  );
}

// function PngIcon({ source }: { source: any }) {
//   return <Image source={source} style={styles.icon} resizeMode="contain" />;
// }

// function IconWithActiveLine({
//   focused,
//   source,
// }: {
//   focused: boolean;
//   source: any;
// }) {
//   return (
//     <View style={styles.iconWrap}>
//       <PngIcon source={source} />
//       {focused ? <View style={styles.activeLine} /> : <View style={styles.lineSpacer} />}
//     </View>
//   );
// }

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: () => <DashboardHeader />,

        // فقط آیکن، بدون لیبل
        tabBarShowLabel: false,

        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: AppColors.border,
          borderTopWidth: 1,
          height: 64,
          paddingTop: 8,
          paddingBottom: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              source={require("../assets/icons/bottom-tabs/home-menu.png")}
            />
          ),
        }}
      />

      {/* ✅ حتماً /index چون فولدر داری */}
      <Tabs.Screen
        name="invoices/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              source={require("../assets/icons/bottom-tabs/invoic-menu.png")}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="warehouses"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              source={require("../assets/icons/bottom-tabs/product-menu.png")}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="customers/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              source={require("../assets/icons/bottom-tabs/customer-menu.png")}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="settings/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              source={require("../assets/icons/bottom-tabs/setting-menu.png")}
            />
          ),
        }}
      />

      {/* 🚫 صفحات داخلی توی TabBar نمایش داده نشن */}
      <Tabs.Screen name="customers/new" options={{ href: null }} />
      <Tabs.Screen name="customers/[id]" options={{ href: null }} />
      <Tabs.Screen name="invoices/new" options={{ href: null }} />
      <Tabs.Screen name="invoices/[id]" options={{ href: null }} />
      <Tabs.Screen name="invoices/warehouse" options={{ href: null }} />
      <Tabs.Screen name="settings/bank" options={{ href: null }} />
      <Tabs.Screen name="settings/invoice" options={{ href: null }} />
      <Tabs.Screen name="settings/notification" options={{ href: null }} />
      <Tabs.Screen name="settings/printer" options={{ href: null }} />
      <Tabs.Screen name="settings/product" options={{ href: null }} />
      <Tabs.Screen name="settings/send" options={{ href: null }} />
      <Tabs.Screen name="settings/social" options={{ href: null }} />
      <Tabs.Screen name="settings/users" options={{ href: null }} />
      <Tabs.Screen name="settings/currency" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 44,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 22,
    height: 22,
  },
  activeLine: {
    position: "absolute",
    bottom: 0,
    width: 22,
    height: 3,
    borderRadius: 3,
    backgroundColor: "#F7B500", // زرد مثل دیزاین
  },
  inactiveLine: {
    position: "absolute",
    bottom: 0,
    width: 22,
    height: 3,
    borderRadius: 3,
    backgroundColor: "transparent",
  },
});
