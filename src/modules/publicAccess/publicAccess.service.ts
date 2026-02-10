import crypto from "crypto";
import { prisma } from "../../prisma/client";
import { sendSms } from "../common/notification";

const TOKEN_TTL_MINUTES = Number(process.env.PUBLIC_INVOICE_TOKEN_TTL_MINUTES ?? "10");

function hashToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

export async function requestPublicInvoiceToken(phone: string) {
    const token = crypto.randomBytes(24).toString("base64url");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000);

    await prisma.customerAccessToken.deleteMany({ where: { phone } });
    await prisma.customerAccessToken.create({
        data: { phone, tokenHash, expiresAt },
    });

    await sendSms(phone, `Your invoice access token: ${token}`);

    return { token };
}

export async function listPublicInvoices(params: { phone: string; token: string }) {
    const tokenHash = hashToken(params.token);
    const token = await prisma.customerAccessToken.findFirst({
        where: { phone: params.phone, tokenHash, expiresAt: { gt: new Date() } },
        select: { id: true },
    });

    if (!token) throw Object.assign(new Error("Invalid or expired token"), { status: 401 });

    await prisma.customerAccessToken.deleteMany({ where: { phone: params.phone } });

    const invoices = await prisma.invoice.findMany({
        where: {
            OR: [{ customerPhone: params.phone }, { customer: { phone: params.phone } }],
        },
        orderBy: [{ issuedAt: "desc" }],
        select: {
            id: true,
            status: true,
            currency: true,
            subtotal: true,
            discount: true,
            tax: true,
            total: true,
            issuedAt: true,
            pdfToken: true,
        },
    });

    return {
        invoices: invoices.map((i) => ({
            ...i,
            pdfUrlPublic: i.pdfToken ? `/api/v1/public/invoices/${i.pdfToken}/pdf` : null,
        })),
    };
}
