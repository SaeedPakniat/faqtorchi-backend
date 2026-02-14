import { z } from "zod";

export const shippingMethodIdParamSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export const createShippingMethodSchema = z.object({
    name: z.string().min(2),
    price: z.coerce.number().int().nonnegative(),
    currency: z.enum(["IRR", "IRT", "USD", "EUR"]).optional(),
    isActive: z.boolean().optional(),
});

export const updateShippingMethodSchema = createShippingMethodSchema.partial();

export type CreateShippingMethodInput = z.infer<typeof createShippingMethodSchema>;
export type UpdateShippingMethodInput = z.infer<typeof updateShippingMethodSchema>;
