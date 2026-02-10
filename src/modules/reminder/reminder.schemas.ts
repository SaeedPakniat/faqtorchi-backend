import { z } from "zod";

export const invoiceIdParamSchema = z.object({
    invoiceId: z.preprocess(
        (v) => (typeof v === "string" ? Number(v) : v),
        z.number().int().positive()
    ),
});

export const reminderIdParamSchema = z.object({
    reminderId: z.preprocess(
        (v) => (typeof v === "string" ? Number(v) : v),
        z.number().int().positive()
    ),
});

export const createRemindersSchema = z.object({
    installments: z
        .array(
            z.object({
                dueAt: z.string().datetime(),
                remindDaysBefore: z.number().int().min(1).max(30),
                channel: z.enum(["SMS", "NOTIF"]),
                message: z.string().max(500).optional(),
            })
        )
        .min(1),
});

export type CreateRemindersInput = z.infer<typeof createRemindersSchema>;
