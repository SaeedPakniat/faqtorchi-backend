import { z } from "zod";

export const salesReportQuerySchema = z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
});

export const topProductsQuerySchema = z.object({
    limit: z.preprocess(
        (v) => (typeof v === "string" ? Number(v) : v),
        z.number().int().positive().max(100).default(10)
    ),
});

export const lowStockQuerySchema = z.object({
    threshold: z.preprocess(
        (v) => (typeof v === "string" ? Number(v) : v),
        z.number().int().positive().max(10_000).default(5)
    ),
    warehouseId: z
        .preprocess((v) => (typeof v === "string" ? Number(v) : v), z.number().int().positive())
        .optional(),
});

export type SalesReportQuery = z.infer<typeof salesReportQuerySchema>;
export type TopProductsQuery = z.infer<typeof topProductsQuerySchema>;
export type LowStockQuery = z.infer<typeof lowStockQuerySchema>;
