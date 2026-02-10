import { z } from "zod";
import { moneySchema } from "../../utils/validation";

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

    discount: moneySchema.default(0n),
    tax: moneySchema.default(0n),

    items: z.array(warehouseInvoiceItemSchema).min(1),
});

export type CreateWarehouseInvoiceInput = z.infer<typeof createWarehouseInvoiceSchema>;

export const invoiceIdParamSchema = z.object({
    id: z.preprocess(
        (v) => (typeof v === "string" ? Number(v) : v),
        z.number().int().positive()
    ),
});

export const listInvoicesSchema = z.object({
    status: z
        .enum(["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "CANCELED"])
        .optional(),
    type: z.enum(["INSTANT", "WAREHOUSE"]).optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    page: z.preprocess(
        (v) => (typeof v === "string" ? Number(v) : v),
        z.number().int().positive().default(1)
    ),
    pageSize: z.preprocess(
        (v) => (typeof v === "string" ? Number(v) : v),
        z.number().int().positive().max(200).default(20)
    ),
});

export type ListInvoicesInput = z.infer<typeof listInvoicesSchema>;
