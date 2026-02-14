import { prisma } from "../../prisma/client";
import type { CreateCustomerInput, ListCustomersInput } from "./customer.schemas";

type BalanceRow = {
    currency: "IRR" | "IRT" | "USD" | "EUR";
    total: bigint;
    paid: bigint;
    due: bigint;
};

async function computeBalancesByCustomer(params: { sellerId: number; customerIds: number[] }) {
    if (!params.customerIds.length) return new Map<number, BalanceRow[]>();

    const invoices = await prisma.invoice.findMany({
        where: {
            sellerId: params.sellerId,
            customerId: { in: params.customerIds },
            status: { not: "CANCELED" },
        },
        select: { id: true, customerId: true, currency: true, total: true },
    });

    if (!invoices.length) return new Map<number, BalanceRow[]>();

    const invoiceIds = invoices.map((i) => i.id);
    const payments = await prisma.payment.findMany({
        where: {
            invoiceId: { in: invoiceIds },
            status: { not: "VOIDED" },
        },
        select: { invoiceId: true, amountInvoiceCurrency: true },
    });

    const paidByInvoice = new Map<number, bigint>();
    for (const p of payments) {
        const prev = paidByInvoice.get(p.invoiceId) ?? 0n;
        paidByInvoice.set(p.invoiceId, prev + p.amountInvoiceCurrency);
    }

    const byCustomer = new Map<number, Map<string, { total: bigint; paid: bigint }>>();
    for (const inv of invoices) {
        const paid = paidByInvoice.get(inv.id) ?? 0n;
        const currency = inv.currency as string;
        const curMap = byCustomer.get(inv.customerId!) ?? new Map();
        const prev = curMap.get(currency) ?? { total: 0n, paid: 0n };
        curMap.set(currency, { total: prev.total + inv.total, paid: prev.paid + paid });
        byCustomer.set(inv.customerId!, curMap);
    }

    const result = new Map<number, BalanceRow[]>();
    for (const [customerId, curMap] of byCustomer) {
        const rows: BalanceRow[] = [];
        for (const [currency, totals] of curMap) {
            const due = totals.total - totals.paid;
            rows.push({
                currency: currency as BalanceRow["currency"],
                total: totals.total,
                paid: totals.paid,
                due: due < 0n ? 0n : due,
            });
        }
        result.set(customerId, rows);
    }
    return result;
}

export async function createCustomer(params: { sellerId: number } & CreateCustomerInput) {
    const customer = await prisma.sellerCustomer.create({
        data: {
            sellerId: params.sellerId,
            phone: params.phone,
            name: params.name ?? null,
            notes: params.notes ?? null,
        },
    });

    return { customer };
}

export async function listCustomers(params: { sellerId: number } & ListCustomersInput) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = { sellerId: params.sellerId };
    if (params.q) {
        where.OR = [
            { phone: { contains: params.q } },
            { name: { contains: params.q } },
        ];
    }

    const [customers, total] = await Promise.all([
        prisma.sellerCustomer.findMany({
            where,
            orderBy: [{ createdAt: "desc" }],
            skip,
            take: pageSize,
        }),
        prisma.sellerCustomer.count({ where }),
    ]);

    const balances = await computeBalancesByCustomer({
        sellerId: params.sellerId,
        customerIds: customers.map((c) => c.id),
    });

    const enriched = customers.map((c) => ({
        ...c,
        balances: balances.get(c.id) ?? [],
    }));

    return { page, pageSize, total, customers: enriched };
}

export async function getCustomerById(params: { sellerId: number; customerId: number }) {
    const customer = await prisma.sellerCustomer.findFirst({
        where: { id: params.customerId, sellerId: params.sellerId },
    });

    if (!customer) throw Object.assign(new Error("Customer not found"), { status: 404 });

    const balances = await computeBalancesByCustomer({
        sellerId: params.sellerId,
        customerIds: [customer.id],
    });

    return { customer: { ...customer, balances: balances.get(customer.id) ?? [] } };
}
