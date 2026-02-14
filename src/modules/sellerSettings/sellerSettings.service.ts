import { prisma } from "../../prisma/client";

export const VALID_INVOICE_TEMPLATES = ["default", "green-v1", "blue-min", "slate-modern", "sunrise-classic", "mono-grid"] as const;
export type InvoiceTemplateId = (typeof VALID_INVOICE_TEMPLATES)[number];

export async function getInvoiceTemplate(params: { sellerId: number }) {
    const seller = await prisma.sellerProfile.findUnique({
        where: { id: params.sellerId },
        select: { invoiceTemplateId: true },
    });
    if (!seller) throw Object.assign(new Error("Seller not found"), { status: 404 });
    return { templateId: seller.invoiceTemplateId as InvoiceTemplateId };
}

export async function setInvoiceTemplate(params: { sellerId: number; templateId: InvoiceTemplateId }) {
    if (!VALID_INVOICE_TEMPLATES.includes(params.templateId)) {
        throw Object.assign(new Error("Invalid template"), { status: 400 });
    }
    const seller = await prisma.sellerProfile.update({
        where: { id: params.sellerId },
        data: { invoiceTemplateId: params.templateId },
        select: { invoiceTemplateId: true },
    });
    return { templateId: seller.invoiceTemplateId as InvoiceTemplateId };
}

export async function getCurrencySettings(params: { sellerId: number }) {
    const seller = await prisma.sellerProfile.findUnique({
        where: { id: params.sellerId },
        select: { baseCurrency: true },
    });
    if (!seller) throw Object.assign(new Error("Seller not found"), { status: 404 });
    return { baseCurrency: seller.baseCurrency };
}

export async function setCurrencySettings(params: { sellerId: number; baseCurrency: "IRR" | "IRT" | "USD" | "EUR" }) {
    const seller = await prisma.sellerProfile.update({
        where: { id: params.sellerId },
        data: { baseCurrency: params.baseCurrency },
        select: { baseCurrency: true },
    });
    return { baseCurrency: seller.baseCurrency };
}

export async function getNotificationSettings(params: { sellerId: number }) {
    const seller = await prisma.sellerProfile.findUnique({
        where: { id: params.sellerId },
        select: {
            notifyInvoiceIssued: true,
            notifyInvoiceStatusChange: true,
            notifyPaymentReminder: true,
            notifyLowStock: true,
            lowStockThreshold: true,
        },
    });
    if (!seller) throw Object.assign(new Error("Seller not found"), { status: 404 });
    return seller;
}

export async function setNotificationSettings(params: {
    sellerId: number;
    input: {
        notifyInvoiceIssued?: boolean;
        notifyInvoiceStatusChange?: boolean;
        notifyPaymentReminder?: boolean;
        notifyLowStock?: boolean;
        lowStockThreshold?: number;
    };
}) {
    const seller = await prisma.sellerProfile.update({
        where: { id: params.sellerId },
        data: {
            notifyInvoiceIssued: params.input.notifyInvoiceIssued ?? undefined,
            notifyInvoiceStatusChange: params.input.notifyInvoiceStatusChange ?? undefined,
            notifyPaymentReminder: params.input.notifyPaymentReminder ?? undefined,
            notifyLowStock: params.input.notifyLowStock ?? undefined,
            lowStockThreshold: params.input.lowStockThreshold ?? undefined,
        },
        select: {
            notifyInvoiceIssued: true,
            notifyInvoiceStatusChange: true,
            notifyPaymentReminder: true,
            notifyLowStock: true,
            lowStockThreshold: true,
        },
    });
    return seller;
}
