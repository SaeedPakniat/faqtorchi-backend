// app/(customer)/_layout.tsx
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

export default function CustomerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: () => <DashboardHeader />,

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
              source={require("../assets/icons/bottom-tabs/invoic-menu.png")}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              source={require("../assets/icons/bottom-tabs/setting-menu.png")}
            />
          ),
        }}
      />

      {/* Internal page - do not show in TabBar */}
      <Tabs.Screen name="invoice/[id]" options={{ href: null }} />
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
    backgroundColor: "#F7B500", // yellow like the design
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
