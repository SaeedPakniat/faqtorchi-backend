import * as SecureStore from "expo-secure-store";
import { InventoryState, DEFAULT_LOW_STOCK_THRESHOLD } from "./models";

const KEY = "inventory_state_v1";

export async function loadInventoryState(): Promise<InventoryState> {
  const raw = await SecureStore.getItemAsync(KEY);
  if (!raw) {
    return {
      warehouses: [],
      products: [],
      variants: [],
      inventory: [],
      lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
    };
  }
  try {
    const parsed = JSON.parse(raw) as InventoryState;
    return {
      warehouses: parsed.warehouses ?? [],
      products: parsed.products ?? [],
      variants: parsed.variants ?? [],
      inventory: parsed.inventory ?? [],
      lowStockThreshold:
        typeof parsed.lowStockThreshold === "number"
          ? parsed.lowStockThreshold
          : DEFAULT_LOW_STOCK_THRESHOLD,
    };
  } catch {
    return {
      warehouses: [],
      products: [],
      variants: [],
      inventory: [],
      lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
    };
  }
}

export async function saveInventoryState(state: InventoryState) {
  await SecureStore.setItemAsync(KEY, JSON.stringify(state));
}
