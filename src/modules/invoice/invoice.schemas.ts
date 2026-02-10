import { z } from "zod";

export const warehouseInvoiceItemSchema = z.object({
    variantId: z.number().int().positive(),
    quantity: z.number().int().positive(),
    description: z.string().max(500).optional(),
});

export const createWarehouseInvoiceSchema = z.object({
    warehouseId: z.number().int().positive(),

    currency: z.enum(["IRR", "IRT", "USD", "EUR"]),

    // optional linkage to registered customer
    customerId: z.number().int().positive().optional(),

    // snapshot for walk-in customers
    customerName: z.string().max(120).optional(),
    customerPhone: z.string().max(40).optional(),

    discount: z.union([z.number().int().nonnegative(), z.string().regex(/^\\d+$/)]).default("0"),
    tax: z.union([z.number().int().nonnegative(), z.string().regex(/^\\d+$/)]).default("0"),

    items: z.array(warehouseInvoiceItemSchema).min(1),
});

export type CreateWarehouseInvoiceInput = z.infer<typeof createWarehouseInvoiceSchema>;
