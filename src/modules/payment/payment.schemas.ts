import { z } from "zod";
import { priceSchema } from "../../utils/validation";

export const invoiceIdParamSchema = z.object({
    invoiceId: z.preprocess(
        (v) => (typeof v === "string" ? Number(v) : v),
        z.number().int().positive()
    ),
});

export const paymentIdParamSchema = z.object({
    paymentId: z.preprocess(
        (v) => (typeof v === "string" ? Number(v) : v),
        z.number().int().positive()
    ),
});

export const createPaymentSchema = z.object({
    amount: priceSchema,
    method: z.enum(["CASH", "CARD", "TRANSFER"]),
    note: z.string().max(500).optional(),
    paidAt: z.string().datetime().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
