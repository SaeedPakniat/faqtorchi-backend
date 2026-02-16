import * as SecureStore from "expo-secure-store";

const KEY_ROLE_MAP = "role_map_v1";

type Role = "seller" | "customer";
type RoleMap = Record<string, Role>;

async function readMap(): Promise<RoleMap> {
  const raw = await SecureStore.getItemAsync(KEY_ROLE_MAP);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as RoleMap;
  } catch {
    return {};
  }
}

async function writeMap(map: RoleMap) {
  await SecureStore.setItemAsync(KEY_ROLE_MAP, JSON.stringify(map));
}

export async function getRoleByPhone(phone: string): Promise<Role | undefined> {
  const map = await readMap();
  return map[phone];
}

export async function setRoleForPhone(phone: string, role: Role): Promise<void> {
  const map = await readMap();
  map[phone] = role;
  await writeMap(map);
}
