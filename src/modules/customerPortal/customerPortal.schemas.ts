import { z } from "zod";

export const customerRegisterSchema = z.object({
    email: z.string().email().optional(),
    phone: z.string().min(11).max(15),
    name: z.string().min(2).max(50).optional(),
    password: z.string().min(8).max(128),
});

export const customerLoginSchema = z.object({
    phone: z.string().min(11).max(15),
    password: z.string().min(8).max(128),
});

export const listCustomerInvoicesSchema = z.object({
    page: z.preprocess(
        (v) => (typeof v === "string" ? Number(v) : v),
        z.number().int().positive().default(1)
    ),
    pageSize: z.preprocess(
        (v) => (typeof v === "string" ? Number(v) : v),
        z.number().int().positive().max(100).default(20)
    ),
});

export const customerInvoiceIdParamSchema = z.object({
    id: z.preprocess(
        (v) => (typeof v === "string" ? Number(v) : v),
        z.number().int().positive()
    ),
});

export type CustomerRegisterInput = z.infer<typeof customerRegisterSchema>;
export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;
export type ListCustomerInvoicesInput = z.infer<typeof listCustomerInvoicesSchema>;
