import { prisma } from "../../prisma/client";
import type { Prisma } from "@prisma/client";
import type { CreateInstantInvoiceInput, CreateWarehouseInvoiceInput, ListInvoicesInput } from "./invoice.schemas";
import { toBigInt } from "../../utils/bigint";

async function assertCustomerOwnership(tx: Prisma.TransactionClient, sellerId: number, customerId: number) {
    const customer = await tx.sellerCustomer.findFirst({
        where: { id: customerId, sellerId },
        select: { id: true },
    });
    if (!customer) throw Object.assign(new Error("Customer not found"), { status: 404 });
}

export async function createWarehouseInvoice(params: {
    sellerId: number;
    warehouseId: number;
    createdByUserId: number;
} & CreateWarehouseInvoiceInput) {
    return prisma.$transaction(async (tx) => {
        if (params.customerId) {
            await assertCustomerOwnership(tx, params.sellerId, params.customerId);
        }

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

export async function createInstantInvoice(params: {
    sellerId: number;
    createdByUserId: number;
} & CreateInstantInvoiceInput) {
    return prisma.$transaction(async (tx) => {
        if (params.customerId) {
            await assertCustomerOwnership(tx, params.sellerId, params.customerId);
        }

        const itemsPrepared = params.items.map((i) => {
            const unitPrice = toBigInt(i.unitPrice);
            const lineTotal = unitPrice * BigInt(i.quantity);
            return {
                variantId: null,
                quantity: i.quantity,
                unitPrice,
                lineTotal,
                description: i.description,
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

        const invoice = await tx.invoice.create({
            data: {
                sellerId: params.sellerId,
                createdByUserId: params.createdByUserId,
                type: "INSTANT",
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

        return { invoice };
    });
}

export async function getInvoiceById(params: { sellerId: number; invoiceId: number }) {
    const invoice = await prisma.invoice.findFirst({
        where: { id: params.invoiceId, sellerId: params.sellerId },
        include: {
            items: {
                include: {
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
            },
            payments: {
                orderBy: [{ paidAt: "desc" }, { id: "desc" }],
            },
            warehouse: { select: { id: true, name: true, location: true } },
        },
    });

    if (!invoice) throw Object.assign(new Error("Invoice not found"), { status: 404 });

    return { invoice };
}

export async function listInvoices(params: { sellerId: number } & ListInvoicesInput) {
    const where: Record<string, unknown> = { sellerId: params.sellerId };

    if (params.status) where.status = params.status;
    if (params.type) where.type = params.type;

    if (params.from || params.to) {
        where.issuedAt = {
            ...(params.from ? { gte: new Date(params.from) } : {}),
            ...(params.to ? { lte: new Date(params.to) } : {}),
        };
    }

    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
            where,
            orderBy: [{ issuedAt: "desc" }],
            skip,
            take: pageSize,
        }),
        prisma.invoice.count({ where }),
    ]);

    return {
        page,
        pageSize,
        total,
        invoices,
    };
}

export async function cancelInvoice(params: { sellerId: number; invoiceId: number }) {
    return prisma.$transaction(async (tx) => {
        const invoice = await tx.invoice.findUnique({
            where: { id: params.invoiceId },
            include: { items: true },
        });

        if (!invoice) throw Object.assign(new Error("Invoice not found"), { status: 404 });
        if (invoice.sellerId !== params.sellerId) {
            throw Object.assign(new Error("Forbidden"), { status: 403 });
        }
        if (invoice.status === "CANCELED") return { invoice };

        const recordedPayments = await tx.payment.count({
            where: { invoiceId: invoice.id, status: "RECORDED" },
        });
        if (recordedPayments > 0) {
            throw Object.assign(new Error("Cannot cancel invoice with recorded payments"), { status: 400 });
        }

        if (invoice.type === "WAREHOUSE") {
            if (!invoice.warehouseId) throw Object.assign(new Error("Warehouse not found"), { status: 404 });

            for (const item of invoice.items) {
                if (!item.variantId) continue;

                const inv = await tx.inventory.findUnique({
                    where: {
                        warehouseId_variantId: {
                            warehouseId: invoice.warehouseId,
                            variantId: item.variantId,
                        },
                    },
                    select: { id: true, quantity: true },
                });

                if (!inv) throw Object.assign(new Error("Inventory not found"), { status: 404 });

                await tx.inventory.update({
                    where: { id: inv.id },
                    data: { quantity: inv.quantity + item.quantity },
                    select: { id: true },
                });

                await tx.inventoryLedger.create({
                    data: {
                        inventoryId: inv.id,
                        changeType: "INVOICE",
                        delta: item.quantity,
                        note: `cancel:invoice:${invoice.id}`,
                    },
                    select: { id: true },
                });
            }
        }

        const updated = await tx.invoice.update({
            where: { id: invoice.id },
            data: { status: "CANCELED" },
            include: { items: true },
        });

        return { invoice: updated };
    });
}
