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

export const percentBigIntSchema = z
    .union([
        z
            .number()
            .int()
            .nonnegative()
            .max(100)
            .refine((n) => Number.isSafeInteger(n), { message: "Invalid percent" })
            .transform((n) => BigInt(n)),
        z
            .string()
            .trim()
            .regex(/^\d+$/)
            .transform((s) => BigInt(s)),
    ])
    .refine((v) => v >= 0n && v <= 100n, { message: "Percent must be between 0 and 100" });
