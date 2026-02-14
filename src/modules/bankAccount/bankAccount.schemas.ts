import { z } from "zod";

export const bankAccountIdParamSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export const createBankAccountSchema = z.object({
    name: z.string().min(2),
    accountNumber: z.string().min(6),
    isActive: z.boolean().optional(),
});

export const updateBankAccountSchema = createBankAccountSchema.partial();

export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>;
export type UpdateBankAccountInput = z.infer<typeof updateBankAccountSchema>;
