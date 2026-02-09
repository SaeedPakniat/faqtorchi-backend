import { prisma } from "../../prisma/client";

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
    price: number;
    attributes?: Record<string, any>;
}) {
    // ensure product belongs to seller
    const product = await prisma.product.findFirst({
        where: { id: params.productId, sellerId: params.sellerId },
        select: { id: true },
    });
    if (!product) {
        throw Object.assign(new Error("Product not found"), { status: 404 });
    }

    return prisma.productVariant.create({
        data: {
            productId: params.productId,
            sku: params.sku,
            price: params.price,
            attributes: params.attributes ?? undefined, // Prisma accepts undefined for optional Json
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
}
