import { z } from "zod";

export const adjustInventorySchema = z.object({
    warehouseId: z.number().int().positive(),
    variantId: z.number().int().positive(),
    delta: z.number().int(), // can be + or -
    note: z.string().max(500).optional(),
});

export type AdjustInventoryInput = z.infer<typeof adjustInventorySchema>;
