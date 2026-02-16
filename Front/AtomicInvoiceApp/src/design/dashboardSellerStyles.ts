// src/design/dashboardSellerStyles.ts
import { AppColors } from "@/constants/appColors";
import { StyleSheet } from "react-native";

export const dashboardSellerStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },

  container: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 24,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },

  brandTextWrap: {
    gap: 2,
  },

  brandTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: AppColors.text,
  },

  brandSub: {
    fontSize: 12,
    color: AppColors.muted,
  },

  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: AppColors.border,
  },

  headerActionIcon: {
    width: 22,
    height: 22,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginTop: 6,
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: AppColors.primary,
  },

  sectionHint: {
    fontSize: 12,
    color: AppColors.muted,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
  },

  chartBox: {
    height: 150,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: "#fafafa",
  },

  historyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },

  historyItem: {
    width: "48%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: "#fff",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  historyIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
  },

  historyValue: {
    fontSize: 16,
    fontWeight: "800",
    color: AppColors.text,
  },

  historyLabel: {
    fontSize: 11,
    color: AppColors.muted,
    marginTop: 2,
  },

  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },

  quickItem: {
    width: "31%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  quickIcon: {
    width: 38,
    height: 38,
  },

  quickLabel: {
    fontSize: 11,
    color: AppColors.text,
    textAlign: "center",
  },

  spacer12: { height: 12 },
  spacer16: { height: 16 },
});
