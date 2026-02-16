import React from "react";
import { StyleSheet, View } from "react-native";
import { AppColors } from "../../constants/appColors";
import { InvoiceStatus } from "../../src/data/invoices";
import { statusLabel } from "../../src/utils/format";
import AppText from "./AppText";

export default function StatusBadge({ status }: { status: InvoiceStatus }) {
  const bg =
    status === "paid"
      ? AppColors.success
      : status === "unpaid"
      ? AppColors.warning
      : status === "canceled"
      ? AppColors.muted
      : AppColors.danger;

  return (
    <View style={[styles.badge, { borderColor: bg }]}>
      <AppText variant="small" color={bg}>
        {statusLabel(status)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
});
