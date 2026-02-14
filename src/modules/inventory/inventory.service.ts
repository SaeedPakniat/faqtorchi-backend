import { prisma } from "../../prisma/client";
import { assertWarehouseAccess } from "../sellerMember/sellerMember.service";

export async function adjustInventory(params: {
    sellerId: number;
    warehouseId: number;
    variantId: number;
    delta: number;
    note?: string;
}) {
    return prisma.$transaction(async (tx) => {
        // 1) Warehouse must belong to seller
        const warehouse = await tx.warehouse.findFirst({
            where: { id: params.warehouseId, sellerId: params.sellerId },
            select: { id: true },
        });
        if (!warehouse) {
            throw Object.assign(new Error("Warehouse not found"), { status: 404 });
        }

        // 2) Variant must belong to seller (via product -> sellerId)
        const variant = await tx.productVariant.findFirst({
            where: {
                id: params.variantId,
                product: { sellerId: params.sellerId },
            },
            select: { id: true },
        });
        if (!variant) {
            throw Object.assign(new Error("Variant not found"), { status: 404 });
        }

        // 3) Upsert inventory
        const inventory = await tx.inventory.upsert({
            where: {
                warehouseId_variantId: {
                    warehouseId: params.warehouseId,
                    variantId: params.variantId,
                },
            },
            update: {
                quantity: { increment: params.delta },
            },
            create: {
                warehouseId: params.warehouseId,
                variantId: params.variantId,
                quantity: params.delta,
            },
            select: { id: true, warehouseId: true, variantId: true, quantity: true, updatedAt: true },
        });

        // 4) Ledger
        await tx.inventoryLedger.create({
            data: {
                inventoryId: inventory.id,
                changeType: "ADJUSTMENT",
                delta: params.delta,
                note: params.note,
            },
        });

        return { inventory };
    });
}

export async function listInventory(params: { sellerId: number; warehouseId: number }) {
    const warehouse = await prisma.warehouse.findFirst({
        where: { id: params.warehouseId, sellerId: params.sellerId },
        select: { id: true },
    });

    if (!warehouse) {
        throw Object.assign(new Error("Warehouse not found"), { status: 404 });
    }

    const inventory = await prisma.inventory.findMany({
        where: { warehouseId: params.warehouseId },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        select: {
            id: true,
            warehouseId: true,
            variantId: true,
            quantity: true,
            updatedAt: true,
            variant: {
                select: {
                    id: true,
                    sku: true,
                    price: true,
                    attributes: true,
                    product: { select: { id: true, name: true } },
                },
            },
        },
    });

    return { inventory };
}

export async function listInventoryLedger(params: { sellerId: number; userId: number; inventoryId: number }) {
    const inventory = await prisma.inventory.findUnique({
        where: { id: params.inventoryId },
        select: {
            id: true,
            warehouseId: true,
            warehouse: {
                select: {
                    sellerId: true,
                },
            },
        },
    });

    if (!inventory) {
        throw Object.assign(new Error("Inventory not found"), { status: 404 });
    }

    if (inventory.warehouse.sellerId !== params.sellerId) {
        throw Object.assign(new Error("Forbidden"), { status: 403 });
    }

    await assertWarehouseAccess(params.userId, inventory.warehouseId);

    const ledger = await prisma.inventoryLedger.findMany({
        where: { inventoryId: params.inventoryId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: { id: true, changeType: true, delta: true, note: true, createdAt: true },
    });

    return { inventoryId: params.inventoryId, ledger };
}
