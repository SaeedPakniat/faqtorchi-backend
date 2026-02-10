import { z } from "zod";

export const priceSchema = z.union([
    z.number().int().positive(),
    z.string().regex(/^\\d+$/).transform((v) => Number(v)),
]);

