import { z } from "zod";

const MONEY_MAX = 10n ** 18n;

export const moneyBigIntSchema = z
    .union([
        z
            .number()
            .int()
            .nonnegative()
            .refine((n) => Number.isSafeInteger(n), { message: "Invalid money value" })
            .transform((n) => BigInt(n)),
        z
            .string()
            .trim()
            .regex(/^\d+$/)
            .transform((s) => BigInt(s)),
    ])
    .refine((v) => v <= MONEY_MAX, { message: "Money value too large" });

export const moneySchema = moneyBigIntSchema;

export const moneyBigIntPositiveSchema = moneyBigIntSchema.refine((v) => v > 0n, {
    message: "Amount must be greater than 0",
});
