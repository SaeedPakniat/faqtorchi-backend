import { z } from "zod";

export const createWarehouseSchema = z.object({
    name: z.string().min(1),
    location: z.string().optional(),
});

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
