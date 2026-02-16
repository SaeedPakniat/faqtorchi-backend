import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppText from "@/components/ui/AppText";
import Card from "@/components/ui/Card";
import { AppColors } from "@/constants/appColors";

import { ApiError, USE_REAL_API } from "@/src/lib/api";
import { loginUser, registerUser } from "@/src/lib/authApi";
import { useAuth } from "@/src/store/auth/AuthContext";
import { setPhoneRegistered } from "@/src/store/auth/registeredRegistry";
import { setRoleForPhone } from "@/src/store/auth/roleRegistry";
import { isValidIranPhone, normalizeIranPhone } from "@/src/utils/phone";

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string }>();

  const [role, setRole] = useState<"seller" | "customer">("seller");
  const [phone, setPhone] = useState((params.phone ?? "").trim());
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { login, setRole: setAuthRole, setAccessToken } = useAuth();

  const phoneError = useMemo(() => {
    if (!touched) return "";
    if (phone.length === 0) return "Please enter your mobile number";
    if (!isValidIranPhone(phone))
      return "Invalid mobile number (e.g., 09123456789)";
    return "";
  }, [phone, touched]);

  const passwordError = useMemo(() => {
    if (!touched) return "";
    if (password.length === 0) return "Please enter your password";
    if (password.length < 8) return "Password must be at least 8 characters";
    return "";
  }, [password, touched]);

  const canSubmit =
    isValidIranPhone(phone) && password.length >= 8 && !submitting;

  const onRegister = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setError("");
    try {
      if (USE_REAL_API) {
        await registerUser({
          phone,
          password,
          email: email.trim() || undefined,
          name: name.trim() || undefined,
          role: role === "seller" ? "SELLER" : "USER",
        });

        const res = await loginUser({ phone, password });
        setAccessToken(res.accessToken);
      }

      login(phone);
      setAuthRole(role);
      await setRoleForPhone(phone, role);
      await setPhoneRegistered(phone);

      if (role === "seller") {
        router.replace({ pathname: "/(auth)/info", params: { phone } } as any);
      } else {
        router.replace("/gate");
      }
    } catch (e) {
      const err = e as ApiError;
      setError(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <AppText variant="title" style={styles.title}>
        Create account
      </AppText>

      <Card>
        <AppText variant="subtitle">Role</AppText>
        <View style={styles.roleRow}>
          <AppButton
            title="Seller"
            variant={role === "seller" ? "primary" : "outline"}
            onPress={() => setRole("seller")}
            style={{ flex: 1 }}
            disabled={submitting}
          />
          <AppButton
            title="Customer"
            variant={role === "customer" ? "primary" : "outline"}
            onPress={() => setRole("customer")}
            style={{ flex: 1 }}
            disabled={submitting}
          />
        </View>

        <AppInput
          label="Mobile number"
          value={phone}
          onChangeText={(txt) => setPhone(normalizeIranPhone(txt))}
          placeholder="e.g., 09123456789"
          keyboardType="number-pad"
          maxLength={11}
          onBlur={() => setTouched(true)}
          error={phoneError}
          style={{ marginTop: 12 }}
        />

        <AppInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="********"
          secureTextEntry
          onBlur={() => setTouched(true)}
          error={passwordError}
          style={{ marginTop: 10 }}
        />

        <AppInput
          label="Email (optional)"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          style={{ marginTop: 10 }}
        />

        <AppInput
          label="Name (optional)"
          value={name}
          onChangeText={setName}
          placeholder="Full name"
          style={{ marginTop: 10 }}
        />

        {!!error && (
          <AppText color={AppColors.danger} style={{ marginTop: 8 }}>
            {error}
          </AppText>
        )}

        <AppButton
          title={submitting ? "Creating..." : "Create account"}
          disabled={!canSubmit}
          onPress={onRegister}
          style={{ marginTop: 12 }}
        />

        <AppButton
          title="Back to login"
          variant="outline"
          onPress={() => router.replace("/(auth)/login")}
          disabled={submitting}
          style={{ marginTop: 6 }}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
    padding: 16,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    gap: 12,
  },
  title: { marginBottom: 8 },
  roleRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
});
