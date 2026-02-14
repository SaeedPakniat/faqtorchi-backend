import { z } from "zod";
import { moneyBigIntSchema } from "../../utils/validation";

export const createProductSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = z
    .object({
        name: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
    })
    .refine((v) => v.name !== undefined || v.description !== undefined, {
        message: "At least one field must be provided",
    });

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const createVariantSchema = z.object({
    sku: z.string().min(1),
    price: moneyBigIntSchema, // bigint output
    attributes: z.any().optional(),
});

export type CreateVariantInput = z.infer<typeof createVariantSchema>;

export const updateVariantSchema = z
    .object({
        sku: z.string().min(1).optional(),
        price: moneyBigIntSchema.optional(),
        attributes: z.any().nullable().optional(),
    })
    .refine((v) => v.sku !== undefined || v.price !== undefined || v.attributes !== undefined, {
        message: "At least one field must be provided",
    });

export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
