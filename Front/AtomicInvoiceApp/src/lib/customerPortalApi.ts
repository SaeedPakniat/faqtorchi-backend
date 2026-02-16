import { apiGet, apiPost } from "./api";

export function registerCustomerPortal(input: {
  phone: string;
  password: string;
  email?: string;
  name?: string;
}) {
  return apiPost<{ user: any }>("/customer/register", input, { auth: false });
}

export function loginCustomerPortal(input: { phone: string; password: string }) {
  return apiPost<{ user: any; accessToken: string; refreshToken: string }>(
    "/customer/login",
    input,
    { auth: false },
  );
}

export function listCustomerPortalInvoices(params?: { page?: number; pageSize?: number }) {
  return apiGet("/customer/invoices", { query: params });
}

export function getCustomerPortalInvoice(id: number) {
  return apiGet(`/customer/invoices/${id}`);
}
