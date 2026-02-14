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

export async function updateWarehouse(params: {
    sellerId: number;
    warehouseId: number;
    name?: string;
    location?: string | null;
}) {
    return prisma.warehouse.update({
        where: { id: params.warehouseId, sellerId: params.sellerId },
        data: {
            name: params.name,
            location: params.location,
        },
        select: { id: true, name: true, location: true, createdAt: true },
    });
}

export async function deleteWarehouse(params: { sellerId: number; warehouseId: number }) {
    await prisma.warehouse.delete({
        where: { id: params.warehouseId, sellerId: params.sellerId },
    });
    return { ok: true } as const;
}
