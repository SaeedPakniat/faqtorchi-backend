import { prisma } from "../../prisma/client";
import type { DiscountsReportQuery, LowStockQuery, SalesReportQuery, TopProductsQuery } from "./report.schemas";

export async function getSalesReport(params: { sellerId: number } & SalesReportQuery) {
    const whereInvoice: any = { sellerId: params.sellerId };
    if (params.from || params.to) {
        whereInvoice.issuedAt = {};
        if (params.from) whereInvoice.issuedAt.gte = new Date(params.from);
        if (params.to) whereInvoice.issuedAt.lte = new Date(params.to);
    }

    const invoices = await prisma.invoice.findMany({
        where: whereInvoice,
        select: { id: true, currency: true, total: true },
    });

    const totalsByCurrency = new Map<string, bigint>();
    const countByCurrency = new Map<string, number>();
    for (const inv of invoices) {
        totalsByCurrency.set(inv.currency, (totalsByCurrency.get(inv.currency) ?? 0n) + inv.total);
        countByCurrency.set(inv.currency, (countByCurrency.get(inv.currency) ?? 0) + 1);
    }

    const invoiceIdToCurrency = new Map(invoices.map((i) => [i.id, i.currency]));
    const payments = await prisma.payment.findMany({
        where: { invoiceId: { in: invoices.map((i) => i.id) }, status: "RECORDED" },
        select: { invoiceId: true, amount: true },
    });

    const paidByCurrency = new Map<string, bigint>();
    for (const p of payments) {
        const currency = invoiceIdToCurrency.get(p.invoiceId);
        if (!currency) continue;
        paidByCurrency.set(currency, (paidByCurrency.get(currency) ?? 0n) + p.amount);
    }

    const outstandingByCurrency = new Map<string, bigint>();
    for (const [currency, total] of totalsByCurrency.entries()) {
        const paid = paidByCurrency.get(currency) ?? 0n;
        outstandingByCurrency.set(currency, total - paid);
    }

    return {
        count: invoices.length,
        totalsByCurrency: Array.from(totalsByCurrency.entries()).map(([currency, total]) => ({
            currency,
            total,
            count: countByCurrency.get(currency) ?? 0,
        })),
        paidByCurrency: Array.from(paidByCurrency.entries()).map(([currency, total]) => ({
            currency,
            total,
        })),
        outstandingByCurrency: Array.from(outstandingByCurrency.entries()).map(([currency, total]) => ({
            currency,
            total,
        })),
    };
}

export async function getAccountsReceivable(params: { sellerId: number }) {
    const invoices = await prisma.invoice.findMany({
        where: { sellerId: params.sellerId, status: { not: "PAID" } },
        include: {
            payments: { where: { status: "RECORDED" }, select: { amount: true } },
        },
        orderBy: { issuedAt: "desc" },
    });

    const results = invoices.map((inv) => {
        const paid = inv.payments.reduce((sum, p) => sum + p.amount, 0n);
        return {
            invoice: inv,
            remaining: inv.total - paid,
        };
    });

    return { invoices: results };
}

export async function getTopProducts(params: { sellerId: number } & TopProductsQuery) {
    const grouped = await prisma.invoiceItem.groupBy({
        by: ["variantId"],
        where: {
            variantId: { not: null },
            invoice: { sellerId: params.sellerId, type: "WAREHOUSE" },
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: params.limit,
    });

    const variantIds = grouped.map((g) => g.variantId!).filter(Boolean);
    const variants = await prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: {
            id: true,
            sku: true,
            product: { select: { id: true, name: true } },
        },
    });
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    const items = grouped.map((g) => {
        const variant = variantMap.get(g.variantId!);
        return {
            productId: variant?.product.id ?? null,
            productName: variant?.product.name ?? null,
            variantId: g.variantId,
            sku: variant?.sku ?? null,
            qty: g._sum.quantity ?? 0,
        };
    });

    return { items };
}

export async function getLowStock(params: { sellerId: number } & LowStockQuery) {
    const where: any = {
        quantity: { lt: params.threshold },
        warehouse: { sellerId: params.sellerId },
    };
    if (params.warehouseId) {
        where.warehouseId = params.warehouseId;
    }

    const inventory = await prisma.inventory.findMany({
        where,
        include: {
            variant: {
                select: { id: true, sku: true, price: true, attributes: true, product: { select: { id: true, name: true } } },
            },
            warehouse: { select: { id: true, name: true } },
        },
        orderBy: [{ quantity: "asc" }, { id: "asc" }],
    });

    return { inventory };
}

export async function getDiscountsReport(params: { sellerId: number } & DiscountsReportQuery) {
    const whereInvoice: any = { sellerId: params.sellerId, discount: { gt: 0 } };
    if (params.from || params.to) {
        whereInvoice.issuedAt = {};
        if (params.from) whereInvoice.issuedAt.gte = new Date(params.from);
        if (params.to) whereInvoice.issuedAt.lte = new Date(params.to);
    }

    const invoices = await prisma.invoice.findMany({
        where: whereInvoice,
        select: { currency: true, discount: true, id: true },
    });

    const totalByCurrency = new Map<string, bigint>();
    const countByCurrency = new Map<string, number>();
    for (const inv of invoices) {
        totalByCurrency.set(inv.currency, (totalByCurrency.get(inv.currency) ?? 0n) + inv.discount);
        countByCurrency.set(inv.currency, (countByCurrency.get(inv.currency) ?? 0) + 1);
    }

    return {
        count: invoices.length,
        discountsByCurrency: Array.from(totalByCurrency.entries()).map(([currency, total]) => ({
            currency,
            total,
            count: countByCurrency.get(currency) ?? 0,
        })),
    };
}
