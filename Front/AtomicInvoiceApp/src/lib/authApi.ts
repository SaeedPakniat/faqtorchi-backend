import { apiGet, apiPost } from "./api";

export function registerUser(input: { phone: string; password: string; email?: string; name?: string; role?: string }) {
  return apiPost<{ user: any }>("/auth/register", input, { auth: false });
}

export function loginUser(input: { phone: string; password: string }) {
  return apiPost<{ user: any; accessToken: string }>("/auth/login", input, { auth: false, credentials: "include" });
}

export function refreshSession() {
  return apiPost<{ accessToken: string }>("/auth/refresh", undefined, { auth: false, credentials: "include" });
}

export function logoutSession() {
  return apiPost<{ ok: boolean }>("/auth/logout", undefined, { auth: false, credentials: "include" });
}

export function checkPhoneRegistered(phone: string) {
  return apiGet<{ exists: boolean }>(`/auth/exists?phone=${encodeURIComponent(phone)}`, { auth: false });
}
