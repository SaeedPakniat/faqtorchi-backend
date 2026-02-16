import { Tabs } from "expo-router";
import React from "react";
import { AppColors } from "../../constants/appColors";

export default function SellerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: AppColors.primary,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="invoices/index" options={{ title: "Invoices" }} />
      {/* <Tabs.Screen name="invoices/index" options={{ href: null }} /> */}
      <Tabs.Screen name="invoices/[id]" options={{ href: null }} />
      <Tabs.Screen name="invoices/new" options={{ href: null }} />
      <Tabs.Screen name="invoices/warehouse" options={{ href: null }} />
      <Tabs.Screen name="warehouse" options={{ title: "Warehouse" }} />
      <Tabs.Screen name="warehouse/warehouses" options={{ href: null }} />
      <Tabs.Screen name="warehouse/[id]" options={{ href: null }} />
      <Tabs.Screen name="warehouse/products" options={{ href: null }} />
      <Tabs.Screen name="warehouse/product/[id]" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
