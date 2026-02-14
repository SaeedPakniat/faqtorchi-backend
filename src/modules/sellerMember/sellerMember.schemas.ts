import { z } from "zod";

export const sellerPermissionsSchema = z.object({
    invoices: z.boolean(),
    customers: z.boolean(),
    products: z.boolean(),
    settings: z.boolean(),
    warehouse: z.boolean(),
    reports: z.boolean(),
});

export type SellerPermissionsInput = z.infer<typeof sellerPermissionsSchema>;

const optionalEmailSchema = z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().email().nullable()
);

export const sellerMemberIdParamSchema = z.object({
    id: z.preprocess(
        (v) => (typeof v === "string" ? Number(v) : v),
        z.number().int().positive()
    ),
});

export const createSellerMemberSchema = z.object({
    name: z.string().min(2).max(120),
    phone: z.string().min(5).max(40),
    email: optionalEmailSchema.optional(),
    password: z.string().min(4).max(200),
    isActive: z.boolean().optional(),
    permissions: sellerPermissionsSchema,
    warehouseIds: z.array(z.number().int().positive()).default([]),
});

export type CreateSellerMemberInput = z.infer<typeof createSellerMemberSchema>;

export const updateSellerMemberSchema = z.object({
    name: z.string().min(2).max(120).optional(),
    phone: z.string().min(5).max(40).optional(),
    email: optionalEmailSchema.optional(),
    isActive: z.boolean().optional(),
    permissions: sellerPermissionsSchema.partial().optional(),
    warehouseIds: z.array(z.number().int().positive()).optional(),
});

export type UpdateSellerMemberInput = z.infer<typeof updateSellerMemberSchema>;

export const setSellerMemberPasswordSchema = z.object({
    password: z.string().min(4).max(200),
});

export type SetSellerMemberPasswordInput = z.infer<typeof setSellerMemberPasswordSchema>;

export const sellerMemberAuditQuerySchema = z.object({
    page: z.preprocess(
        (v) => (typeof v === "string" ? Number(v) : v),
        z.number().int().positive().default(1)
    ),
    pageSize: z.preprocess(
        (v) => (typeof v === "string" ? Number(v) : v),
        z.number().int().positive().max(200).default(20)
    ),
});

export type SellerMemberAuditQuery = z.infer<typeof sellerMemberAuditQuerySchema>;
