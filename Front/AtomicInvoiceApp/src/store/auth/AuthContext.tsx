import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearAuth, loadAuth, saveAccessToken, saveAuth } from "./authStorage";

export type UserRole = "seller" | "customer";

type AuthState = {
  loading: boolean;           // ✅ new
  isAuthenticated: boolean;
  phone?: string;
  role?: UserRole;
  accessToken?: string;
};

type AuthContextValue = {
  auth: AuthState;
  login: (phone: string) => void;
  setRole: (role: UserRole) => void;
  setAccessToken: (token?: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [role, setRoleState] = useState<UserRole | undefined>(undefined);
  const [accessToken, setAccessTokenState] = useState<string | undefined>(
    undefined,
  );

  // ✅ 1) On app startup, load from SecureStore
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await loadAuth();
        if (!mounted) return;

        if (data.phone) setPhone(data.phone);
        if (data.role === "seller" || data.role === "customer") {
          setRoleState(data.role);
        }
        if (data.accessToken) setAccessTokenState(data.accessToken);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // ✅ 2) Persist any change in phone/role
  useEffect(() => {
    // Don't write anything until initial load completes
    if (loading) return;

    (async () => {
      if (!phone) {
        await clearAuth();
        return;
      }
      await saveAuth(phone, role, accessToken);
    })();
  }, [phone, role, accessToken, loading]);

  const login = (p: string) => {
    setPhone(p);
  };

  const setRole = (r: UserRole) => {
    setRoleState(r);
  };

  const setAccessToken = (token?: string) => {
    setAccessTokenState(token);
    saveAccessToken(token);
  };

  const logout = () => {
    setPhone(undefined);
    setRoleState(undefined);
    setAccessTokenState(undefined);
  };

  const auth: AuthState = useMemo(
    () => ({
      loading,
      isAuthenticated: Boolean(phone),
      phone,
      role,
      accessToken,
    }),
    [loading, phone, role, accessToken]
  );

  const value: AuthContextValue = useMemo(
    () => ({ auth, login, setRole, setAccessToken, logout }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
