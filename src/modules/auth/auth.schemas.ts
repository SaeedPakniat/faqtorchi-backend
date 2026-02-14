import { z } from "zod";

export const RegisterSchema = z.object({
    email: z.string().email({message: "Invalid email address"}).optional(),
    phone: z.string().min(11).max(15),
    name: z.string().min(8).max(15).optional(),
    password: z.string().min(8).max(128),
    role: z.enum(["USER", "SELLER"]).optional(),
}).refine((data) => data.email || data.phone,{
    message: "Either email or phone must be provided",
    path: ["email"],
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

