import { z } from "zod";
import { Currency } from "@prisma/client";

export const exchangeRateQuerySchema = z.object({
    base: z.nativeEnum(Currency),
    quote: z.nativeEnum(Currency),
});

export type ExchangeRateQueryInput = z.infer<typeof exchangeRateQuerySchema>;
