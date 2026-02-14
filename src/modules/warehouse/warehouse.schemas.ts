import { z } from "zod";

export const createWarehouseSchema = z.object({
    name: z.string().min(1),
    location: z.string().optional(),
});

export const updateWarehouseSchema = z.object({
    name: z.string().min(1).optional(),
    location: z.string().nullable().optional(),
});

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;
