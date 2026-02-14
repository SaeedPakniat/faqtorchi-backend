import { prisma } from "../../prisma/client";
import type { CreateShippingMethodInput, UpdateShippingMethodInput } from "./shippingMethod.schemas";

export async function listShippingMethods(sellerId: number) {
    const methods = await prisma.shippingMethod.findMany({
        where: { sellerId },
        orderBy: [{ createdAt: "desc" }],
    });
    return { methods };
}

export async function createShippingMethod(params: { sellerId: number; input: CreateShippingMethodInput }) {
    const method = await prisma.shippingMethod.create({
        data: {
            sellerId: params.sellerId,
            name: params.input.name,
            price: BigInt(params.input.price),
            currency: params.input.currency ?? "IRT",
            isActive: params.input.isActive ?? true,
        },
    });
    return { method };
}

export async function updateShippingMethod(params: { sellerId: number; id: number; input: UpdateShippingMethodInput }) {
    const existing = await prisma.shippingMethod.findFirst({
        where: { id: params.id, sellerId: params.sellerId },
        select: { id: true },
    });
    if (!existing) throw Object.assign(new Error("Shipping method not found"), { status: 404 });

    const method = await prisma.shippingMethod.update({
        where: { id: params.id },
        data: {
            name: params.input.name,
            price: params.input.price != null ? BigInt(params.input.price) : undefined,
            currency: params.input.currency ?? undefined,
            isActive: params.input.isActive,
        },
    });
    return { method };
}

export async function deleteShippingMethod(params: { sellerId: number; id: number }) {
    const existing = await prisma.shippingMethod.findFirst({
        where: { id: params.id, sellerId: params.sellerId },
        select: { id: true },
    });
    if (!existing) throw Object.assign(new Error("Shipping method not found"), { status: 404 });

    await prisma.shippingMethod.delete({ where: { id: params.id } });
    return { ok: true };
}
