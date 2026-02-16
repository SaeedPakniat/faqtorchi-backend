// app/(seller)/index.tsx
import AppText from "@/components/ui/AppText";
import { dashboardSellerStyles as s } from "@/src/design/dashboardSellerStyles";
import React from "react";
import { Image, ScrollView, View } from "react-native";

export default function SellerDashboard() {
  // const router = useRouter();

  // const quickItems = [
  //   {
  //     key: "addCustomer",
  //     label: "Add Customer",
  //     icon: require("../assets/icons/quick-access/customers-dashboard.png"),
  //     to: "/(tabs)/customers/new",
  //   },
  //   {
  //     key: "addProduct",
  //     label: "Add Product",
  //     icon: require("../assets/icons/quick-access/product-dashboard.png"),
  //     to: "/(tabs)/products",
  //   },
  //   {
  //     key: "salesInvoice",
  //     label: "Sales Invoice",
  //     icon: require("../assets/icons/quick-access/invoice-dashboard.png"),
  //     to: "/(tabs)/invoices/new",
  //   },
  //   {
  //     key: "buyingInvoice",
  //     label: "Buying Invoice",
  //     icon: require("../assets/icons/quick-access/invoice-dashboard.png"),
  //     to: "/(tabs)/invoices/warehouse",
  //   },

  //   // اینا فعلاً صفحه ندارن؟ می‌تونی بعداً بسازی و مسیرشونو درست کنی
  //   {
  //     key: "receivedDoc",
  //     label: "Received Doc",
  //     icon: require("../assets/icons/quick-access/averageSale-dashboard.png"),
  //     to: "/(tabs)/settings", // موقت
  //   },
  //   {
  //     key: "paymentDoc",
  //     label: "Payment Doc",
  //     icon: require("../assets/icons/quick-access/averageSale-dashboard.png"),
  //     to: "/(tabs)/settings", // موقت
  //   },
  // ];
  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Sales Invoice */}
      <View style={s.sectionTitleRow}>
        <AppText style={s.sectionTitle}>Sales Invoice</AppText>
        <AppText style={s.sectionHint}>last week</AppText>
      </View>

      <View style={s.card}>
        {/* فعلاً چارت fake */}
        <View style={s.chartBox} />
      </View>

      <View style={s.spacer16} />

      {/* History */}
      <View style={s.sectionTitleRow}>
        <AppText style={s.sectionTitle}>History</AppText>
      </View>

      <View style={s.historyGrid}>
        <View style={s.historyItem}>
          <Image
            source={require("../assets/icons/quick-access/customers-dashboard.png")}
            style={s.historyIcon}
          />
          <View>
            <AppText style={s.historyValue}>230</AppText>
            <AppText style={s.historyLabel}>Customers</AppText>
          </View>
        </View>

        <View style={s.historyItem}>
          <Image
            source={require("../assets/icons/quick-access/product-dashboard.png")}
            style={s.historyIcon}
          />
          <View>
            <AppText style={s.historyValue}>130</AppText>
            <AppText style={s.historyLabel}>Products</AppText>
          </View>
        </View>

        <View style={s.historyItem}>
          <Image
            source={require("../assets/icons/quick-access/invoice-dashboard.png")}
            style={s.historyIcon}
          />
          <View>
            <AppText style={s.historyValue}>100</AppText>
            <AppText style={s.historyLabel}>Invoice</AppText>
          </View>
        </View>

        <View style={s.historyItem}>
          <Image
            source={require("../assets/icons/quick-access/averageSale-dashboard.png")}
            style={s.historyIcon}
          />
          <View>
            <AppText style={s.historyValue}>230M</AppText>
            <AppText style={s.historyLabel}>Average sales</AppText>
          </View>
        </View>
      </View>

      <View style={s.spacer16} />

      {/* Quick Access */}
      <View style={s.sectionTitleRow}>
        <AppText style={s.sectionTitle}>Quick Access</AppText>
      </View>

      <View style={s.quickGrid}>
        {/* {quickItems.map((it) => (
          <Pressable
            key={it.key}
            onPress={() => router.push(it.to as any)}
            style={s.quickItem}
          ></Pressable>
        ))} */}
        <View style={s.quickItem}>
          <Image
            source={require("../assets/icons/quick-access/customers-dashboard.png")}
            style={s.quickIcon}
          />
          <AppText style={s.quickLabel}>Add Customer</AppText>
        </View>

        <View style={s.quickItem}>
          <Image
            source={require("../assets/icons/quick-access/product-dashboard.png")}
            style={s.quickIcon}
          />
          <AppText style={s.quickLabel}>Add Product</AppText>
        </View>

        <View style={s.quickItem}>
          <Image
            source={require("../assets/icons/quick-access/invoice-dashboard.png")}
            style={s.quickIcon}
          />
          <AppText style={s.quickLabel}>Sales Invoice</AppText>
        </View>

        <View style={s.quickItem}>
          <Image
            source={require("../assets/icons/quick-access/invoice-dashboard.png")}
            style={s.quickIcon}
          />
          <AppText style={s.quickLabel}>Buying Invoice</AppText>
        </View>

        <View style={s.quickItem}>
          <Image
            source={require("../assets/icons/quick-access/averageSale-dashboard.png")}
            style={s.quickIcon}
          />
          <AppText style={s.quickLabel}>Received Doc</AppText>
        </View>

        <View style={s.quickItem}>
          <Image
            source={require("../assets/icons/quick-access/averageSale-dashboard.png")}
            style={s.quickIcon}
          />
          <AppText style={s.quickLabel}>Payment Doc</AppText>
        </View>
      </View>

      <View style={s.spacer12} />
      <AppText style={s.sectionHint}>Current Sales Invoice</AppText>
    </ScrollView>
  );
}
