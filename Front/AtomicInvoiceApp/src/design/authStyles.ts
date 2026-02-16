// app/design/authStyles.ts
import { AppColors } from "@/constants/appColors";
import { StyleSheet } from "react-native";

export const authStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
    paddingHorizontal: 18,
    paddingTop: 18,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Header (Logo + Name)
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
    marginBottom: 26,
  },
  brandLogo: { width: 46, height: 46, borderRadius: 12 },
  brandTitle: { fontSize: 20, fontWeight: "800", color: AppColors.text },
  brandSubtitle: { marginTop: 2, fontSize: 12, color: AppColors.muted },

  // Card-like container (No dependency on Card component)
  panel: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 14,
  },

  // Inputs
  inputLabel: { marginBottom: 8, color: AppColors.text, fontWeight: "700" },

  // Primary button
  primaryBtn: {
    height: 46,
    borderRadius: 12,
    backgroundColor: AppColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "800" },

  // Secondary text link
  link: { color: AppColors.primary, fontWeight: "700", fontSize: 12 },

  // Tabs (Login / Sign up style)
  tabsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 14,
  },
  tabActive: { color: AppColors.primary, fontWeight: "900" },
  tabInactive: { color: "#C9C6D8", fontWeight: "800" },

  // Splash progress
  progressTrack: {
    height: 6,
    width: 180,
    backgroundColor: "#E9E6F5",
    borderRadius: 99,
    overflow: "hidden",
    marginTop: 18,
  },
  progressFill: {
    height: 6,
    backgroundColor: AppColors.primary,
    borderRadius: 99,
  },
});
