// app/(tabs)/settings/bank.tsx
import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppText from "@/components/ui/AppText";
import Card from "@/components/ui/Card";
import { AppColors } from "@/constants/appColors";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ApiError, USE_REAL_API } from "@/src/lib/api";
import {
  ApiBankAccount,
  createBankAccount,
  deleteBankAccount,
  listBankAccounts,
  updateBankAccount,
} from "@/src/lib/bankAccountApi";

type BankRow = {
  id: number;
  title: string;
  iban: string;
  status: "active" | "not_active";
  income: number; // $ in UI
  outcome: number; // $ in UI
};

export default function BankSettingsScreen() {
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
  const [accounts, setAccounts] = useState<ApiBankAccount[]>([]);

  useEffect(() => {
    if (!USE_REAL_API) return;
    let mounted = true;
    (async () => {
      try {
        setApiError("");
        setApiLoading(true);
        const res = await listBankAccounts();
        if (!mounted) return;
        setAccounts(res.accounts ?? []);
      } catch (e) {
        const err = e as ApiError;
        if (mounted) setApiError(err.message || "Failed to load bank accounts");
      } finally {
        if (mounted) setApiLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const data = useMemo<BankRow[]>(
    () =>
      USE_REAL_API
        ? accounts.map((a) => ({
            id: a.id,
            title: a.name,
            iban: a.accountNumber,
            status: a.isActive ? "active" : "not_active",
            income: 0,
            outcome: 0,
          }))
        : [],
    [accounts],
  );

  // ✅ New Account (inline)
  const [showCreate, setShowCreate] = useState(false);
  const [createActive, setCreateActive] = useState(true);
  const [createName, setCreateName] = useState("");
  const [createAccount, setCreateAccount] = useState("");

  // ✅ Edit Account (inline under item)
  const [editId, setEditId] = useState<number | null>(null);
  const [editActive, setEditActive] = useState(true);
  const [editName, setEditName] = useState("");
  const [editAccount, setEditAccount] = useState("");

  const canSubmitCreate = useMemo(() => {
    if (createName.trim().length < 2) return false;
    if (createAccount.trim().length < 6) return false;
    return true;
  }, [createName, createAccount]);

  const canSubmitEdit = useMemo(() => {
    if (editName.trim().length < 2) return false;
    if (editAccount.trim().length < 6) return false;
    return true;
  }, [editName, editAccount]);

  const openCreate = () => {
    setEditId(null);
    setShowCreate(true);
  };

  const closeCreate = () => {
    setShowCreate(false);
    setCreateActive(true);
    setCreateName("");
    setCreateAccount("");
  };

  const openEdit = (b: BankRow) => {
    setShowCreate(false);
    setEditId(b.id);
    setEditActive(b.status === "active");
    setEditName(b.title);
    setEditAccount(b.iban);
  };

  const closeEdit = () => {
    setEditId(null);
    setEditActive(true);
    setEditName("");
    setEditAccount("");
  };

  return (
    <View style={styles.screen}>
      {/* title row مثل دیزاین: back کنار عنوان + دکمه New */}
      <View style={styles.titleRow}>
        <View style={styles.leftTitle}>
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

          <AppText style={styles.pageTitle}>Bank Account</AppText>
        </View>

        {/* ✅ New Bank Account button with yellow plus */}
        <Pressable
          onPress={() => (showCreate ? closeCreate() : openCreate())}
          style={styles.newBtn}
        >
          <Image
            // آیکن plus
            source={require("../../assets/icons/common/plus.png")}
            style={styles.plusIcon}
            resizeMode="contain"
          />
          <AppText style={styles.newBtnText}>New Bank Account</AppText>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {USE_REAL_API && apiLoading && (
          <AppText color={AppColors.muted} style={{ marginTop: 6 }}>
            Loading...
          </AppText>
        )}
        {USE_REAL_API && apiError && (
          <AppText color={AppColors.danger} style={{ marginTop: 6 }}>
            {apiError}
          </AppText>
        )}
        {/* ✅ کارت Add New Account بالای لیست */}
        {showCreate && (
          <Card style={styles.formCard}>
            <View style={styles.formHeader}>
              <View style={{ width: 28 }} />
              <AppText style={styles.formTitle}>Add New Account</AppText>

              <Pressable onPress={closeCreate} hitSlop={10} style={styles.xBtn}>
                <Image
                  source={require("../../assets/icons/common/close.png")}
                  style={{ width: 18, height: 18 }}
                  resizeMode="contain"
                />
              </Pressable>
            </View>

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
              label="Account number:"
              value={createAccount}
              onChangeText={setCreateAccount}
              placeholder="account number"
              keyboardType="numeric"
              style={{ marginTop: 10 }}
            />

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
                  await createBankAccount({
                    name: createName.trim(),
                    accountNumber: createAccount.trim(),
                    isActive: createActive,
                  });
                  const res = await listBankAccounts();
                  setAccounts(res.accounts ?? []);
                  closeCreate();
                } catch (e) {
                  const err = e as ApiError;
                  setApiError(err.message || "Failed to create account");
                }
              }}
              style={styles.submitBtn}
            />
          </Card>
        )}

        {data.map((b, idx) => {
          const isEditingThis = editId === b.id;

          return (
            <View key={`${b.id}-${idx}`} style={{ marginTop: 12 }}>
              <Card style={styles.bankCard}>
                {/* TOP ROW */}
                <View style={styles.topRow}>
                  <View style={styles.bankLeft}>
                    <View style={styles.bankIconCircle}>
                      <Image
                        source={require("../../assets/icons/common/bank-account.png")}
                        style={styles.bankIcon}
                        resizeMode="contain"
                      />
                    </View>

                    <View style={{ flex: 1, minWidth: 0 }}>
                      <AppText style={styles.bankId}>{b.id}</AppText>
                      <AppText style={styles.bankTitle}>{b.title}</AppText>
                    </View>
                  </View>

                  <View style={styles.bankRight}>
                    <View style={styles.statusRow}>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              b.status === "active"
                                ? AppColors.success
                                : AppColors.muted,
                          },
                        ]}
                      />
                      <AppText style={styles.statusText}>
                        {b.status === "active" ? "active" : "not active"}
                      </AppText>
                    </View>

                    <View style={styles.metaRow}>
                      <Image
                        source={require("../../assets/icons/common/card.png")}
                        style={styles.metaIcon}
                        resizeMode="contain"
                      />
                      <AppText style={styles.metaText}>{b.iban}</AppText>
                    </View>

                    {/* ✅ 2) حذف 5130 => ردیف کارت حذف شد */}
                    {/* <View style={styles.metaRow}>
                      <Image
                        source={require("../../assets/icons/common/card.png")}
                        style={styles.metaIcon}
                        resizeMode="contain"
                      />
                      <AppText style={styles.metaText}>{b.card}</AppText>
                    </View> */}
                  </View>
                </View>

                {/* AMOUNTS + EDIT */}
                <View style={styles.bottomRow}>
                  <View style={styles.amountsRow}>
                    <View style={styles.amountItem}>
                      <Image
                        source={require("../../assets/icons/common/income.png")}
                        style={styles.amountIcon}
                        resizeMode="contain"
                      />
                      <View>
                        <AppText style={styles.amountText}>${b.income}</AppText>
                        <AppText style={styles.amountSub}>debtor</AppText>
                      </View>
                    </View>

                    <View style={styles.amountItem}>
                      <Image
                        source={require("../../assets/icons/common/outcome.png")}
                        style={styles.amountIcon}
                        resizeMode="contain"
                      />
                      <View>
                        <AppText style={styles.amountText}>
                          ${b.outcome}
                        </AppText>
                        <AppText style={styles.amountSub}>creditor</AppText>
                      </View>
                    </View>
                  </View>

                  <View style={styles.actionRow}>
                    <Pressable
                      style={styles.editBtn}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        isEditingThis ? closeEdit() : openEdit(b);
                      }}
                    >
                      <Image
                        source={require("../../assets/icons/common/edit.png")}
                        style={styles.editIcon}
                        resizeMode="contain"
                      />
                      <AppText style={styles.editText}>Edit</AppText>
                    </Pressable>
                    <Pressable
                      style={styles.deleteBtn}
                      onPress={async () => {
                        if (!USE_REAL_API) return;
                        try {
                          setApiError("");
                          await deleteBankAccount(b.id);
                          const res = await listBankAccounts();
                          setAccounts(res.accounts ?? []);
                        } catch (e) {
                          const err = e as ApiError;
                          setApiError(err.message || "Failed to delete account");
                        }
                      }}
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

              {/* ✅ 4) کارت Edit زیر همون کارت */}
              {isEditingThis && (
                <Card style={styles.formCard}>
                  <View style={styles.formHeader}>
                    <View style={{ width: 28 }} />
                    <AppText style={styles.formTitle}>
                      Edit Bank Account
                    </AppText>

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
                    label="Account number:"
                    value={editAccount}
                    onChangeText={setEditAccount}
                    placeholder="account number"
                    keyboardType="numeric"
                    style={{ marginTop: 10 }}
                  />

                  <AppButton
                    title="change"
                    disabled={!canSubmitEdit}
                    onPress={async () => {
                      if (!USE_REAL_API || !editId) {
                        closeEdit();
                        return;
                      }
                      try {
                        setApiError("");
                        await updateBankAccount(editId, {
                          name: editName.trim(),
                          accountNumber: editAccount.trim(),
                          isActive: editActive,
                        });
                        const res = await listBankAccounts();
                        setAccounts(res.accounts ?? []);
                        closeEdit();
                      } catch (e) {
                        const err = e as ApiError;
                        setApiError(err.message || "Failed to update account");
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
    justifyContent: "space-between",
    marginTop: 0,
    marginBottom: 8,
  },
  leftTitle: { flexDirection: "row", alignItems: "center", gap: 0 },
  backBtn: { paddingVertical: 6, paddingRight: 6 },
  backIcon: { width: 18, height: 18, tintColor: AppColors.accent },

  pageTitle: { fontSize: 16, fontWeight: "900", color: AppColors.text },

  /** ✅ 1) دکمه New با plus زرد */
  newBtn: {
    height: 34,
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: AppColors.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  plusIcon: {
    width: 14,
    height: 14,
    tintColor: AppColors.accent, // ✅ زرد
  },
  newBtnText: { color: "#fff", fontWeight: "900", fontSize: 11 },

  bankCard: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: "#fff",
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  bankLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },

  bankIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: AppColors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  bankIcon: { width: 26, height: 26 },

  bankId: { fontSize: 11, color: AppColors.muted, marginBottom: 2 },
  bankTitle: { fontSize: 15, fontWeight: "900", color: AppColors.text },

  bankRight: { alignItems: "flex-end" },

  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, color: AppColors.muted, fontWeight: "700" },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  metaIcon: { width: 14, height: 14, opacity: 0.9 },
  metaText: { fontSize: 12, fontWeight: "800", color: "#1D4ED8" },

  bottomRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  amountsRow: { flexDirection: "row", gap: 14, alignItems: "center" },
  amountItem: { flexDirection: "row", alignItems: "center", gap: 6 },

  amountIcon: { width: 14, height: 14 },
  amountText: { fontSize: 12, fontWeight: "900", color: AppColors.text },
  amountSub: {
    fontSize: 9,
    fontWeight: "700",
    color: AppColors.muted,
    marginTop: 1,
  },

  editBtn: {
    height: 30,
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: AppColors.primary,
    borderWidth: 1,
    borderColor: AppColors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  deleteBtn: {
    height: 30,
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: AppColors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  deleteText: { fontWeight: "900", color: "#D32F2F" },

  /** ✅ آیکن edit زرد مثل دیزاین */
  editIcon: { width: 14, height: 14, tintColor: AppColors.accent },
  editText: { color: "#fff", fontWeight: "900", fontSize: 11 },

  /** ✅ فرم New/Edit مثل دیزاین */
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
    backgroundColor: AppColors.accent,
  },
  radioText: { fontSize: 12, fontWeight: "800", color: AppColors.primary },

  submitBtn: {
    marginTop: 16,
    height: 46,
    borderRadius: 12,
    backgroundColor: AppColors.primary,
  },
});
