import { prisma } from "../../prisma/client";
import type { CreateCustomerInput, ListCustomersInput } from "./customer.schemas";

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

    return { page, pageSize, total, customers };
}

export async function getCustomerById(params: { sellerId: number; customerId: number }) {
    const customer = await prisma.sellerCustomer.findFirst({
        where: { id: params.customerId, sellerId: params.sellerId },
    });

    if (!customer) throw Object.assign(new Error("Customer not found"), { status: 404 });

    return { customer };
}
