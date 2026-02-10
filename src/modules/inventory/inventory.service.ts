import { prisma } from "../../prisma/client";

export async function adjustInventory(params: {
    sellerId: number;
    warehouseId: number;
    variantId: number;
    delta: number;
    note?: string;
}) {
    if (params.delta === 0) {
        throw Object.assign(new Error("delta cannot be 0"), { status: 400 });
    }

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

        // 3) Upsert inventory row
        const existing = await tx.inventory.findUnique({
            where: {
                warehouseId_variantId: {
                    warehouseId: params.warehouseId,
                    variantId: params.variantId,
                },
            },
            select: { id: true, quantity: true },
        });

        const currentQty = existing?.quantity ?? 0;
        const nextQty = currentQty + params.delta;

        if (nextQty < 0) {
            throw Object.assign(new Error("Insufficient stock"), { status: 400 });
        }

        const inv = existing
            ? await tx.inventory.update({
                where: { id: existing.id },
                data: { quantity: nextQty },
                select: { id: true, warehouseId: true, variantId: true, quantity: true, updatedAt: true },
            })
            : await tx.inventory.create({
                data: {
                    warehouseId: params.warehouseId,
                    variantId: params.variantId,
                    quantity: nextQty,
                },
                select: { id: true, warehouseId: true, variantId: true, quantity: true, updatedAt: true },
            });

        // 4) Ledger entry
        const ledger = await tx.inventoryLedger.create({
            data: {
                inventoryId: inv.id,
                changeType: "ADJUSTMENT",
                delta: params.delta,
                note: params.note ?? null,
            },
            select: { id: true, changeType: true, delta: true, note: true, createdAt: true },
        });

        return { inventory: inv, ledger };
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
        orderBy: { id: "desc" },
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

export async function listInventoryLedger(params: { userId: number; inventoryId: number }) {
    const inventory = await prisma.inventory.findUnique({
        where: { id: params.inventoryId },
        select: {
            id: true,
            warehouse: {
                select: {
                    seller: { select: { userId: true } },
                },
            },
        },
    });

    if (!inventory) {
        throw Object.assign(new Error("Inventory not found"), { status: 404 });
    }

    if (inventory.warehouse.seller.userId !== params.userId) {
        throw Object.assign(new Error("Forbidden"), { status: 403 });
    }

    const ledger = await prisma.inventoryLedger.findMany({
        where: { inventoryId: params.inventoryId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: { id: true, changeType: true, delta: true, note: true, createdAt: true },
    });

    return { inventoryId: params.inventoryId, ledger };
}
