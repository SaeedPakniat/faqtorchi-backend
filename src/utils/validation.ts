import { z } from "zod";

export const moneySchema = z.preprocess((v) => {
    // allow numbers, numeric strings, bigint
    if (typeof v === "bigint") return v;
    if (typeof v === "number") return v;
    if (typeof v === "string") return v.trim();
    return v;
}, z.union([
    z.bigint(),
    z.number().int().nonnegative().transform((n) => BigInt(n)),
    z.string().regex(/^\d+$/).transform((s) => BigInt(s)),
]));
