// app/(tabs)/settings/users.tsx
import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppText from "@/components/ui/AppText";
import Card from "@/components/ui/Card";
import { AppColors } from "@/constants/appColors";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ApiError, USE_REAL_API } from "@/src/lib/api";
import { ApiWarehouse, listWarehouses } from "@/src/lib/inventoryApi";
import {
  ApiSellerMember,
  ApiSellerMemberAuditLog,
  SellerPermissions,
  createSellerMember,
  listSellerMemberAuditLogs,
  listSellerMembers,
  setSellerMemberPassword,
  updateSellerMember,
} from "@/src/lib/sellerMemberApi";

type UserRow = {
  id: string | number;
  name: string;
  phone: string;
  email?: string | null;
  active: boolean;
  permissions?: SellerPermissions;
  warehouseIds?: number[];
};

const FAKE_USERS: UserRow[] = [
  {
    id: "00324",
    name: "Hossein Zolfaghari",
    phone: "09195904655",
    active: true,
  },
  { id: "00323", name: "Aslan Moradi", phone: "09039726177", active: true },
];

type AccessKey =
  | "invoices"
  | "customers"
  | "products"
  | "settings"
  | "warehouse"
  | "reports";

/** ✅ استفاده از رنگ‌های پروژه */
const UI = {
  primary: AppColors.primary,
  border: AppColors.border,
  softBg: AppColors.background,
  muted: "#B9B6D6", // اگر خواستی می‌تونی از AppColors.muted هم استفاده کنی
  yellow: AppColors.accent,
  danger: "#A31313",
  green: AppColors.success,
  gray: "#9CA3AF",
};

export default function MultiUserSettingsScreen() {
  const router = useRouter();

  const safeGoBack = () => {
    if (router.canGoBack?.()) {
      router.back();
      return;
    }
    router.push("/(tabs)/settings");
  };

  const [showCreate, setShowCreate] = useState(false);
  const [apiLoading, setApiLoading] = useState(USE_REAL_API);
  const [apiError, setApiError] = useState("");
  const [members, setMembers] = useState<ApiSellerMember[]>([]);
  const [warehouses, setWarehouses] = useState<ApiWarehouse[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<Record<string, ApiSellerMemberAuditLog[]>>({});

  // inline panels
  const [editUserId, setEditUserId] = useState<string | number | null>(null);
  const [logUserId, setLogUserId] = useState<string | number | null>(null);

  // modals
  const [passUserId, setPassUserId] = useState<string | number | null>(null);
  const [blockUserId, setBlockUserId] = useState<string | number | null>(null);

  // create form state
  const [isActive, setIsActive] = useState(true);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [access, setAccess] = useState<Record<AccessKey, boolean>>({
    invoices: true,
    customers: true,
    products: false,
    settings: false,
    warehouse: false,
    reports: false,
  });
  const [warehouseIds, setWarehouseIds] = useState<number[]>([]);

  // edit form state (separate)
  const [editActive, setEditActive] = useState(true);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAccess, setEditAccess] = useState<Record<AccessKey, boolean>>({
    invoices: true,
    customers: true,
    products: false,
    settings: false,
    warehouse: false,
    reports: false,
  });
  const [editWarehouseIds, setEditWarehouseIds] = useState<number[]>([]);

  // password modal state
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");

  useEffect(() => {
    if (!USE_REAL_API) return;
    let mounted = true;
    (async () => {
      try {
        setApiError("");
        setApiLoading(true);
        const membersRes = await listSellerMembers();
        if (!mounted) return;
        setMembers(membersRes.members ?? []);
        try {
          const warehouseRes = await listWarehouses();
          if (!mounted) return;
          setWarehouses(warehouseRes.warehouses ?? []);
        } catch {
          if (mounted) setWarehouses([]);
        }
      } catch (e) {
        const err = e as ApiError;
        if (mounted) setApiError(err.message || "Failed to load users");
      } finally {
        if (mounted) setApiLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);


  const canSubmitCreate = useMemo(() => {
    if (fullName.trim().length < 3) return false;
    if (phone.trim().length < 8) return false;
    if (pass.length < 4) return false;
    if (pass !== pass2) return false;
    return true;
  }, [fullName, phone, pass, pass2]);

  const canSubmitEdit = useMemo(() => {
    if (editFullName.trim().length < 3) return false;
    if (editPhone.trim().length < 8) return false;
    return true;
  }, [editFullName, editPhone]);

  const canChangePassword = useMemo(() => {
    if (newPass.length < 4) return false;
    if (newPass !== newPass2) return false;
    return true;
  }, [newPass, newPass2]);

  const toggleAccess = (k: AccessKey) =>
    setAccess((p) => ({ ...p, [k]: !p[k] }));
  const toggleEditAccess = (k: AccessKey) =>
    setEditAccess((p) => ({ ...p, [k]: !p[k] }));
  const toggleWarehouseId = (id: number) =>
    setWarehouseIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleEditWarehouseId = (id: number) =>
    setEditWarehouseIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const openCreate = () => {
    setEditUserId(null);
    setLogUserId(null);
    setShowCreate(true);
  };

  const closeCreate = () => {
    setShowCreate(false);
    setFullName("");
    setPhone("");
    setEmail("");
    setPass("");
    setPass2("");
    setIsActive(true);
    setAccess({
      invoices: true,
      customers: true,
      products: false,
      settings: false,
      warehouse: false,
      reports: false,
    });
    setWarehouseIds([]);
  };

  const openEdit = (u: UserRow) => {
    setShowCreate(false);
    setLogUserId(null);
    setEditUserId(u.id);

    setEditActive(u.active);
    setEditFullName(u.name);
    setEditPhone(u.phone);
    setEditEmail(u.email ?? "");
    setEditAccess({
      invoices: u.permissions?.invoices ?? true,
      customers: u.permissions?.customers ?? true,
      products: u.permissions?.products ?? false,
      settings: u.permissions?.settings ?? false,
      warehouse: u.permissions?.warehouse ?? false,
      reports: u.permissions?.reports ?? false,
    });
    setEditWarehouseIds(u.warehouseIds ?? []);
  };

  const closeEdit = () => setEditUserId(null);

  const openLog = (u: UserRow) => {
    setShowCreate(false);
    setEditUserId(null);
    setLogUserId(u.id);
    if (!USE_REAL_API) return;
    (async () => {
      try {
        setAuditLoading(true);
        const res = await listSellerMemberAuditLogs(Number(u.id), { page: 1, pageSize: 20 });
        setAuditLogs((p) => ({ ...p, [String(u.id)]: res.logs ?? [] }));
      } catch (e) {
        const err = e as ApiError;
        setApiError(err.message || "Failed to load logs");
      } finally {
        setAuditLoading(false);
      }
    })();
  };

  const closeLog = () => setLogUserId(null);

  const openPasswordModal = (u: UserRow) => {
    setPassUserId(u.id);
    setNewPass("");
    setNewPass2("");
  };

  const closePasswordModal = () => {
    setPassUserId(null);
    setNewPass("");
    setNewPass2("");
  };

  const openBlockModal = (u: UserRow) => setBlockUserId(u.id);
  const closeBlockModal = () => setBlockUserId(null);

  const reloadMembers = async () => {
    if (!USE_REAL_API) return;
    const res = await listSellerMembers();
    setMembers(res.members ?? []);
  };

  const handleCreate = async () => {
    if (!USE_REAL_API) {
      closeCreate();
      return;
    }
    try {
      setApiError("");
      await createSellerMember({
        name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() ? email.trim() : undefined,
        password: pass,
        isActive,
        permissions: {
          invoices: access.invoices,
          customers: access.customers,
          products: access.products,
          settings: access.settings,
          warehouse: access.warehouse,
          reports: access.reports,
        },
        warehouseIds,
      });
      await reloadMembers();
      closeCreate();
    } catch (e) {
      const err = e as ApiError;
      setApiError(err.message || "Failed to create user");
    }
  };

  const handleUpdate = async () => {
    if (!USE_REAL_API || !editUserId) {
      closeEdit();
      return;
    }
    try {
      setApiError("");
      await updateSellerMember(Number(editUserId), {
        name: editFullName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim() ? editEmail.trim() : null,
        isActive: editActive,
        permissions: {
          invoices: editAccess.invoices,
          customers: editAccess.customers,
          products: editAccess.products,
          settings: editAccess.settings,
          warehouse: editAccess.warehouse,
          reports: editAccess.reports,
        },
        warehouseIds: editWarehouseIds,
      });
      await reloadMembers();
      closeEdit();
    } catch (e) {
      const err = e as ApiError;
      setApiError(err.message || "Failed to update user");
    }
  };

  const handleChangePassword = async () => {
    if (!USE_REAL_API || !passUserId) {
      closePasswordModal();
      return;
    }
    try {
      setApiError("");
      await setSellerMemberPassword(Number(passUserId), newPass);
      closePasswordModal();
    } catch (e) {
      const err = e as ApiError;
      setApiError(err.message || "Failed to change password");
    }
  };

  const handleToggleBlockUser = async () => {
    if (!USE_REAL_API || !blockUserId) {
      closeBlockModal();
      return;
    }
    try {
      setApiError("");
      const current = rows.find((x) => String(x.id) === String(blockUserId));
      const nextActive = current ? !current.active : false;
      await updateSellerMember(Number(blockUserId), { isActive: nextActive });
      await reloadMembers();
      closeBlockModal();
    } catch (e) {
      const err = e as ApiError;
      setApiError(err.message || "Failed to update user");
    }
  };

  const rows: UserRow[] = useMemo(() => {
    if (USE_REAL_API) {
      return members.map((m) => ({
        id: m.id,
        name: m.name || "—",
        phone: m.phone,
        email: m.email,
        active: m.isActive,
        permissions: m.permissions,
        warehouseIds: m.warehouseIds,
      }));
    }
    return FAKE_USERS;
  }, [members]);

  const getUserById = (id: string | number | null) =>
    rows.find((x) => String(x.id) === String(id)) ?? null;

  const PasswordUser = getUserById(passUserId);
  const BlockUser = getUserById(blockUserId);

  return (
    <View style={styles.screen}>
      {/* Title row مثل دیزاین */}
      <View style={styles.titleRow}>
        <Pressable
          onPress={() => safeGoBack()}
          hitSlop={10}
          style={styles.backBtn}
        >
          <Image
            source={require("../../assets/icons/common/back.png")}
            style={{ width: 18, height: 18 }}
            resizeMode="contain"
          />
        </Pressable>

        <AppText style={styles.title}>Multi-user</AppText>

        <Pressable
          onPress={() => (showCreate ? closeCreate() : openCreate())}
          style={styles.newUserBtn}
        >
          <Image
            source={require("../../assets/icons/common/plus-user.png")}
            style={{ width: 22, height: 22 }}
            resizeMode="contain"
          />
          <AppText style={styles.newUserText}>New User</AppText>
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
        {/* ✅ کارت Add New User */}
        {showCreate && (
          <Card style={styles.formCard}>
            <View style={styles.formHeader}>
              <View style={{ width: 28 }} />
              <AppText style={styles.formTitle}>Add New User</AppText>

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
                onPress={() => setIsActive(true)}
                style={styles.radioItem}
              >
                <View style={styles.radioOuter}>
                  {isActive && <View style={styles.radioInner} />}
                </View>
                <AppText style={styles.radioText}>active</AppText>
              </Pressable>

              <Pressable
                onPress={() => setIsActive(false)}
                style={styles.radioItem}
              >
                <View style={styles.radioOuter}>
                  {!isActive && <View style={styles.radioInner} />}
                </View>
                <AppText style={styles.radioText}>not active</AppText>
              </Pressable>
            </View>

            <AppInput
              label="Name & Lastname"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Name & Lastname"
              style={{ marginTop: 7 }}
            />

            <AppInput
              label="Phone:"
              value={phone}
              onChangeText={setPhone}
              placeholder="phone"
              keyboardType="phone-pad"
              style={{ marginTop: 7 }}
            />

            <AppInput
              label="Email:"
              value={email}
              onChangeText={setEmail}
              placeholder="email"
              keyboardType="email-address"
              autoCapitalize="none"
              style={{ marginTop: 7 }}
            />

            <AppInput
              label="Password:"
              value={pass}
              onChangeText={setPass}
              placeholder="password"
              secureTextEntry
              style={{ marginTop: 7 }}
            />

            <AppInput
              label="Repeat Password:"
              value={pass2}
              onChangeText={setPass2}
              placeholder="repeat password"
              secureTextEntry
              style={{ marginTop: 7 }}
            />

            <View style={styles.accessHeaderRow}>
              <AppText style={styles.accessTitle}>Access to sections:</AppText>
              <Image
                source={require("../../assets/icons/common/question-mark.png")}
                style={{ width: 14, height: 14 }}
                resizeMode="contain"
              />
            </View>

            <View style={styles.accessGrid}>
              {(
                [
                  ["invoices", "Invoices"],
                  ["customers", "Customers"],
                  ["products", "Products"],
                  ["warehouse", "Warehouse"],
                  ["reports", "Reports"],
                  ["settings", "Settings"],
                ] as [AccessKey, string][]
              ).map(([k, label]) => (
                <Pressable
                  key={k}
                  onPress={() => toggleAccess(k)}
                  style={styles.accessItem}
                >
                  <View style={styles.radioOuterSmall}>
                    {access[k] && <View style={styles.radioInnerSmall} />}
                  </View>
                  <AppText style={styles.accessText}>{label}</AppText>
                </Pressable>
              ))}
            </View>

            <View style={styles.accessHeaderRow}>
              <AppText style={styles.accessTitle}>Warehouse access:</AppText>
            </View>

            <View style={styles.warehouseGrid}>
              {USE_REAL_API && warehouses.length === 0 ? (
                <AppText style={styles.warehouseEmpty}>No warehouses found</AppText>
              ) : (
                warehouses.map((w) => (
                  <Pressable
                    key={w.id}
                    onPress={() => toggleWarehouseId(w.id)}
                    style={styles.warehouseItem}
                  >
                    <View style={styles.radioOuterSmall}>
                      {warehouseIds.includes(w.id) && (
                        <View style={styles.radioInnerSmall} />
                      )}
                    </View>
                    <AppText style={styles.warehouseText}>{w.name}</AppText>
                  </Pressable>
                ))
              )}
            </View>

            <AppButton
              title="Submit"
              disabled={!canSubmitCreate}
              onPress={handleCreate}
              style={styles.submitBtn}
            />
          </Card>
        )}

        {rows.map((u) => {
          const isThisEditOpen = editUserId === u.id;
          const isThisLogOpen = logUserId === u.id;

          return (
            <View key={u.id} style={{ marginTop: 12 }}>
              <Card style={styles.userCard}>
                <View style={styles.userTop}>
                  <View style={styles.avatarWrap}>
                    <Image
                      source={require("../../assets/images/dashboard/avatar-placeholder.png")}
                      style={{ width: 44, height: 44 }}
                      resizeMode="contain"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <AppText style={styles.userId}>{u.id}</AppText>
                    <AppText style={styles.userName}>{u.name}</AppText>
                  </View>

                  <View style={styles.rightMeta}>
                    <View style={styles.phoneRow}>
                      <Image
                        source={require("../../assets/icons/common/phone.png")}
                        style={{ width: 14, height: 14 }}
                        resizeMode="contain"
                      />
                      <AppText style={styles.userPhone}>{u.phone}</AppText>
                    </View>

                    <View style={styles.statusRow}>
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: u.active ? UI.green : UI.gray },
                        ]}
                      />
                      <AppText style={styles.statusText}>
                        {u.active ? "active" : "not active"}
                      </AppText>
                    </View>
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  <ActionPill
                    filled
                    label="Edit"
                    icon={require("../../assets/icons/common/edit.png")}
                    onPress={() => openEdit(u)}
                  />
                  <ActionPill
                    /** ✅ حذف \n */
                    label="Change Pass"
                    icon={require("../../assets/icons/common/lock.png")}
                    onPress={() => openPasswordModal(u)}
                  />
                  <ActionPill
                    label="logs"
                    icon={require("../../assets/icons/common/logs.png")}
                    onPress={() => openLog(u)}
                  />
                  <ActionPill
                    label={u.active ? "Block" : "Unblock"}
                    icon={require("../../assets/icons/common/block.png")}
                    danger
                    onPress={() => openBlockModal(u)}
                  />
                </View>
              </Card>

              {isThisEditOpen && (
                <Card style={styles.formCard}>
                  <View style={styles.formHeader}>
                    <View style={{ width: 28 }} />
                    <AppText style={styles.formTitle}>Edit User</AppText>

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
                    label="Name &Lastname"
                    value={editFullName}
                    onChangeText={setEditFullName}
                    placeholder="Name & Lastname"
                    style={{ marginTop: 10 }}
                  />

                  <AppInput
                    label="phone:"
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="phone"
                    keyboardType="phone-pad"
                    style={{ marginTop: 10 }}
                  />

                  <AppInput
                    label="Email:"
                    value={editEmail}
                    onChangeText={setEditEmail}
                    placeholder="email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={{ marginTop: 10 }}
                  />

                  <View style={styles.accessHeaderRow}>
                    <AppText style={styles.accessTitle}>
                      Access to sections:
                    </AppText>
                    <Image
                      source={require("../../assets/icons/common/question-mark.png")}
                      style={{ width: 14, height: 14 }}
                      resizeMode="contain"
                    />
                  </View>

                  <View style={styles.accessGrid}>
                    {(
                      [
                        ["invoices", "Invoices"],
                        ["customers", "Customers"],
                        ["products", "Products"],
                        ["warehouse", "Warehouse"],
                        ["reports", "Reports"],
                        ["settings", "Settings"],
                      ] as [AccessKey, string][]
                    ).map(([k, label]) => (
                      <Pressable
                        key={k}
                        onPress={() => toggleEditAccess(k)}
                        style={styles.accessItem}
                      >
                        <View style={styles.radioOuterSmall}>
                          {editAccess[k] && (
                            <View style={styles.radioInnerSmall} />
                          )}
                        </View>
                        <AppText style={styles.accessText}>{label}</AppText>
                      </Pressable>
                    ))}
                  </View>

                  <View style={styles.accessHeaderRow}>
                    <AppText style={styles.accessTitle}>Warehouse access:</AppText>
                  </View>

                  <View style={styles.warehouseGrid}>
                    {USE_REAL_API && warehouses.length === 0 ? (
                      <AppText style={styles.warehouseEmpty}>No warehouses found</AppText>
                    ) : (
                      warehouses.map((w) => (
                        <Pressable
                          key={w.id}
                          onPress={() => toggleEditWarehouseId(w.id)}
                          style={styles.warehouseItem}
                        >
                          <View style={styles.radioOuterSmall}>
                            {editWarehouseIds.includes(w.id) && (
                              <View style={styles.radioInnerSmall} />
                            )}
                          </View>
                          <AppText style={styles.warehouseText}>{w.name}</AppText>
                        </Pressable>
                      ))
                    )}
                  </View>

                  <AppButton
                    title="Submit"
                    disabled={!canSubmitEdit}
                    onPress={handleUpdate}
                    style={styles.submitBtn}
                  />
                </Card>
              )}

              {isThisLogOpen && (
                <Card style={styles.formCard}>
                  <View style={styles.formHeader}>
                    <View style={{ width: 28 }} />
                    <AppText style={styles.formTitle}>log</AppText>

                    <Pressable
                      onPress={closeLog}
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

                  {USE_REAL_API ? (
                    auditLoading ? (
                      <AppText color={AppColors.muted} style={{ marginTop: 10 }}>
                        Loading logs...
                      </AppText>
                    ) : (auditLogs[String(u.id)]?.length ?? 0) === 0 ? (
                      <AppText color={AppColors.muted} style={{ marginTop: 10 }}>
                        No logs available yet.
                      </AppText>
                    ) : (
                      <View style={styles.logTable}>
                        <View style={styles.logRowHead}>
                          <AppText style={styles.logHeadText}>date</AppText>
                          <AppText style={styles.logHeadText}>description</AppText>
                        </View>

                        {auditLogs[String(u.id)]!.map((log) => (
                          <View key={log.id} style={styles.logRow}>
                            <AppText style={styles.logCell}>
                              {new Date(log.createdAt).toLocaleString()}
                            </AppText>
                            <AppText style={styles.logCell}>
                              {log.action} • {log.method} {log.path}
                            </AppText>
                          </View>
                        ))}
                      </View>
                    )
                  ) : (
                    <View style={styles.logTable}>
                      <View style={styles.logRowHead}>
                        <AppText style={styles.logHeadText}>date</AppText>
                        <AppText style={styles.logHeadText}>description</AppText>
                      </View>

                      {[
                        ["2021-08-23 18:35", "add new invoice 2233"],
                        ["2021-08-23 16:35", "add new invoice 332982"],
                        ["2021-08-23 12:35", "add new invoice 2837"],
                        ["2021-08-23 12:12", "add new invoice 24367"],
                      ].map(([d, desc]) => (
                        <View key={d} style={styles.logRow}>
                          <AppText style={styles.logCell}>{d}</AppText>
                          <AppText style={styles.logCell}>{desc}</AppText>
                        </View>
                      ))}
                    </View>
                  )}
                </Card>
              )}
            </View>
          );
        })}
      </ScrollView>

      {!!PasswordUser && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Pressable onPress={closePasswordModal} style={styles.modalX}>
              <Image
                source={require("../../assets/icons/common/close.png")}
                style={{ width: 18, height: 18 }}
                resizeMode="contain"
              />
            </Pressable>

            <View style={styles.modalTitleRow}>
              <Image
                source={require("../../assets/icons/common/warn.png")}
                style={{ width: 18, height: 18 }}
                resizeMode="contain"
              />
              <AppText style={styles.modalTitle}>Change Password</AppText>
            </View>

            <AppText style={styles.modalSub}>{PasswordUser.name}</AppText>

            <AppInput
              label="Password:"
              value={newPass}
              onChangeText={setNewPass}
              placeholder="Password"
              secureTextEntry
              style={{ marginTop: 10 }}
            />
            <AppInput
              label="Repeat Password:"
              value={newPass2}
              onChangeText={setNewPass2}
              placeholder="Repeat Password"
              secureTextEntry
              style={{ marginTop: 10 }}
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={closePasswordModal}
                style={styles.modalCancel}
              >
                <AppText style={styles.modalCancelText}>Cancel</AppText>
              </Pressable>

              <Pressable
                onPress={handleChangePassword}
                disabled={!canChangePassword}
                style={[
                  styles.modalPrimary,
                  !canChangePassword && { opacity: 0.5 },
                ]}
              >
                <AppText style={styles.modalPrimaryText}>Change</AppText>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {!!BlockUser && (
        <View style={styles.modalOverlay}>
          <View style={styles.blockCard}>
            <Pressable onPress={closeBlockModal} style={styles.modalX}>
              <Image
                source={require("../../assets/icons/common/close.png")}
                style={{ width: 18, height: 18 }}
                resizeMode="contain"
              />
            </Pressable>

            <Image
              source={require("../../assets/icons/common/block-big.png")}
              style={{ width: 56, height: 56, marginTop: 6 }}
              resizeMode="contain"
            />

            <AppText style={styles.blockTitle}>
              Do you want to {BlockUser.active ? "Block" : "Unblock"}
              {"\n"}
              {BlockUser.name}?
            </AppText>

            <View style={styles.modalActions}>
              <Pressable onPress={closeBlockModal} style={styles.modalCancel}>
                <AppText style={styles.modalCancelText}>cancel</AppText>
              </Pressable>

              <Pressable onPress={handleToggleBlockUser} style={styles.modalPrimary}>
                <AppText style={styles.modalPrimaryText}>
                  {BlockUser.active ? "Block" : "Unblock"}
                </AppText>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function ActionPill({
  label,
  icon,
  onPress,
  filled,
  danger,
}: {
  label: string;
  icon: any;
  onPress: () => void;
  filled?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pill,
        filled && styles.pillFilled,
        danger && !filled && { borderColor: UI.border },
      ]}
    >
      <Image
        source={icon}
        style={{ width: 14, height: 14 }}
        resizeMode="contain"
      />
      <AppText
        style={[
          styles.pillText,
          filled && { color: "#fff" },
          danger && !filled && { color: UI.primary },
        ]}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: UI.softBg,
    paddingHorizontal: 16,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 8,
  },

  backBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  title: {
    fontSize: 18,
    fontWeight: "900",
    color: AppColors.text,
    flex: 1,
  },

  newUserBtn: {
    height: 34,
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: UI.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  newUserText: { color: "#fff", fontSize: 12, fontWeight: "900" },

  newUserIcon: {},

  formCard: {
    padding: 14,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: UI.border,
    backgroundColor: "#fff",
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  formTitle: { fontSize: 16, fontWeight: "900", color: UI.primary },
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
    borderColor: UI.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: UI.yellow,
  },
  radioText: { fontSize: 12, fontWeight: "800", color: UI.primary },

  accessHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  accessTitle: { fontSize: 12, fontWeight: "900", color: UI.primary },

  accessGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
    columnGap: 16,
    marginTop: 10,
  },
  warehouseGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
    columnGap: 16,
    marginTop: 10,
  },
  warehouseItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: "45%",
  },
  warehouseText: { fontSize: 11, fontWeight: "800", color: UI.primary },
  warehouseEmpty: { fontSize: 12, color: AppColors.muted },
  accessItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "28%",
  },
  radioOuterSmall: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: UI.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInnerSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: UI.yellow,
  },
  accessText: { fontSize: 11, fontWeight: "800", color: UI.primary },

  submitBtn: {
    marginTop: 16,
    height: 46,
    borderRadius: 12,
    backgroundColor: UI.primary,
  },

  userCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: UI.border,
    backgroundColor: "#fff",
  },
  userTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: AppColors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  userId: { fontSize: 11, fontWeight: "800", color: UI.muted },
  userName: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "900",
    color: UI.primary,
  },

  rightMeta: { alignItems: "flex-end", gap: 6 },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  userPhone: { fontSize: 12, fontWeight: "900", color: UI.primary },

  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: "800", color: AppColors.muted },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 5,
  },

  pill: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: UI.primary,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 8,
  },
  pillFilled: {
    backgroundColor: UI.primary,
    borderColor: UI.primary,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "900",
    color: UI.primary,
    textAlign: "center",
    lineHeight: 12,
  },

  logTable: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#808080",
    borderRadius: 6,
    overflow: "hidden",
  },
  logRowHead: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#808080",
  },
  logHeadText: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: "900",
    color: UI.danger,
    textTransform: "lowercase",
  },
  logRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#808080",
  },
  logCell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 10,
    fontWeight: "800",
    color: "#222",
  },

  modalOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: UI.border,
    padding: 14,
  },
  modalX: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  modalTitle: { fontSize: 16, fontWeight: "900", color: UI.primary },
  modalSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "900",
    color: UI.primary,
  },

  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  modalCancel: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#E8E8E8",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: { fontSize: 12, fontWeight: "900", color: "#A6A6A6" },

  modalPrimary: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: UI.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  modalPrimaryText: { fontSize: 12, fontWeight: "900", color: "#fff" },

  blockCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: UI.border,
    padding: 18,
    alignItems: "center",
  },
  blockTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "900",
    color: UI.primary,
    textAlign: "center",
    lineHeight: 24,
  },
});
