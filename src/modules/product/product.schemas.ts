import { z } from "zod";

export const createProductSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const createVariantSchema = z.object({
    sku: z.string().min(1),
    price: z.number().int().nonnegative(),
    attributes: z.record(z.string(), z.any()).optional(),
});


export type CreateVariantInput = z.infer<typeof createVariantSchema>;
