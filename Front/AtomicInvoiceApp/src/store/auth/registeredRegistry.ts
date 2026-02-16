import * as SecureStore from "expo-secure-store";

const KEY_REGISTERED_MAP = "registered_map_v1";

type RegisteredMap = Record<string, boolean>;

async function readMap(): Promise<RegisteredMap> {
  const raw = await SecureStore.getItemAsync(KEY_REGISTERED_MAP);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as RegisteredMap;
  } catch {
    return {};
  }
}

async function writeMap(map: RegisteredMap) {
  await SecureStore.setItemAsync(KEY_REGISTERED_MAP, JSON.stringify(map));
}

export async function isPhoneRegistered(phone: string): Promise<boolean> {
  const map = await readMap();
  return Boolean(map[phone]);
}

export async function setPhoneRegistered(phone: string): Promise<void> {
  const map = await readMap();
  map[phone] = true;
  await writeMap(map);
}
