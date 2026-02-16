// app/(auth)/login.tsx
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";

import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppText from "@/components/ui/AppText";
import Card from "@/components/ui/Card";
import { AppColors } from "@/constants/appColors";

import { ApiError, USE_REAL_API } from "../../src/lib/api";
import { loginUser } from "../../src/lib/authApi";
import { useAuth } from "../../src/store/auth/AuthContext";
import { setPhoneRegistered } from "../../src/store/auth/registeredRegistry";
import { setRoleForPhone } from "../../src/store/auth/roleRegistry";
import { isValidIranPhone, normalizeIranPhone } from "../../src/utils/phone";

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const { login, setRole, setAccessToken } = useAuth();

  const phoneError = useMemo(() => {
    if (!touched) return "";
    if (phone.length === 0) return "Please enter your mobile number";
    if (!isValidIranPhone(phone))
      return "Invalid mobile number (e.g., 09123456789)";
    return "";
  }, [phone, touched]);

  const passwordError = useMemo(() => {
    if (!USE_REAL_API) return "";
    if (!touched) return "";
    if (password.length === 0) return "Please enter your password";
    if (password.length < 8) return "Password must be at least 8 characters";
    return "";
  }, [password, touched]);

  const canContinue =
    isValidIranPhone(phone) &&
    (!USE_REAL_API || password.length >= 8) &&
    !submitting;

  const mapRole = (role?: string) => {
    if (!role) return undefined;
    if (role === "SELLER" || role === "ADMIN") return "seller";
    if (role === "USER") return "customer";
    return undefined;
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <AppText variant="title" style={styles.title}>
        Login
      </AppText>

      <Card>
        <AppInput
          label="Mobile number"
          value={phone}
          onChangeText={(txt) => setPhone(normalizeIranPhone(txt))}
          placeholder="e.g., 09123456789"
          keyboardType="number-pad"
          maxLength={11}
          onBlur={() => setTouched(true)}
          error={phoneError}
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

        {!!error && (
          <AppText color={AppColors.danger} style={{ marginTop: 8 }}>
            {error}
          </AppText>
        )}

        <AppButton
          title={submitting ? "Please wait..." : "Continue"}
          disabled={!canContinue}
          onPress={async () => {
            if (!isValidIranPhone(phone) || submitting) return;

            setSubmitting(true);
            try {
              setError("");
              if (USE_REAL_API) {
                const result = await loginUser({ phone, password });

                setAccessToken(result.accessToken);
                login(result.user.phone ?? phone);
                const mapped = mapRole(result.user.role);
                if (mapped) setRole(mapped);
                if (mapped) await setRoleForPhone(phone, mapped);
                await setPhoneRegistered(phone);

                router.replace("/gate");
              } else {
                await Promise.resolve(login(phone));
                router.push({ pathname: "/(auth)/otp", params: { phone } });
              }
            } catch (e) {
              const err = e as ApiError;
              setError(err.message || "Login failed");
            } finally {
              setSubmitting(false);
            }
          }}
          style={{ marginTop: 12 }}
        />

        <AppButton
          title="Login with OTP"
          variant="outline"
          disabled={!isValidIranPhone(phone) || submitting}
          onPress={() => {
            if (!isValidIranPhone(phone) || submitting) return;
            router.push({ pathname: "/(auth)/otp", params: { phone } });
          }}
          style={{ marginTop: 10 }}
        />

        <AppButton
          title="Create account"
          variant="outline"
          onPress={() => {
            if (submitting) return;
            router.push({ pathname: "/(auth)/register", params: { phone } });
          }}
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
});
