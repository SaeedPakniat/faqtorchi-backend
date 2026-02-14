import { z } from "zod";

export const setInvoiceTemplateSchema = z.object({
    templateId: z.enum(["default", "green-v1", "blue-min", "slate-modern", "sunrise-classic", "mono-grid"]),
});

export const setBaseCurrencySchema = z.object({
    baseCurrency: z.enum(["IRR", "IRT", "USD", "EUR"]),
});

export const setNotificationSettingsSchema = z.object({
    notifyInvoiceIssued: z.boolean().optional(),
    notifyInvoiceStatusChange: z.boolean().optional(),
    notifyPaymentReminder: z.boolean().optional(),
    notifyLowStock: z.boolean().optional(),
    lowStockThreshold: z.coerce.number().int().min(1).optional(),
});

export type SetInvoiceTemplateInput = z.infer<typeof setInvoiceTemplateSchema>;
export type SetBaseCurrencyInput = z.infer<typeof setBaseCurrencySchema>;
export type SetNotificationSettingsInput = z.infer<typeof setNotificationSettingsSchema>;
