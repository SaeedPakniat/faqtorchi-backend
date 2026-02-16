import { apiGet, apiPut } from "./api";

export type InvoiceTemplateId =
  | "default"
  | "green-v1"
  | "blue-min"
  | "slate-modern"
  | "sunrise-classic"
  | "mono-grid";

export type CurrencyCode = "IRR" | "IRT" | "USD" | "EUR";

export type NotificationSettings = {
  notifyInvoiceIssued: boolean;
  notifyInvoiceStatusChange: boolean;
  notifyPaymentReminder: boolean;
  notifyLowStock: boolean;
  lowStockThreshold: number;
};

export function getInvoiceTemplate() {
  return apiGet<{ templateId: InvoiceTemplateId }>("/seller-settings/invoice-template");
}

export function setInvoiceTemplate(templateId: InvoiceTemplateId) {
  return apiPut<{ templateId: InvoiceTemplateId }>(
    "/seller-settings/invoice-template",
    { templateId },
  );
}

export function getBaseCurrency() {
  return apiGet<{ baseCurrency: CurrencyCode }>("/seller-settings/currency");
}

export function setBaseCurrency(baseCurrency: CurrencyCode) {
  return apiPut<{ baseCurrency: CurrencyCode }>("/seller-settings/currency", {
    baseCurrency,
  });
}

export function getNotificationSettings() {
  return apiGet<NotificationSettings>("/seller-settings/notifications");
}

export function setNotificationSettings(input: Partial<NotificationSettings>) {
  return apiPut<NotificationSettings>("/seller-settings/notifications", input);
}
