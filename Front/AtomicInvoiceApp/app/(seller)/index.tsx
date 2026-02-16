// app/(seller)/index.tsx
import AppText from "@/components/ui/AppText";
import { dashboardSellerStyles as s } from "@/src/design/dashboardSellerStyles";
import React from "react";
import { Image, ScrollView, View } from "react-native";

export default function SellerDashboard() {
  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={s.header}>
        <View style={s.brandRow}>
          <Image
            source={require("../assets/images/logo/logo-icon.png")}
            style={s.logo}
            resizeMode="contain"
          />
          <View style={s.brandTextWrap}>
            <AppText style={s.brandTitle}>Faqtori</AppText>
            <AppText style={s.brandSub}>invoice maker</AppText>
          </View>
        </View>

        {/* آیکن بالا راست (placeholder) */}
        <View style={s.headerAction}>
          {/* اگر آیکن خاص داری، این require رو عوض کن */}
          {/* <Image source={require("../assets/icons/common/menu.png")} style={s.headerActionIcon} /> */}
          <AppText>⚙️</AppText>
        </View>
      </View>

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
