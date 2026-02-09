import { prisma } from "../../prisma/client";
import type { CreateWarehouseInvoiceInput } from "./invoice.schemas";
import { toBigInt } from "../../utils/bigint";

export async function createWarehouseInvoice(params: {
    sellerId: number;
    warehouseId: number;
    createdByUserId: number;
} & CreateWarehouseInvoiceInput) {
    return prisma.$transaction(async (tx) => {
        // 1) warehouse must belong to seller
        const warehouse = await tx.warehouse.findFirst({
            where: { id: params.warehouseId, sellerId: params.sellerId },
            select: { id: true },
        });
        if (!warehouse) throw Object.assign(new Error("Warehouse not found"), { status: 404 });

        // 2) fetch variants + ensure ownership (variant -> product -> seller)
        const variantIds = [...new Set(params.items.map((i) => i.variantId))];

        const variants = await tx.productVariant.findMany({
            where: { id: { in: variantIds }, product: { sellerId: params.sellerId } },
            select: { id: true, price: true },
        });

        if (variants.length !== variantIds.length) {
            throw Object.assign(new Error("Variant not found"), { status: 404 });
        }

        const priceByVariant = new Map<number, bigint>(variants.map((v) => [v.id, v.price]));

        // 3) build invoice items (unitPrice from variant.price)
        const itemsPrepared = params.items.map((i) => {
            const unitPrice = priceByVariant.get(i.variantId);
            if (unitPrice == null) throw Object.assign(new Error("Variant not found"), { status: 404 });

            const lineTotal = unitPrice * BigInt(i.quantity);
            return {
                variantId: i.variantId,
                quantity: i.quantity,
                unitPrice,
                lineTotal,
                description: i.description ?? null,
            };
        });

        const subtotal = itemsPrepared.reduce((sum, it) => sum + it.lineTotal, 0n);
        const discount = toBigInt(params.discount);
        const tax = toBigInt(params.tax);

        if (discount > subtotal) {
            throw Object.assign(new Error("Discount cannot exceed subtotal"), { status: 400 });
        }

        const total = subtotal - discount + tax;
        if (total < 0n) {
            throw Object.assign(new Error("Total cannot be negative"), { status: 400 });
        }

        // 4) create invoice + items
        const invoice = await tx.invoice.create({
            data: {
                sellerId: params.sellerId,
                createdByUserId: params.createdByUserId,
                type: "WAREHOUSE",
                status: "ISSUED",

                customerId: params.customerId ?? null,
                customerName: params.customerName ?? null,
                customerPhone: params.customerPhone ?? null,

                currency: params.currency,
                subtotal,
                discount,
                tax,
                total,

                items: { create: itemsPrepared },
            },
            select: {
                id: true,
                type: true,
                status: true,
                currency: true,
                subtotal: true,
                discount: true,
                tax: true,
                total: true,
                issuedAt: true,
                items: {
                    select: { id: true, variantId: true, quantity: true, unitPrice: true, lineTotal: true, description: true },
                },
            },
        });

        // 5) deduct inventory + ledger (fail atomically if insufficient)
        for (const it of itemsPrepared) {
            const inv = await tx.inventory.findUnique({
                where: {
                    warehouseId_variantId: {
                        warehouseId: params.warehouseId,
                        variantId: it.variantId!,
                    },
                },
                select: { id: true, quantity: true },
            });

            if (!inv || inv.quantity < it.quantity) {
                throw Object.assign(new Error("Insufficient stock"), { status: 400 });
            }

            await tx.inventory.update({
                where: { id: inv.id },
                data: { quantity: inv.quantity - it.quantity },
                select: { id: true },
            });

            await tx.inventoryLedger.create({
                data: {
                    inventoryId: inv.id,
                    changeType: "INVOICE",
                    delta: -it.quantity,
                    note: `invoice:${invoice.id}`,
                },
                select: { id: true },
            });
        }

        return { invoice };
    });
}
