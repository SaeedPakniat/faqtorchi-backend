import * as SecureStore from "expo-secure-store";
import type { Invoice } from "./models";

const KEY = "atomic_invoices_v1";

export async function loadInvoices(): Promise<Invoice[]> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Invoice[];
  } catch {
    return [];
  }
}

export async function saveInvoices(invoices: Invoice[]): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(invoices));
}

export async function clearInvoices(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}
