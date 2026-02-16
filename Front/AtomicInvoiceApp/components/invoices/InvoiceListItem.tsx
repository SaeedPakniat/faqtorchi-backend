import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppColors } from "../../constants/appColors";
import { Invoice } from "../../src/data/invoices";
import { formatDate, formatToman } from "../../src/utils/format";
import AppText from "../ui/AppText";
import Card from "../ui/Card";
import StatusBadge from "../ui/StatusBadge";

export default function InvoiceListItem({
  invoice,
  onPress,
}: {
  invoice: Invoice;
  onPress: () => void;
}) {
  const currency = invoice.currency ?? "IRT";
  const totalLabel =
    (currency === "USD" || currency === "EUR") && invoice.exchangeRateToToman
      ? `${invoice.total.toLocaleString()} ${currency} • ${(invoice.total * invoice.exchangeRateToToman).toLocaleString()} IRT`
      : currency === "IRR" || currency === "IRT"
        ? `${formatToman(invoice.total)}`
        : `${invoice.total.toLocaleString()} ${currency}`;
  return (
    <Pressable onPress={onPress} style={{ marginBottom: 12 }}>
      <Card>
        <View style={styles.row}>
          <AppText variant="subtitle">Invoice #{invoice.id}</AppText>
          <StatusBadge status={invoice.status} />
        </View>

        <AppText color={AppColors.muted} style={{ marginTop: 6 }}>
          Customer: {invoice.customerName}
        </AppText>

        <View style={[styles.row, { marginTop: 10 }]}>
          <AppText variant="subtitle">{totalLabel}</AppText>
          <AppText variant="small" color={AppColors.muted}>
            {formatDate(invoice.createdAt)}
          </AppText>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
