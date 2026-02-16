import { apiGet, apiPost } from "./api";

export type ApiCustomer = {
  id: number;
  phone: string;
  name?: string | null;
  notes?: string | null;
  createdAt?: string;
  balances?: {
    currency: "IRR" | "IRT" | "USD" | "EUR";
    total: string | number;
    paid: string | number;
    due: string | number;
  }[];
};

export function listCustomers(params?: { page?: number; pageSize?: number; q?: string }) {
  return apiGet<{
    page: number;
    pageSize: number;
    total: number;
    customers: ApiCustomer[];
  }>("/customers", { query: params });
}

export function createCustomer(input: { phone: string; name?: string; notes?: string }) {
  return apiPost<{ customer: ApiCustomer }>("/customers", input);
}

export function getCustomerById(customerId: number) {
  return apiGet<{ customer: ApiCustomer }>(`/customers/${customerId}`);
}
