// app/(tabs)/settings/send.tsx
import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppText from "@/components/ui/AppText";
import Card from "@/components/ui/Card";
import { AppColors } from "@/constants/appColors";
import { useRouter } from "expo-router";
import { ApiError, USE_REAL_API } from "@/src/lib/api";
import {
  ApiShippingMethod,
  createShippingMethod,
  deleteShippingMethod,
  listShippingMethods,
  updateShippingMethod,
} from "@/src/lib/shippingMethodApi";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from "react-native";

type SendKind = {
  id: number;
  title: string;
  status: "active" | "inactive";
  currency?: "IRR" | "IRT" | "USD" | "EUR";
  price: number; // USD (مثل دیزاین)
};

export default function SendSettingsScreen() {
  const router = useRouter();

  const safeGoBack = () => {
    if (router.canGoBack?.()) {
      router.back();
      return;
    }
    router.push("/(tabs)/settings");
  };

  const [apiLoading, setApiLoading] = useState(USE_REAL_API);
  const [apiError, setApiError] = useState("");
  const [methods, setMethods] = useState<ApiShippingMethod[]>([]);

  useEffect(() => {
    if (!USE_REAL_API) return;
    let mounted = true;
    (async () => {
      try {
        setApiError("");
        setApiLoading(true);
        const res = await listShippingMethods();
        if (!mounted) return;
        setMethods(res.methods ?? []);
      } catch (e) {
        const err = e as ApiError;
        if (mounted) setApiError(err.message || "Failed to load shipping methods");
      } finally {
        if (mounted) setApiLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const data = useMemo<SendKind[]>(
    () =>
      USE_REAL_API
        ? methods.map((m) => ({
            id: m.id,
            title: m.name,
            status: m.isActive ? "active" : "inactive",
            price: Number(m.price),
            currency: m.currency,
          }))
        : [],
    [methods],
  );

  // ✅ New Send kind (inline card)
  const [showCreate, setShowCreate] = useState(false);
  const [createActive, setCreateActive] = useState(true);
  const [createName, setCreateName] = useState("");
  const [createCost, setCreateCost] = useState("");
  const [createCurrency, setCreateCurrency] = useState<"IRT" | "USD">("IRT");

  // ✅ Edit Send kind (inline under item)
  const [editId, setEditId] = useState<number | null>(null);
  const [editActive, setEditActive] = useState(true);
  const [editName, setEditName] = useState("");
  const [editCost, setEditCost] = useState("");
  const [editCurrency, setEditCurrency] = useState<"IRT" | "USD">("IRT");

  const canSubmitCreate = useMemo(() => {
    if (createName.trim().length < 2) return false;
    const n = Number(createCost);
    if (!Number.isFinite(n) || n <= 0) return false;
    return true;
  }, [createName, createCost]);

  const canSubmitEdit = useMemo(() => {
    if (editName.trim().length < 2) return false;
    const n = Number(editCost);
    if (!Number.isFinite(n) || n <= 0) return false;
    return true;
  }, [editName, editCost]);

  const openCreate = () => {
    setEditId(null);
    setShowCreate(true);
  };

  const closeCreate = () => {
    setShowCreate(false);
    setCreateActive(true);
    setCreateName("");
    setCreateCost("");
    setCreateCurrency("IRT");
  };

  const openEdit = (it: SendKind) => {
    setShowCreate(false);
    setEditId(it.id);
    setEditActive(it.status === "active");
    setEditName(it.title);
    setEditCost(String(it.price));
    setEditCurrency((it.currency ?? "IRT") as "IRT" | "USD");
  };

  const closeEdit = () => {
    setEditId(null);
    setEditActive(true);
    setEditName("");
    setEditCost("");
    setEditCurrency("IRT");
  };

  const formatPrice = (value: number, currency?: string) => {
    if (currency === "USD") {
      return `$${value.toLocaleString()}`;
    }
    return `${value.toLocaleString()} IRT`;
  };

  return (
    <View style={styles.screen}>
      {/* Title row مثل دیزاین: back + title + دکمه New */}
      <View style={styles.titleRow}>
        <Pressable
          onPress={() => safeGoBack()}
          hitSlop={12}
          style={styles.backBtn}
        >
          <Image
            source={require("../../assets/icons/common/back.png")}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </Pressable>

        <AppText style={styles.pageTitle}>Send Settings</AppText>

        <View style={{ flex: 1 }} />

        <Pressable
          onPress={() => (showCreate ? closeCreate() : openCreate())}
          style={styles.newBtn}
        >
          <Image
            // آیکن plus (زرد مثل دیزاین)
            source={require("../../assets/icons/common/plus.png")}
            style={styles.newPlusIcon}
            resizeMode="contain"
          />
          <AppText style={styles.newBtnText}>New Send</AppText>
        </Pressable>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ✅ Add New Send kind card (بالای لیست) */}
        {showCreate && (
          <Card style={styles.formCard}>
            <View style={styles.formHeader}>
              <View style={{ width: 28 }} />
              <AppText style={styles.formTitle}>Add New Send kind</AppText>

              <Pressable onPress={closeCreate} hitSlop={10} style={styles.xBtn}>
                <Image
                  source={require("../../assets/icons/common/close.png")}
                  style={{ width: 18, height: 18 }}
                  resizeMode="contain"
                />
              </Pressable>
            </View>

            {/* active / not active */}
            <View style={styles.radioRow}>
              <Pressable
                onPress={() => setCreateActive(true)}
                style={styles.radioItem}
              >
                <View style={styles.radioOuter}>
                  {createActive && <View style={styles.radioInner} />}
                </View>
                <AppText style={styles.radioText}>active</AppText>
              </Pressable>

              <Pressable
                onPress={() => setCreateActive(false)}
                style={styles.radioItem}
              >
                <View style={styles.radioOuter}>
                  {!createActive && <View style={styles.radioInner} />}
                </View>
                <AppText style={styles.radioText}>not active</AppText>
              </Pressable>
            </View>

            <AppInput
              label="Name:"
              value={createName}
              onChangeText={setCreateName}
              placeholder="Name"
              style={{ marginTop: 10 }}
            />

            <AppInput
              label="Cost:"
              value={createCost}
              onChangeText={setCreateCost}
              placeholder="Cost"
              keyboardType="numeric"
              style={{ marginTop: 10 }}
            />
            <View style={styles.currencyRow}>
              <Pressable
                onPress={() => setCreateCurrency("IRT")}
                style={[
                  styles.currencyBtn,
                  createCurrency === "IRT" && styles.currencyBtnActive,
                ]}
              >
                <AppText
                  style={[
                    styles.currencyText,
                    createCurrency === "IRT" && styles.currencyTextActive,
                  ]}
                >
                  IRT
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => setCreateCurrency("USD")}
                style={[
                  styles.currencyBtn,
                  createCurrency === "USD" && styles.currencyBtnActive,
                ]}
              >
                <AppText
                  style={[
                    styles.currencyText,
                    createCurrency === "USD" && styles.currencyTextActive,
                  ]}
                >
                  USD
                </AppText>
              </Pressable>
            </View>

            <AppButton
              title="Submit"
              disabled={!canSubmitCreate}
              onPress={async () => {
                if (!USE_REAL_API) {
                  closeCreate();
                  return;
                }
                try {
                  setApiError("");
                  await createShippingMethod({
                    name: createName.trim(),
                    price: Number(createCost),
                    currency: createCurrency,
                    isActive: createActive,
                  });
                  const res = await listShippingMethods();
                  setMethods(res.methods ?? []);
                  closeCreate();
                } catch (e) {
                  const err = e as ApiError;
                  setApiError(err.message || "Failed to create method");
                }
              }}
              style={styles.submitBtn}
            />
          </Card>
        )}

        {data.map((it) => {
          const isEditingThis = editId === it.id;

          return (
            <View key={it.id} style={{ marginTop: 12 }}>
              <Card style={styles.card}>
                {/* top small meta */}
                <View style={styles.cardTopMeta}>
                  <AppText style={styles.smallId} color={AppColors.muted}>
                    {it.id}
                  </AppText>

                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor:
                            it.status === "active"
                              ? AppColors.success
                              : AppColors.muted,
                        },
                      ]}
                    />
                    <AppText style={styles.statusText} color={AppColors.muted}>
                      {it.status}
                    </AppText>
                  </View>
                </View>

                <View style={styles.cardRow}>
                  {/* left icon circle */}
                  <View style={styles.iconCircle}>
                    <Image
                      source={require("../../assets/icons/common/send-settings.png")}
                      style={styles.itemIcon}
                      resizeMode="contain"
                    />
                  </View>

                  {/* title + price */}
                  <View style={{ flex: 1 }}>
                    <AppText style={styles.itemTitle}>{it.title}</AppText>

                    <View style={styles.priceRow}>
                      <Image
                        source={require("../../assets/icons/common/money.png")}
                        style={styles.moneyIcon}
                        resizeMode="contain"
                      />
                      <AppText
                        style={styles.priceText}
                        color={AppColors.primary}
                      >
                        {formatPrice(it.price, it.currency)}
                      </AppText>
                    </View>
                  </View>

                  {/* edit button */}
                  <View style={styles.actionRow}>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation?.();
                        isEditingThis ? closeEdit() : openEdit(it);
                      }}
                      hitSlop={10}
                      style={styles.editBtn}
                    >
                      <Image
                        source={require("../../assets/icons/common/edit.png")}
                        style={styles.editIcon}
                        resizeMode="contain"
                      />
                      <AppText style={styles.editText}>Edit</AppText>
                    </Pressable>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation?.();
                        Alert.alert(
                          "Delete shipping method?",
                          "This cannot be undone.",
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Delete",
                              style: "destructive",
                              onPress: async () => {
                                if (!USE_REAL_API) return;
                                try {
                                  setApiError("");
                                  await deleteShippingMethod(it.id);
                                  const res = await listShippingMethods();
                                  setMethods(res.methods ?? []);
                                } catch (err) {
                                  const apiErr = err as ApiError;
                                  setApiError(apiErr.message || "Failed to delete method");
                                }
                              },
                            },
                          ],
                        );
                      }}
                      hitSlop={10}
                      style={styles.deleteBtn}
                    >
                      <Image
                        source={require("../../assets/icons/common/block.png")}
                        style={styles.editIcon}
                        resizeMode="contain"
                      />
                      <AppText style={styles.deleteText}>Delete</AppText>
                    </Pressable>
                  </View>
                </View>
              </Card>

              {/* ✅ Edit Send kind card (زیر همان کارت) */}
              {isEditingThis && (
                <Card style={styles.formCard}>
                  <View style={styles.formHeader}>
                    <View style={{ width: 28 }} />
                    <AppText style={styles.formTitle}>Edit Send kind</AppText>

                    <Pressable
                      onPress={closeEdit}
                      hitSlop={10}
                      style={styles.xBtn}
                    >
                      <Image
                        source={require("../../assets/icons/common/close.png")}
                        style={{ width: 18, height: 18 }}
                        resizeMode="contain"
                      />
                    </Pressable>
                  </View>

                  <View style={styles.radioRow}>
                    <Pressable
                      onPress={() => setEditActive(true)}
                      style={styles.radioItem}
                    >
                      <View style={styles.radioOuter}>
                        {editActive && <View style={styles.radioInner} />}
                      </View>
                      <AppText style={styles.radioText}>active</AppText>
                    </Pressable>

                    <Pressable
                      onPress={() => setEditActive(false)}
                      style={styles.radioItem}
                    >
                      <View style={styles.radioOuter}>
                        {!editActive && <View style={styles.radioInner} />}
                      </View>
                      <AppText style={styles.radioText}>not active</AppText>
                    </Pressable>
                  </View>

                  <AppInput
                    label="Name:"
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Name"
                    style={{ marginTop: 10 }}
                  />

                  <AppInput
                    label="Cost:"
                    value={editCost}
                    onChangeText={setEditCost}
                    placeholder="Cost"
                    keyboardType="numeric"
                    style={{ marginTop: 10 }}
                  />
                  <View style={styles.currencyRow}>
                    <Pressable
                      onPress={() => setEditCurrency("IRT")}
                      style={[
                        styles.currencyBtn,
                        editCurrency === "IRT" && styles.currencyBtnActive,
                      ]}
                    >
                      <AppText
                        style={[
                          styles.currencyText,
                          editCurrency === "IRT" && styles.currencyTextActive,
                        ]}
                      >
                        IRT
                      </AppText>
                    </Pressable>
                    <Pressable
                      onPress={() => setEditCurrency("USD")}
                      style={[
                        styles.currencyBtn,
                        editCurrency === "USD" && styles.currencyBtnActive,
                      ]}
                    >
                      <AppText
                        style={[
                          styles.currencyText,
                          editCurrency === "USD" && styles.currencyTextActive,
                        ]}
                      >
                        USD
                      </AppText>
                    </Pressable>
                  </View>

                  <AppButton
                    title="Submit"
                    disabled={!canSubmitEdit}
                    onPress={async () => {
                      if (!USE_REAL_API || !editId) {
                        closeEdit();
                        return;
                      }
                      try {
                        setApiError("");
                        await updateShippingMethod(editId, {
                          name: editName.trim(),
                          price: Number(editCost),
                          currency: editCurrency,
                          isActive: editActive,
                        });
                        const res = await listShippingMethods();
                        setMethods(res.methods ?? []);
                        closeEdit();
                      } catch (e) {
                        const err = e as ApiError;
                        setApiError(err.message || "Failed to update method");
                      }
                    }}
                    style={styles.submitBtn}
                  />
                </Card>
              )}
            </View>
          );
        })}
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
    marginTop: 6,
    gap: 10,
  },

  backBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    width: 18,
    height: 18,
    tintColor: AppColors.accent, // ✅ زرد
  },

  pageTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: AppColors.primary,
  },

  /** ✅ دکمه New مثل دیزاین با آیکن plus زرد */
  newBtn: {
    height: 34,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: AppColors.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  newPlusIcon: {
    width: 14,
    height: 14,
    tintColor: AppColors.accent, // ✅ زرد
  },
  newBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  currencyRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    marginBottom: 2,
  },
  currencyBtn: {
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.surface,
  },
  currencyBtnActive: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primarySoft,
  },
  currencyText: {
    fontSize: 11,
    fontWeight: "700",
    color: AppColors.muted,
  },
  currencyTextActive: {
    color: AppColors.primary,
  },

  card: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
  },

  cardTopMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  smallId: { fontSize: 11 },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: { fontSize: 11 },

  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  itemIcon: { width: 26, height: 26 },

  itemTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: AppColors.text,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  moneyIcon: { width: 14, height: 14, opacity: 0.9 },
  priceText: { fontSize: 12, fontWeight: "800" },

  /** ✅ آیکن edit زرد مثل دیزاین */
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 10,
  },
  editIcon: { width: 14, height: 14, tintColor: AppColors.accent }, // ✅ زرد
  editText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: AppColors.danger,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 10,
  },
  deleteText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  /** ✅ فرم‌های New/Edit مثل دیزاین */
  formCard: {
    padding: 14,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  formTitle: { fontSize: 16, fontWeight: "900", color: AppColors.primary },
  xBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  radioRow: {
    flexDirection: "row",
    gap: 26,
    marginTop: 10,
    alignItems: "center",
  },
  radioItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#B9B6D6",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AppColors.accent, // ✅ زرد
  },
  radioText: { fontSize: 12, fontWeight: "800", color: AppColors.primary },

  submitBtn: {
    marginTop: 16,
    height: 46,
    borderRadius: 12,
    backgroundColor: AppColors.primary,
  },
});
