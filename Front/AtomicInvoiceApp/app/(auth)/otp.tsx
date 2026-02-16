// app/(auth)/otp.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import AppButton from "../../components/ui/AppButton";
import AppText from "../../components/ui/AppText";
import Card from "../../components/ui/Card";
import { AppColors } from "../../constants/appColors";
import { USE_REAL_API } from "../../src/lib/api";
import { checkPhoneRegistered } from "../../src/lib/authApi";
import { useAuth } from "../../src/store/auth/AuthContext";
import { getProfileByPhone } from "../../src/store/auth/profileRegistry";
import { getRoleByPhone } from "../../src/store/auth/roleRegistry";

export default function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string }>();
  const phone = (params.phone ?? "").trim();
  const { setRole } = useAuth();

  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!phone) {
      setRegistered(false);
      return;
    }
    if (!USE_REAL_API) {
      setRegistered(true);
      return;
    }
    (async () => {
      try {
        const res = await checkPhoneRegistered(phone);
        if (mounted) setRegistered(Boolean(res.exists));
      } catch {
        if (mounted) setRegistered(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [phone]);

  const canVerify = useMemo(
    () => code.trim().length === 4 && !verifying,
    [code, verifying],
  );

  const onVerify = async () => {
    if (!canVerify) return;

    setError("");
    setVerifying(true);
    try {
      if (USE_REAL_API && registered === false) {
        setError("This number is not registered. Please register first.");
        return;
      }

      // Today: mock
      if (code.trim() !== "1234") {
        setError("Invalid code. Please try again.");
        return;
      }

      // Find the previous role for this phone number
      const savedRole = phone ? await getRoleByPhone(phone) : undefined;

      if (savedRole === "seller" || savedRole === "customer") {
        setRole(savedRole);

        // Only for seller we require completing the profile
        if (savedRole === "seller") {
          const profile = phone ? await getProfileByPhone(phone) : null;
          if (!profile) {
            router.replace({
              pathname: "/(auth)/info",
              params: { phone },
            } as any);
            return;
          }
        }

        router.replace("/gate");
        return;
      }

      // New number → choose role first
      if (!USE_REAL_API) {
        router.replace({ pathname: "/(auth)/role", params: { phone } } as any);
        return;
      }

      setError("This number is not registered. Please register first.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppText variant="title" style={styles.title}>
        Verify code
      </AppText>

      <AppText color={AppColors.muted}>
        We sent a code to {phone || "..."}.
      </AppText>

      <Card style={{ marginTop: 12 }}>
        <AppText variant="subtitle">4-digit code</AppText>

        <TextInput
          value={code}
          onChangeText={(t) => {
            setCode(t.replace(/\D/g, "")); // digits only
            if (error) setError("");
          }}
          placeholder="e.g., 1234"
          keyboardType="number-pad"
          maxLength={4}
          style={styles.input}
          placeholderTextColor={AppColors.muted}
        />

        {!!error && <AppText style={styles.errorText}>{error}</AppText>}

        <AppButton
          title={verifying ? "Verifying..." : "Verify"}
          onPress={onVerify}
          disabled={!canVerify}
          style={{ marginTop: 12 }}
        />
        {USE_REAL_API && registered === false && (
          <AppButton
            title="Register"
            variant="outline"
            onPress={() =>
              router.replace({
                pathname: "/(auth)/register",
                params: { phone },
              } as any)
            }
            style={{ marginTop: 10 }}
            disabled={verifying}
          />
        )}
        <AppButton
          title="Back"
          variant="outline"
          onPress={() => router.back()}
          style={{ marginTop: 10 }}
          disabled={verifying}
        />
      </Card>

      <AppText
        variant="small"
        color={AppColors.muted}
        style={{ marginTop: 10 }}
      >
        Test code: 1234
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    padding: 16,
    justifyContent: "center",
  },
  title: { marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    color: AppColors.text,
    backgroundColor: "#fff",
    letterSpacing: 6,
    textAlign: "center",
    fontSize: 18,
  },
  errorText: {
    marginTop: 8,
    color: AppColors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
});
