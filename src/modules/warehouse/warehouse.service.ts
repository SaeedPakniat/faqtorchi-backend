import { prisma } from "../../prisma/client";

export async function createWarehouse(params: {
    sellerId: number;
    name: string;
    location?: string;
}) {
    return prisma.warehouse.create({
        data: {
            sellerId: params.sellerId,
            name: params.name,
            location: params.location ?? null,
        },
        select: { id: true, name: true, location: true, createdAt: true },
    });
}

export async function listWarehouses(sellerId: number) {
    return prisma.warehouse.findMany({
        where: { sellerId },
        orderBy: { id: "desc" },
        select: { id: true, name: true, location: true, createdAt: true },
    });
}
