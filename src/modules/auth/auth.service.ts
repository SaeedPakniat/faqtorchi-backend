import { prisma } from "../../prisma/client";
import {hashPassword} from "../common/security/password";
import type { RegisterInput } from "./auth.schemas";

export async function registerUser(input: RegisterInput){
    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
        data: {
            email: input.email ?? null,
            phone: input.phone,
            name: input.name ?? null,
            passwordHash,
        },
        select: {
            id: true,
            email: true,
            phone: true,
            name: true,
            role: true,
            createdAt: true,
        },
    });
    return user;
}