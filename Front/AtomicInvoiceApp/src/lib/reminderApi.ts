import { apiGet, apiPost } from "./api";

export type ApiReminder = {
  id: number;
  invoiceId: number;
  sellerId: number;
  dueAt: string;
  remindAt: string;
  channel: "SMS" | "NOTIF";
  status: "PENDING" | "SENT" | "CANCELED" | string;
  message?: string | null;
  sentAt?: string | null;
  createdAt?: string;
};

export function listInvoiceReminders(invoiceId: number) {
  return apiGet<{ reminders: ApiReminder[] }>(`/invoices/${invoiceId}/reminders`);
}

export function createInvoiceReminders(
  invoiceId: number,
  input: {
    installments: Array<{
      dueAt: string;
      remindDaysBefore: number;
      channel: "SMS" | "NOTIF";
      message?: string;
    }>;
  },
) {
  return apiPost<{ reminders: ApiReminder[] }>(`/invoices/${invoiceId}/reminders`, input);
}

export function cancelReminder(reminderId: number) {
  return apiPost<{ reminder: ApiReminder }>(`/reminders/${reminderId}/cancel`);
}
