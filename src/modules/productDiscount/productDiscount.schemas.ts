import { z } from "zod";

export const productDiscountIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createProductDiscountSchema = z
  .object({
    productId: z.coerce.number().int().positive().optional(),
    variantId: z.coerce.number().int().positive().optional(),
    type: z.enum(["PERCENT", "FIXED"]),
    value: z.coerce.number().int().nonnegative(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => data.productId || data.variantId, {
    message: "productId or variantId is required",
  })
  .refine((data) => !data.startsAt || !data.endsAt || data.endsAt >= data.startsAt, {
    message: "endsAt must be after startsAt",
  });

export const updateProductDiscountSchema = createProductDiscountSchema.partial();

export const listProductDiscountsSchema = z.object({
  productId: z.coerce.number().int().positive().optional(),
  variantId: z.coerce.number().int().positive().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type CreateProductDiscountInput = z.infer<typeof createProductDiscountSchema>;
export type UpdateProductDiscountInput = z.infer<typeof updateProductDiscountSchema>;
export type ListProductDiscountsInput = z.infer<typeof listProductDiscountsSchema>;
