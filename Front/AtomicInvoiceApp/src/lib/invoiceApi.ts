import { apiGet, apiPost } from "./api";

export function generateInvoicePdf(invoiceId: number) {
  return apiPost<{ invoiceId: number; pdfUrlPublic?: string; pdfToken?: string }>(
    `/invoices/${invoiceId}/pdf`,
  );
}

export function cancelInvoice(invoiceId: number) {
  return apiPost<{ invoice: any }>(`/invoices/${invoiceId}/cancel`);
}

export function listInvoicePayments(invoiceId: number) {
  return apiGet<{ payments: any[] }>(`/invoices/${invoiceId}/payments`);
}
