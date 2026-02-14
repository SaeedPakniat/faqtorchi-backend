import { prisma } from "../../prisma/client";
import { toBigInt } from "../../utils/bigint";
import { getExchangeRateSnapshot } from "../exchangeRate/exchangeRate.service";
import type { CreatePaymentInput } from "./payment.schemas";

function computeInvoiceStatus(total: bigint, paid: bigint) {
    if (paid === 0n) return "ISSUED";
    if (paid < total) return "PARTIALLY_PAID";
    return "PAID";
}

export async function createPaymentForInvoice(params: {
    sellerId: number;
    invoiceId: number;
    allowedWarehouseIds?: number[] | null;
} & CreatePaymentInput) {
    return prisma.$transaction(async (tx) => {
        const invoice = await tx.invoice.findUnique({
            where: { id: params.invoiceId },
            select: { id: true, total: true, status: true, sellerId: true, currency: true, warehouseId: true },
        });

        if (!invoice) throw Object.assign(new Error("Invoice not found"), { status: 404 });
        if (invoice.sellerId !== params.sellerId) {
            throw Object.assign(new Error("Forbidden"), { status: 403 });
        }
        if (params.allowedWarehouseIds !== undefined && invoice.warehouseId != null) {
            const allowed = params.allowedWarehouseIds ?? [];
            if (!allowed.includes(invoice.warehouseId)) {
                throw Object.assign(new Error("Forbidden"), { status: 403 });
            }
        }

        const amount = toBigInt(params.amount);
        if (amount <= 0n) throw Object.assign(new Error("Amount must be greater than 0"), { status: 400 });

        const paymentCurrency = params.currency ?? invoice.currency;
        let exchangeRateBase: typeof invoice.currency | null = null;
        let exchangeRateQuote: typeof invoice.currency | null = null;
        let exchangeRateValue: bigint | null = null;
        let exchangeRateFetchedAt: Date | null = null;

        let amountInvoiceCurrency = amount;
        if (paymentCurrency !== invoice.currency) {
            if (invoice.currency !== "IRR") {
                throw Object.assign(
                    new Error("Multi-currency payments are only supported for IRR invoices"),
                    { status: 400 }
                );
            }

            if (params.exchangeRateValue) {
                exchangeRateBase = paymentCurrency;
                exchangeRateQuote = invoice.currency;
                exchangeRateValue = toBigInt(params.exchangeRateValue);
                exchangeRateFetchedAt = new Date();
            } else {
                const rate = await getExchangeRateSnapshot({ base: paymentCurrency, quote: invoice.currency });
                exchangeRateBase = rate.base;
                exchangeRateQuote = rate.quote;
                exchangeRateValue = rate.rate;
                exchangeRateFetchedAt = rate.fetchedAt;
            }

            if (!exchangeRateValue || exchangeRateValue <= 0n) {
                throw Object.assign(new Error("Invalid exchange rate"), { status: 400 });
            }
            amountInvoiceCurrency = amount * exchangeRateValue;
        }

        const sumResult = await tx.payment.aggregate({
            where: { invoiceId: params.invoiceId, status: "RECORDED" },
            _sum: { amountInvoiceCurrency: true },
        });
        const paidSoFar = sumResult._sum.amountInvoiceCurrency ?? 0n;

        if (paidSoFar + amountInvoiceCurrency > invoice.total) {
            throw Object.assign(new Error("Overpayment"), { status: 400 });
        }

        const payment = await tx.payment.create({
            data: {
                invoiceId: params.invoiceId,
                amount,
                currency: paymentCurrency,
                amountInvoiceCurrency,
                exchangeRateBase,
                exchangeRateQuote,
                exchangeRateValue,
                exchangeRateFetchedAt,
                method: params.method,
                note: params.note ?? null,
            },
        });

        const newPaidTotal = paidSoFar + amountInvoiceCurrency;
        const newStatus = computeInvoiceStatus(invoice.total, newPaidTotal);

        if (invoice.status !== newStatus) {
            await tx.invoice.update({
                where: { id: invoice.id },
                data: { status: newStatus },
                select: { id: true },
            });
        }

        return { payment, invoiceStatus: newStatus, paidAmountTotal: newPaidTotal };
    });
}

export async function listPaymentsForInvoice(params: {
    sellerId: number;
    invoiceId: number;
    allowedWarehouseIds?: number[] | null;
}) {
    const invoice = await prisma.invoice.findUnique({
        where: { id: params.invoiceId },
        select: { id: true, sellerId: true, warehouseId: true },
    });

    if (!invoice) throw Object.assign(new Error("Invoice not found"), { status: 404 });
    if (invoice.sellerId !== params.sellerId) {
        throw Object.assign(new Error("Forbidden"), { status: 403 });
    }
    if (params.allowedWarehouseIds !== undefined && invoice.warehouseId != null) {
        const allowed = params.allowedWarehouseIds ?? [];
        if (!allowed.includes(invoice.warehouseId)) {
            throw Object.assign(new Error("Forbidden"), { status: 403 });
        }
    }

    const payments = await prisma.payment.findMany({
        where: { invoiceId: params.invoiceId },
        orderBy: [{ paidAt: "desc" }, { id: "desc" }],
    });

    return { payments };
}

export async function voidPayment(params: { sellerId: number; paymentId: number; allowedWarehouseIds?: number[] | null }) {
    return prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findUnique({
            where: { id: params.paymentId },
            include: { invoice: { select: { id: true, sellerId: true, total: true, status: true, warehouseId: true } } },
        });

        if (!payment) throw Object.assign(new Error("Payment not found"), { status: 404 });
        if (payment.invoice.sellerId !== params.sellerId) {
            throw Object.assign(new Error("Forbidden"), { status: 403 });
        }
        if (params.allowedWarehouseIds !== undefined && payment.invoice.warehouseId != null) {
            const allowed = params.allowedWarehouseIds ?? [];
            if (!allowed.includes(payment.invoice.warehouseId)) {
                throw Object.assign(new Error("Forbidden"), { status: 403 });
            }
        }

        const updatedPayment =
            payment.status === "VOIDED"
                ? payment
                : await tx.payment.update({
                      where: { id: params.paymentId },
                      data: { status: "VOIDED" },
                  });

        const sumResult = await tx.payment.aggregate({
            where: { invoiceId: payment.invoiceId, status: "RECORDED" },
            _sum: { amountInvoiceCurrency: true },
        });
        const paidTotal = sumResult._sum.amountInvoiceCurrency ?? 0n;
        const newStatus = computeInvoiceStatus(payment.invoice.total, paidTotal);

        if (payment.invoice.status !== newStatus) {
            await tx.invoice.update({
                where: { id: payment.invoiceId },
                data: { status: newStatus },
                select: { id: true },
            });
        }

        return { payment: updatedPayment, invoiceStatus: newStatus, paidAmountTotal: paidTotal };
    });
}
