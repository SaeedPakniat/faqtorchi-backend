// app/(tabs)/settings/printer.tsx
import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";
import Card from "@/components/ui/Card";
import { AppColors } from "@/constants/appColors";
import { USE_REAL_API } from "@/src/lib/api";
import {
  getInvoiceTemplate,
  setInvoiceTemplate,
  type InvoiceTemplateId,
} from "@/src/lib/sellerSettingsApi";
import { useRouter } from "expo-router";
import React, { useMemo, useState, useEffect } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

type Template = {
  id: InvoiceTemplateId;
  name: string;
  preview?: any; // require(...)
  accent?: string;
  header?: string;
  bg?: string;
  previewType: "image" | "mock";
  paper: "A4";
  orientation: "Horizontal" | "vertical";
};

export default function PrinterSettingsScreen() {
  const router = useRouter();

  const safeGoBack = () => {
    if (router.canGoBack?.()) {
      router.back();
      return;
    }
    router.push("/(tabs)/settings");
  };

  const templates: Template[] = useMemo(
    () => [
      {
        id: "default",
        name: "Default",
        preview: require("../../assets/images/dashboard/invoice-placeholder.png"), // TODO: replace with real template image
        previewType: "image",
        paper: "A4",
        orientation: "Horizontal",
      },
      {
        id: "green-v1",
        name: "Green",
        preview: require("../../assets/images/dashboard/invoice-template-green.jpg"),
        previewType: "image",
        paper: "A4",
        orientation: "Horizontal",
      },
      {
        id: "blue-min",
        name: "Blue Minimal",
        previewType: "mock",
        accent: "#1B4F9B",
        header: "#1B4F9B",
        bg: "#F2F5FA",
        paper: "A4",
        orientation: "Horizontal",
      },
      {
        id: "slate-modern",
        name: "Slate Modern",
        previewType: "mock",
        accent: "#2C3E50",
        header: "#2C3E50",
        bg: "#F0F2F5",
        paper: "A4",
        orientation: "Horizontal",
      },
      {
        id: "sunrise-classic",
        name: "Sunrise Classic",
        previewType: "mock",
        accent: "#E74C3C",
        header: "#F39C12",
        bg: "#FFF7ED",
        paper: "A4",
        orientation: "Horizontal",
      },
      {
        id: "mono-grid",
        name: "Mono Grid",
        previewType: "mock",
        accent: "#111827",
        header: "#111827",
        bg: "#F3F4F6",
        paper: "A4",
        orientation: "Horizontal",
      },
    ],
    [],
  );

  const [activeId, setActiveId] = useState<InvoiceTemplateId>("default");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    if (!USE_REAL_API) return;
    getInvoiceTemplate()
      .then((res) => {
        if (!alive) return;
        setActiveId(res.templateId ?? "default");
      })
      .catch((err) => {
        if (!alive) return;
        setError(err?.message || "Failed to load template");
      });
    return () => {
      alive = false;
    };
  }, []);

  // برای گرید ۲ ستونه
  const rows = useMemo(() => {
    const out: Template[][] = [];
    for (let i = 0; i < templates.length; i += 2)
      out.push(templates.slice(i, i + 2));
    return out;
  }, [templates]);

  return (
    <View style={styles.screen}>
      {/* <DashboardHeader /> */}

      {/* Title Row (Back کنار عنوان مثل دیزاین) */}
      <View style={styles.titleRow}>
        <Pressable
          onPress={() => safeGoBack()}
          hitSlop={10}
          style={styles.backBtn}
        >
          <Image
            source={require("../../assets/icons/common/back.png")}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </Pressable>

        <AppText style={styles.title}>Printer Settings</AppText>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {rows.map((pair, idx) => (
          <View key={idx} style={styles.gridRow}>
            {pair.map((t) => {
              const isActive = t.id === activeId;

              return (
                <Card key={t.id} style={styles.card}>
                  {/* preview */}
                  <View style={styles.previewWrap}>
                    {t.previewType === "image" ? (
                      <Image
                        source={t.preview}
                        style={styles.previewImg}
                        resizeMode="contain"
                      />
                    ) : (
                      <View
                        style={[
                          styles.mockPreview,
                          { backgroundColor: t.bg ?? "#F6F7FB" },
                        ]}
                      >
                        <View
                          style={[
                            styles.mockHeader,
                            { backgroundColor: t.header ?? "#1F8E74" },
                          ]}
                        />
                        <View
                          style={[
                            styles.mockBadge,
                            { borderColor: t.accent ?? "#1F8E74" },
                          ]}
                        />
                        <View style={styles.mockBoxRow}>
                          <View
                            style={[
                              styles.mockBox,
                              { borderColor: t.accent ?? "#1F8E74" },
                            ]}
                          />
                          <View
                            style={[
                              styles.mockBox,
                              { borderColor: t.accent ?? "#1F8E74" },
                            ]}
                          />
                        </View>
                        <View style={styles.mockLines}>
                          <View style={styles.mockLine} />
                          <View style={styles.mockLine} />
                          <View style={styles.mockLine} />
                        </View>
                        <View
                          style={[
                            styles.mockFooter,
                            { backgroundColor: t.header ?? "#1F8E74" },
                          ]}
                        />
                      </View>
                    )}
                  </View>

                  {/* meta row (A4 + orientation) */}
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Image
                        source={require("../../assets/icons/common/paper.png")}
                        style={styles.metaIcon}
                        resizeMode="contain"
                      />
                    <AppText style={styles.metaText}>{t.paper}</AppText>
                  </View>

                  <View style={styles.metaItem}>
                      <Image
                        source={require("../../assets/icons/common/rotate.png")}
                        style={styles.metaIcon}
                        resizeMode="contain"
                      />
                      <AppText style={styles.metaText}>{t.orientation}</AppText>
                    </View>
                  </View>

                  {/* button */}
                  <AppText style={styles.templateName}>{t.name}</AppText>

                  <AppButton
                    title={isActive ? "Active" : "Activate"}
                    onPress={() => {
                      setError("");
                      const prev = activeId;
                      setActiveId(t.id);
                      if (!USE_REAL_API) return;
                      setInvoiceTemplate(t.id).catch((err) => {
                        setActiveId(prev);
                        setError(err?.message || "Failed to save template");
                      });
                    }}
                    // disabled={isActive}
                    // style={[
                    //   styles.btn,
                    //   isActive ? styles.btnActive : styles.btnInactive,
                    // ]}
                    // ✅ دیگه disabled نیست که Activation هم قابل کلیک باشه
                    style={[
                      styles.btn,
                      isActive ? styles.btnActive : styles.btnInactive,
                    ]}
                    // اگر AppButton از textStyle پشتیبانی می‌کنه:
                    textStyle={
                      isActive ? styles.btnTextActive : styles.btnTextInactive
                    }
                  />
                </Card>
              );
            })}

            {/* اگر فرد شد ستون دوم خالی */}
            {pair.length === 1 && (
              <View style={[styles.card, { opacity: 0 }]} />
            )}
          </View>
        ))}
        {!!error && <AppText style={styles.errorText}>{error}</AppText>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
    paddingHorizontal: 16,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
    marginBottom: 8,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { width: 18, height: 18 },

  title: {
    fontSize: 18,
    fontWeight: "900",
    color: AppColors.text,
  },

  gridRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },

  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: "#fff",
    padding: 12,
  },

  previewWrap: {
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: "#FAFAFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  previewImg: { width: "100%", height: "100%" },
  mockPreview: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    overflow: "hidden",
    padding: 8,
    gap: 6,
  },
  mockHeader: {
    height: 14,
    borderRadius: 6,
  },
  mockBadge: {
    alignSelf: "flex-end",
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    backgroundColor: "#FFFFFF",
    marginTop: -10,
    marginBottom: 2,
  },
  mockBoxRow: {
    flexDirection: "row",
    gap: 6,
  },
  mockBox: {
    flex: 1,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.2,
    backgroundColor: "#FFFFFF",
  },
  mockLines: {
    gap: 4,
  },
  mockLine: {
    height: 6,
    borderRadius: 4,
    backgroundColor: "#E2E6EF",
  },
  mockFooter: {
    height: 8,
    borderRadius: 6,
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingHorizontal: 2,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaIcon: { width: 14, height: 14, opacity: 0.8 },
  metaText: { fontSize: 12, fontWeight: "700", color: AppColors.muted },

  templateName: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "800",
    color: AppColors.text,
  },

  btn: {
    height: 34,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnActive: {
    // دکمه primary خود AppButton احتمالاً رنگ می‌ده؛
    // اینجا فقط می‌خوایم نزدیک دیزاین باشه
    backgroundColor: AppColors.primary,
  },
  btnInactive: {
    // opacity: 0.55,
    backgroundColor: "#ECECF1", // خاکستری روشن مثل دیزاین
  },

  btnTextActive: {
    color: "#fff",
    fontWeight: "900",
  },

  btnTextInactive: {
    color: "#B0B0B8",
    fontWeight: "900",
  },

  errorText: {
    marginTop: 12,
    color: AppColors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
});
