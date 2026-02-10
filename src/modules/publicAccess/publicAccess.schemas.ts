import { z } from "zod";

export const requestPublicTokenSchema = z.object({
    phone: z.string().min(11).max(15),
});

export const publicInvoicesQuerySchema = z.object({
    phone: z.string().min(11).max(15),
    token: z.string().min(16),
});
