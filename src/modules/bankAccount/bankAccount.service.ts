import { prisma } from "../../prisma/client";
import type { CreateBankAccountInput, UpdateBankAccountInput } from "./bankAccount.schemas";

export async function listBankAccounts(sellerId: number) {
    const accounts = await prisma.bankAccount.findMany({
        where: { sellerId },
        orderBy: [{ createdAt: "desc" }],
    });
    return { accounts };
}

export async function createBankAccount(params: { sellerId: number; input: CreateBankAccountInput }) {
    const account = await prisma.bankAccount.create({
        data: {
            sellerId: params.sellerId,
            name: params.input.name,
            accountNumber: params.input.accountNumber,
            isActive: params.input.isActive ?? true,
        },
    });
    return { account };
}

export async function updateBankAccount(params: { sellerId: number; id: number; input: UpdateBankAccountInput }) {
    const existing = await prisma.bankAccount.findFirst({
        where: { id: params.id, sellerId: params.sellerId },
        select: { id: true },
    });
    if (!existing) throw Object.assign(new Error("Bank account not found"), { status: 404 });

    const account = await prisma.bankAccount.update({
        where: { id: params.id },
        data: {
            name: params.input.name,
            accountNumber: params.input.accountNumber,
            isActive: params.input.isActive,
        },
    });
    return { account };
}

export async function deleteBankAccount(params: { sellerId: number; id: number }) {
    const existing = await prisma.bankAccount.findFirst({
        where: { id: params.id, sellerId: params.sellerId },
        select: { id: true },
    });
    if (!existing) throw Object.assign(new Error("Bank account not found"), { status: 404 });

    await prisma.bankAccount.delete({ where: { id: params.id } });
    return { ok: true };
}
