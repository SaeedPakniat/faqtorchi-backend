import { prisma } from "../../prisma/client";
import { hashPassword, verifyPassword } from "../common/security/password";
import { signAccessToken, signRefreshToken } from "../common/security/jwt";
import { hashRefreshToken } from "../common/security/refreshToken";
import type { CustomerLoginInput, CustomerRegisterInput, ListCustomerInvoicesInput } from "./customerPortal.schemas";

const REFRESH_TTL_SECONDS = Number(process.env.REFRESH_TOKEN_TTL_SECONDS ?? "2592000");

export async function registerCustomer(input: CustomerRegisterInput) {
    const existing = await prisma.user.findUnique({
        where: { phone: input.phone },
        select: { id: true, role: true },
    });
    if (existing) {
        throw Object.assign(new Error("User already exists"), { status: 409 });
    }

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
        data: {
            email: input.email ?? null,
            phone: input.phone,
            name: input.name ?? null,
            passwordHash,
            role: "USER",
            customerProfile: { create: {} },
        },
        select: { id: true, phone: true, email: true, name: true, role: true, createdAt: true },
    });

    return { user };
}

export async function loginCustomer(input: CustomerLoginInput, meta?: { userAgent?: string; ipAddress?: string }) {
    const user = await prisma.user.findUnique({
        where: { phone: input.phone },
        include: { customerProfile: true },
    });
    if (!user || !user.isActive || user.role !== "USER" || !user.customerProfile) {
        throw Object.assign(new Error("Invalid credentials"), { status: 401 });
    }

    const ok = await verifyPassword(user.passwordHash, input.password);
    if (!ok) throw Object.assign(new Error("Invalid credentials"), { status: 401 });

    const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);

    const session = await prisma.session.create({
        data: {
            userId: user.id,
            refreshTokenHash: "temp",
            expiresAt,
            userAgent: meta?.userAgent ?? null,
            ipAddress: meta?.ipAddress ?? null,
        },
        select: { id: true },
    });

    const refreshToken = signRefreshToken(session.id, user.id);
    await prisma.session.update({
        where: { id: session.id },
        data: { refreshTokenHash: hashRefreshToken(refreshToken) },
    });

    const accessToken = signAccessToken(user.id, user.role);

    return {
        user: { id: user.id, phone: user.phone, email: user.email, name: user.name, role: user.role },
        accessToken,
        refreshToken,
    };
}

export async function listCustomerInvoices(params: { userId: number } & ListCustomerInvoicesInput) {
    const user = await prisma.user.findUnique({
        where: { id: params.userId },
        select: { phone: true },
    });
    if (!user) throw Object.assign(new Error("User not found"), { status: 404 });

    const where = {
        OR: [{ customerPhone: user.phone }, { customer: { phone: user.phone } }],
    };

    const skip = (params.page - 1) * params.pageSize;
    const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
            where,
            orderBy: [{ issuedAt: "desc" }],
            skip,
            take: params.pageSize,
            include: {
                items: true,
                payments: { orderBy: [{ paidAt: "desc" }, { id: "desc" }] },
            },
        }),
        prisma.invoice.count({ where }),
    ]);

    return { page: params.page, pageSize: params.pageSize, total, invoices };
}

export async function getCustomerInvoiceById(params: { userId: number; invoiceId: number }) {
    const user = await prisma.user.findUnique({
        where: { id: params.userId },
        select: { phone: true },
    });
    if (!user) throw Object.assign(new Error("User not found"), { status: 404 });

    const invoice = await prisma.invoice.findFirst({
        where: {
            id: params.invoiceId,
            OR: [{ customerPhone: user.phone }, { customer: { phone: user.phone } }],
        },
        include: {
            items: true,
            payments: { orderBy: [{ paidAt: "desc" }, { id: "desc" }] },
        },
    });

    if (!invoice) throw Object.assign(new Error("Invoice not found"), { status: 404 });
    return { invoice };
}
