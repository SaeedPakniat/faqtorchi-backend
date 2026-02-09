import { z } from "zod";

export const createProductSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const priceSchema = z.union([
    z.number().int().positive(),
    z.string().regex(/^\d+$/).transform((v) => Number(v)),
]);

export const createVariantSchema = z.object({
    sku: z.string().min(1),
    price: priceSchema,
    attributes: z.record(z.string(), z.any()).optional(),
});


export type CreateVariantInput = z.infer<typeof createVariantSchema>;
