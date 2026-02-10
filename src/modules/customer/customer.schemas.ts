import { z } from "zod";

export const createCustomerSchema = z.object({
    phone: z.string().min(5).max(40),
    name: z.string().max(120).optional(),
    notes: z.string().max(500).optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const listCustomersSchema = z.object({
    page: z.preprocess(
        (v) => (typeof v === "string" ? Number(v) : v),
        z.number().int().positive().default(1)
    ),
    pageSize: z.preprocess(
        (v) => (typeof v === "string" ? Number(v) : v),
        z.number().int().positive().max(200).default(20)
    ),
    q: z.string().max(120).optional(),
});

export type ListCustomersInput = z.infer<typeof listCustomersSchema>;

export const customerIdParamSchema = z.object({
    customerId: z.preprocess(
        (v) => (typeof v === "string" ? Number(v) : v),
        z.number().int().positive()
    ),
});
