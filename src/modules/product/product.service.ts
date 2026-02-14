import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { toBigInt } from "../../utils/bigint";

export async function createProduct(params: {
    sellerId: number;
    name: string;
    description?: string;
}) {
    return prisma.product.create({
        data: {
            sellerId: params.sellerId,
            name: params.name,
            description: params.description ?? null,
        },
        select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
        },
    });
}

export async function listProducts(sellerId: number) {
    return prisma.product.findMany({
        where: { sellerId },
        orderBy: { id: "desc" },
        select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            variants: {
                select: { id: true, sku: true, price: true, attributes: true, createdAt: true },
            },
        },
    });
}

export async function createVariant(params: {
    sellerId: number;
    productId: number;
    sku: string;
    price: number | string | bigint;
    attributes?: Record<string, any>;
}) {
    const product = await prisma.product.findFirst({
        where: { id: params.productId, sellerId: params.sellerId },
        select: { id: true },
    });
    if (!product) {
        throw Object.assign(new Error("Product not found"), { status: 404 });
    }

    try {
        return prisma.productVariant.create({
            data: {
                productId: params.productId,
                sku: params.sku,
                price: toBigInt(params.price),
                attributes: params.attributes ?? undefined,
            },
            select: {
                id: true,
                productId: true,
                sku: true,
                price: true,
                attributes: true,
                createdAt: true,
            },
        });
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            throw Object.assign(new Error("SKU already exists for this product"), { status: 409 });
        }
        throw e;
    }
}

export async function updateProduct(params: {
    sellerId: number;
    productId: number;
    name?: string;
    description?: string | null;
}) {
    const product = await prisma.product.findFirst({
        where: { id: params.productId, sellerId: params.sellerId },
        select: { id: true },
    });
    if (!product) {
        throw Object.assign(new Error("Product not found"), { status: 404 });
    }

    return prisma.product.update({
        where: { id: params.productId },
        data: {
            ...(params.name !== undefined ? { name: params.name } : {}),
            ...(params.description !== undefined ? { description: params.description } : {}),
        },
        select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
        },
    });
}

export async function deleteProduct(params: { sellerId: number; productId: number }) {
    const product = await prisma.product.findFirst({
        where: { id: params.productId, sellerId: params.sellerId },
        select: { id: true },
    });
    if (!product) {
        throw Object.assign(new Error("Product not found"), { status: 404 });
    }

    await prisma.product.delete({ where: { id: params.productId } });
    return { ok: true } as const;
}

export async function updateVariant(params: {
    sellerId: number;
    productId: number;
    variantId: number;
    sku?: string;
    price?: number | string | bigint;
    attributes?: Record<string, any> | null;
}) {
    const variant = await prisma.productVariant.findFirst({
        where: {
            id: params.variantId,
            productId: params.productId,
            product: { sellerId: params.sellerId },
        },
        select: { id: true },
    });
    if (!variant) {
        throw Object.assign(new Error("Variant not found"), { status: 404 });
    }

    try {
        const attributesUpdate =
            params.attributes === undefined
                ? undefined
                : params.attributes === null
                  ? Prisma.JsonNull
                  : params.attributes;

        return await prisma.productVariant.update({
            where: { id: params.variantId },
            data: {
                ...(params.sku !== undefined ? { sku: params.sku } : {}),
                ...(params.price !== undefined ? { price: toBigInt(params.price) } : {}),
                ...(attributesUpdate !== undefined ? { attributes: attributesUpdate } : {}),
            },
            select: {
                id: true,
                productId: true,
                sku: true,
                price: true,
                attributes: true,
                createdAt: true,
            },
        });
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            throw Object.assign(new Error("SKU already exists for this product"), { status: 409 });
        }
        throw e;
    }
}

export async function deleteVariant(params: {
    sellerId: number;
    productId: number;
    variantId: number;
}) {
    const variant = await prisma.productVariant.findFirst({
        where: {
            id: params.variantId,
            productId: params.productId,
            product: { sellerId: params.sellerId },
        },
        select: { id: true },
    });
    if (!variant) {
        throw Object.assign(new Error("Variant not found"), { status: 404 });
    }

    await prisma.productVariant.delete({ where: { id: params.variantId } });
    return { ok: true } as const;
}
