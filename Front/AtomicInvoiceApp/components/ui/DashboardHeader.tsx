import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import AppText from "../../components/ui/AppText";
import { AppColors } from "../../constants/appColors";
import { ApiError, USE_REAL_API } from "@/src/lib/api";
import { getMe, SellerContext } from "@/src/lib/meApi";

export default function DashboardHeader() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sellerCtx, setSellerCtx] = useState<SellerContext | null>(null);

  useEffect(() => {
    if (!USE_REAL_API) return;
    let mounted = true;
    (async () => {
      try {
        const res = await getMe();
        if (!mounted) return;
        setSellerCtx(res.seller ?? null);
      } catch (e) {
        const err = e as ApiError;
        if (err.status === 401) {
          setSellerCtx(null);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const permissionText = useMemo(() => {
    if (!sellerCtx || sellerCtx.isOwner || !sellerCtx.permissions) return null;
    const entries: Array<[keyof NonNullable<SellerContext["permissions"]>, string]> = [
      ["invoices", "Invoices"],
      ["customers", "Customers"],
      ["products", "Products"],
      ["warehouse", "Warehouse"],
      ["reports", "Reports"],
      ["settings", "Settings"],
    ];
    const allowed = entries.filter(([k]) => sellerCtx.permissions?.[k]).map(([, label]) => label);
    if (allowed.length === 0) return "Access: none";
    return `Access: ${allowed.join(", ")}`;
  }, [sellerCtx]);

  const onLogout = async () => {
    setMenuOpen(false);
    router.replace("/(auth)/login");
  };

  const onEditAccount = () => {
    setMenuOpen(false);
    router.push("/(auth)/info");
  };

  return (
    <View style={styles.container}>
      {/* LEFT */}
      <View style={styles.left}>
        <Image
          source={require("../../app/assets/images/logo/logo-icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View>
          <AppText style={styles.brandTitle}>Faqtori</AppText>
          <AppText style={styles.brandSub} color={AppColors.muted}>
            invoice maker
          </AppText>
          {!!permissionText && (
            <AppText style={styles.permissionText} color={AppColors.muted}>
              {permissionText}
            </AppText>
          )}
        </View>
      </View>

      {/* RIGHT (always menu icon) */}
      <View style={styles.right}>
        <View style={{ position: "relative" }}>
          <Pressable
            onPress={() => setMenuOpen((p) => !p)}
            hitSlop={12}
            style={styles.iconBtn}
          >
            <Image
              source={require("../../app/assets/icons/common/edit-logout-icon.png")}
              style={styles.rightIcon}
              resizeMode="contain"
            />
          </Pressable>

          {menuOpen && (
            <>
              <Pressable
                onPress={() => setMenuOpen(false)}
                style={styles.overlay}
              />
              <View style={styles.menu}>
                <Pressable style={styles.menuItem} onPress={onEditAccount}>
                  <AppText>Edit Account</AppText>
                </Pressable>

                <View style={styles.divider} />

                <Pressable style={styles.menuItem} onPress={onLogout}>
                  <AppText style={{ color: "#D32F2F" }}>Logout</AppText>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 100,
    paddingHorizontal: 16,
    backgroundColor: AppColors.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 38, height: 38 },
  brandTitle: { fontSize: 18, fontWeight: "700" },
  brandSub: { fontSize: 12, marginTop: 2 },
  permissionText: { fontSize: 11, marginTop: 2 },


  right: { alignItems: "flex-end" },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  rightIcon: { width: 22, height: 22 },

  overlay: {
    position: "absolute",
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: "transparent",
  },

  menu: {
    position: "absolute",
    top: 46,
    right: 0,
    width: 170,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    overflow: "hidden",
    zIndex: 10,
  },
  menuItem: { paddingVertical: 12, paddingHorizontal: 12 },
  divider: { height: 1, backgroundColor: AppColors.border },
});
