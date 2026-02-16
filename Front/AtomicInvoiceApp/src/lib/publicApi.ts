import { apiGet, apiPost } from "./api";

export function requestPublicInvoiceToken(phone: string) {
  return apiPost<{ message: string; token?: string }>("/public/invoices/request-token", { phone }, { auth: false });
}

export function listPublicInvoices(params: { phone: string; token: string }) {
  return apiGet("/public/invoices", { query: params, auth: false });
}

export function publicPdfUrl(token: string) {
  return `/public/invoices/${token}/pdf`;
}
