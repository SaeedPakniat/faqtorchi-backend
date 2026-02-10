import crypto from "crypto";
import { prisma } from "../../prisma/client";
import type { CreateDiscountCodeInput, ListDiscountCodesInput, UpdateDiscountCodeInput } from "./discountCode.schemas";

function generateCode() {
    return crypto.randomBytes(6).toString("base64url").toUpperCase();
}

export async function createDiscountCode(params: { sellerId: number; input: CreateDiscountCodeInput }) {
    const { input } = params;
    const code = (input.code ?? generateCode()).trim().toUpperCase();

    if (input.startsAt && input.endsAt) {
        if (new Date(input.endsAt) <= new Date(input.startsAt)) {
            throw Object.assign(new Error("Invalid discount dates"), { status: 400 });
        }
    }

    if (input.variantId) {
        const variant = await prisma.productVariant.findFirst({
            where: { id: input.variantId, product: { sellerId: params.sellerId } },
            select: { id: true },
        });
        if (!variant) throw Object.assign(new Error("Variant not found"), { status: 404 });
    }

    if (input.type === "PERCENT" && (input.value <= 0n || input.value > 100n)) {
        throw Object.assign(new Error("Percent must be between 1 and 100"), { status: 400 });
    }

    const discount = await prisma.discountCode.create({
        data: {
            sellerId: params.sellerId,
            code,
            type: input.type,
            value: input.value,
            variantId: input.variantId ?? null,
            maxUses: input.maxUses ?? null,
            startsAt: input.startsAt ? new Date(input.startsAt) : null,
            endsAt: input.endsAt ? new Date(input.endsAt) : null,
            isActive: input.isActive ?? true,
        },
    });

    return { discount };
}

export async function listDiscountCodes(params: { sellerId: number; input: ListDiscountCodesInput }) {
    const where = {
        sellerId: params.sellerId,
        ...(params.input.active === undefined ? {} : { isActive: params.input.active }),
    };

    const discounts = await prisma.discountCode.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
    });

    return { discounts };
}

export async function updateDiscountCode(params: {
    sellerId: number;
    id: number;
    input: UpdateDiscountCodeInput;
}) {
    const discount = await prisma.discountCode.findFirst({
        where: { id: params.id, sellerId: params.sellerId },
        select: { id: true },
    });
    if (!discount) throw Object.assign(new Error("Discount code not found"), { status: 404 });

    const updated = await prisma.discountCode.update({
        where: { id: params.id },
        data: {
            isActive: params.input.isActive ?? undefined,
            maxUses: params.input.maxUses ?? undefined,
            endsAt: params.input.endsAt ? new Date(params.input.endsAt) : undefined,
        },
    });

    return { discount: updated };
}
