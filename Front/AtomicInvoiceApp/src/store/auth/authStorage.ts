import * as SecureStore from "expo-secure-store";

const KEY_PHONE = "auth_phone";
const KEY_ROLE = "auth_role";
const KEY_ACCESS_TOKEN = "auth_access_token";

export async function saveAuth(
  phone: string,
  role: string | undefined,
  accessToken?: string,
) {
  await SecureStore.setItemAsync(KEY_PHONE, phone);
  if (role) {
    await SecureStore.setItemAsync(KEY_ROLE, role);
  } else {
    await SecureStore.deleteItemAsync(KEY_ROLE);
  }
  if (accessToken) {
    await SecureStore.setItemAsync(KEY_ACCESS_TOKEN, accessToken);
  } else {
    await SecureStore.deleteItemAsync(KEY_ACCESS_TOKEN);
  }
}

export async function loadAuth(): Promise<{
  phone?: string;
  role?: string;
  accessToken?: string;
}> {
  const phone = await SecureStore.getItemAsync(KEY_PHONE);
  const role = await SecureStore.getItemAsync(KEY_ROLE);
  const accessToken = await SecureStore.getItemAsync(KEY_ACCESS_TOKEN);
  return {
    phone: phone ?? undefined,
    role: role ?? undefined,
    accessToken: accessToken ?? undefined,
  };
}

export async function clearAuth() {
  await SecureStore.deleteItemAsync(KEY_PHONE);
  await SecureStore.deleteItemAsync(KEY_ROLE);
  await SecureStore.deleteItemAsync(KEY_ACCESS_TOKEN);
}

export async function getAccessToken() {
  return (await SecureStore.getItemAsync(KEY_ACCESS_TOKEN)) ?? undefined;
}

export async function saveAccessToken(token?: string) {
  if (token) {
    await SecureStore.setItemAsync(KEY_ACCESS_TOKEN, token);
  } else {
    await SecureStore.deleteItemAsync(KEY_ACCESS_TOKEN);
  }
}
