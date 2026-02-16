import AsyncStorage from "@react-native-async-storage/async-storage";

export type ShopProfile = {
  shopName: string;
  address?: string;
  description?: string;
  phone?: string;
};

const keyOf = (phone: string) => `profile:${phone}`;

export async function getProfileByPhone(
  phone: string,
): Promise<ShopProfile | null> {
  const raw = await AsyncStorage.getItem(keyOf(phone));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ShopProfile;
  } catch {
    return null;
  }
}

export async function setProfileForPhone(phone: string, profile: ShopProfile) {
  await AsyncStorage.setItem(keyOf(phone), JSON.stringify(profile));
}
