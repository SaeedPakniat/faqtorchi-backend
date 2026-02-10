import { z } from "zod";
import { moneyBigIntSchema, percentBigIntSchema } from "../../utils/validation";

export const createDiscountCodeSchema = z.object({
    code: z.string().min(3).max(64).optional(),
    type: z.enum(["PERCENT", "FIXED"]),
    value: z.union([percentBigIntSchema, moneyBigIntSchema]),
    variantId: z.number().int().positive().optional(),
    maxUses: z.number().int().positive().optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
    isActive: z.boolean().optional(),
});

export type CreateDiscountCodeInput = z.infer<typeof createDiscountCodeSchema>;

export const listDiscountCodesSchema = z.object({
    active: z.preprocess(
        (v) => (typeof v === "string" ? v === "true" : v),
        z.boolean().optional()
    ),
});

export type ListDiscountCodesInput = z.infer<typeof listDiscountCodesSchema>;

export const discountCodeIdParamSchema = z.object({
    id: z.preprocess(
        (v) => (typeof v === "string" ? Number(v) : v),
        z.number().int().positive()
    ),
});

export const updateDiscountCodeSchema = z.object({
    isActive: z.boolean().optional(),
    maxUses: z.number().int().positive().optional(),
    endsAt: z.string().datetime().optional(),
});

export type UpdateDiscountCodeInput = z.infer<typeof updateDiscountCodeSchema>;
