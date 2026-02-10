import { prisma } from "../../prisma/client";
import type { Prisma } from "@prisma/client";
import type { CreateInstantInvoiceInput, CreateWarehouseInvoiceInput, ListInvoicesInput } from "./invoice.schemas";
import { toBigInt } from "../../utils/bigint";
import { getExchangeRateSnapshot } from "../exchangeRate/exchangeRate.service";
import { sendInvoiceIssuedNotification } from "../common/notification";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import crypto from "crypto";

const STORAGE_ROOT = path.join(process.cwd(), "storage");

function getInvoicePdfPaths(sellerId: number, invoiceId: number) {
    const relativeKey = path.join("invoices", String(sellerId), `${invoiceId}.pdf`);
    const fullPath = path.join(STORAGE_ROOT, relativeKey);
    const normalizedRoot = path.normalize(STORAGE_ROOT + path.sep);
    const normalizedPath = path.normalize(fullPath);
    if (!normalizedPath.startsWith(normalizedRoot)) {
        throw Object.assign(new Error("Invalid PDF path"), { status: 400 });
    }
    return { relativeKey, fullPath };
}

async function renderInvoicePdf(invoice: {
    id: number;
    currency: string;
    subtotal: bigint;
    discount: bigint;
    tax: bigint;
    total: bigint;
    issuedAt: Date;
    customerName: string | null;
    customerPhone: string | null;
    extra?: unknown;
    seller: { storeName: string };
    items: Array<{
        description: string | null;
        quantity: number;
        unitPrice: bigint;
        lineTotal: bigint;
    }>;
}, fullPath: string) {
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const stream = fs.createWriteStream(fullPath);
    doc.pipe(stream);

    doc.fontSize(18).text(invoice.seller.storeName);
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Invoice #${invoice.id}`);
    doc.text(`Issued: ${invoice.issuedAt.toISOString()}`);
    doc.text(`Currency: ${invoice.currency}`);

    if (invoice.customerName || invoice.customerPhone) {
        doc.moveDown(0.5);
        doc.text(`Customer: ${invoice.customerName ?? "-"}`);
        if (invoice.customerPhone) doc.text(`Phone: ${invoice.customerPhone}`);
    }

    doc.moveDown(1);
    doc.fontSize(12).text("Items:");
    doc.moveDown(0.5);

    invoice.items.forEach((item, idx) => {
        doc.text(
            `${idx + 1}. ${item.description ?? "Item"} | Qty: ${item.quantity} | Unit: ${item.unitPrice.toString()} | Line: ${item.lineTotal.toString()}`
        );
    });

    doc.moveDown(1);
    doc.text(`Subtotal: ${invoice.subtotal.toString()}`);
    doc.text(`Discount: ${invoice.discount.toString()}`);
    doc.text(`Tax: ${invoice.tax.toString()}`);
    doc.text(`Total: ${invoice.total.toString()}`);

    const extraObject =
        invoice.extra && typeof invoice.extra === "object" && !Array.isArray(invoice.extra) ? invoice.extra : null;
    if (extraObject && Object.keys(extraObject as Record<string, unknown>).length > 0) {
        doc.moveDown(1);
        doc.text("Extra:");
        doc.text(JSON.stringify(extraObject));
    }

    doc.end();

    await new Promise<void>((resolve, reject) => {
        stream.on("finish", () => resolve());
        stream.on("error", reject);
    });
}

async function assertCustomerOwnership(tx: Prisma.TransactionClient, sellerId: number, customerId: number) {
    const customer = await tx.sellerCustomer.findFirst({
        where: { id: customerId, sellerId },
        select: { id: true },
    });
    if (!customer) throw Object.assign(new Error("Customer not found"), { status: 404 });
}

async function getDiscountFromCode(params: {
    tx: Prisma.TransactionClient;
    sellerId: number;
    code: string;
    items: { variantId: number | null; lineTotal: bigint }[];
    subtotal: bigint;
}) {
    const now = new Date();
    const discount = await params.tx.discountCode.findFirst({
        where: { sellerId: params.sellerId, code: params.code.toUpperCase() },
    });
    if (!discount || !discount.isActive) {
        throw Object.assign(new Error("Discount code not found"), { status: 404 });
    }
    if (discount.startsAt && discount.startsAt > now) {
        throw Object.assign(new Error("Discount code not active yet"), { status: 400 });
    }
    if (discount.endsAt && discount.endsAt < now) {
        throw Object.assign(new Error("Discount code expired"), { status: 400 });
    }
    if (discount.maxUses != null && discount.usedCount >= discount.maxUses) {
        throw Object.assign(new Error("Discount code usage limit reached"), { status: 400 });
    }

    const baseTotal = discount.variantId
        ? params.items
              .filter((i) => i.variantId === discount.variantId)
              .reduce((acc, i) => acc + i.lineTotal, 0n)
        : params.subtotal;

    if (discount.variantId && baseTotal === 0n) {
        throw Object.assign(new Error("Discount code not applicable"), { status: 400 });
    }

    let amount = 0n;
    if (discount.type === "FIXED") {
        amount = discount.value > baseTotal ? baseTotal : discount.value;
    } else {
        amount = (baseTotal * discount.value) / 100n;
    }

    return { amount, discountCodeId: discount.id };
}

export async function createWarehouseInvoice(params: {
    sellerId: number;
    warehouseId: number;
    createdByUserId: number;
} & CreateWarehouseInvoiceInput) {
    const exchangeRate =
        params.currency !== "IRR"
            ? await getExchangeRateSnapshot({ base: params.currency, quote: "IRR" })
            : null;
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
        const discountManual = toBigInt(params.discount);
        const discountPercent = params.discountPercent ?? 0n;
        const discountFromPercent = (subtotal * discountPercent) / 100n;

        const taxManual = toBigInt(params.tax);
        const taxPercent = params.taxPercent ?? 0n;
        const taxFromPercent = (subtotal * taxPercent) / 100n;

        let discountFromCode = 0n;
        let discountCodeId: number | null = null;
        if (params.discountCode) {
            const applied = await getDiscountFromCode({
                tx,
                sellerId: params.sellerId,
                code: params.discountCode,
                items: itemsPrepared.map((it) => ({ variantId: it.variantId, lineTotal: it.lineTotal })),
                subtotal,
            });
            discountFromCode = applied.amount;
            discountCodeId = applied.discountCodeId;
        }

        const discount = discountManual + discountFromCode + discountFromPercent;
        if (discount > subtotal) {
            throw Object.assign(new Error("Discount cannot exceed subtotal"), { status: 400 });
        }

        const tax = taxManual + taxFromPercent;
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
                discountCodeId,
                extra: params.extra ?? undefined,
                exchangeRateBase: exchangeRate?.base ?? null,
                exchangeRateQuote: exchangeRate?.quote ?? null,
                exchangeRateValue: exchangeRate?.rate ?? null,
                exchangeRateFetchedAt: exchangeRate?.fetchedAt ?? null,

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

        if (discountCodeId) {
            await tx.discountCode.update({
                where: { id: discountCodeId },
                data: { usedCount: { increment: 1 } },
            });
        }

        return { invoice };
    });
}

export async function createInstantInvoice(params: {
    sellerId: number;
    createdByUserId: number;
} & CreateInstantInvoiceInput) {
    const exchangeRate =
        params.currency !== "IRR"
            ? await getExchangeRateSnapshot({ base: params.currency, quote: "IRR" })
            : null;
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
        const discountManual = toBigInt(params.discount);
        const discountPercent = params.discountPercent ?? 0n;
        const discountFromPercent = (subtotal * discountPercent) / 100n;

        const taxManual = toBigInt(params.tax);
        const taxPercent = params.taxPercent ?? 0n;
        const taxFromPercent = (subtotal * taxPercent) / 100n;

        let discountFromCode = 0n;
        let discountCodeId: number | null = null;
        if (params.discountCode) {
            const applied = await getDiscountFromCode({
                tx,
                sellerId: params.sellerId,
                code: params.discountCode,
                items: itemsPrepared.map((it) => ({ variantId: it.variantId, lineTotal: it.lineTotal })),
                subtotal,
            });
            discountFromCode = applied.amount;
            discountCodeId = applied.discountCodeId;
        }

        const discount = discountManual + discountFromCode + discountFromPercent;
        if (discount > subtotal) {
            throw Object.assign(new Error("Discount cannot exceed subtotal"), { status: 400 });
        }

        const tax = taxManual + taxFromPercent;
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
                discountCodeId,
                extra: params.extra ?? undefined,
                exchangeRateBase: exchangeRate?.base ?? null,
                exchangeRateQuote: exchangeRate?.quote ?? null,
                exchangeRateValue: exchangeRate?.rate ?? null,
                exchangeRateFetchedAt: exchangeRate?.fetchedAt ?? null,

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

        if (discountCodeId) {
            await tx.discountCode.update({
                where: { id: discountCodeId },
                data: { usedCount: { increment: 1 } },
            });
        }

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

export async function generateInvoicePdf(params: { sellerId: number; invoiceId: number }) {
    const invoice = await prisma.invoice.findFirst({
        where: { id: params.invoiceId, sellerId: params.sellerId },
        include: {
            items: { select: { description: true, quantity: true, unitPrice: true, lineTotal: true } },
            seller: { select: { storeName: true } },
        },
    });

    if (!invoice) throw Object.assign(new Error("Invoice not found"), { status: 404 });

    const token = invoice.pdfToken ?? crypto.randomBytes(24).toString("base64url");
    const { relativeKey, fullPath } = getInvoicePdfPaths(params.sellerId, params.invoiceId);

    await renderInvoicePdf(
        {
            id: invoice.id,
            currency: invoice.currency,
            subtotal: invoice.subtotal,
            discount: invoice.discount,
            tax: invoice.tax,
            total: invoice.total,
            issuedAt: invoice.issuedAt,
            customerName: invoice.customerName,
            customerPhone: invoice.customerPhone,
            extra: invoice.extra ?? null,
            seller: invoice.seller,
            items: invoice.items,
        },
        fullPath
    );

    await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
            pdfKey: relativeKey,
            pdfToken: token,
            pdfGeneratedAt: new Date(),
        },
        select: { id: true },
    });

    return {
        invoiceId: invoice.id,
        pdfKey: relativeKey,
        pdfToken: token,
        pdfUrlPublic: `/api/v1/public/invoices/${token}/pdf`,
    };
}

export async function getInvoicePdfForSeller(params: { sellerId: number; invoiceId: number }) {
    const invoice = await prisma.invoice.findFirst({
        where: { id: params.invoiceId, sellerId: params.sellerId },
        select: { pdfKey: true },
    });

    if (!invoice) throw Object.assign(new Error("Invoice not found"), { status: 404 });
    if (!invoice.pdfKey) throw Object.assign(new Error("PDF not found"), { status: 404 });

    const fullPath = path.join(STORAGE_ROOT, invoice.pdfKey);
    const normalizedRoot = path.normalize(STORAGE_ROOT + path.sep);
    const normalizedPath = path.normalize(fullPath);
    if (!normalizedPath.startsWith(normalizedRoot)) {
        throw Object.assign(new Error("Invalid PDF path"), { status: 400 });
    }

    try {
        await fs.promises.access(fullPath, fs.constants.R_OK);
    } catch {
        throw Object.assign(new Error("PDF not found"), { status: 404 });
    }
    return { fullPath, fileName: path.basename(fullPath) };
}

export async function getInvoicePdfByToken(params: { token: string }) {
    const invoice = await prisma.invoice.findFirst({
        where: { pdfToken: params.token },
        select: { pdfKey: true },
    });

    if (!invoice || !invoice.pdfKey) throw Object.assign(new Error("PDF not found"), { status: 404 });

    const fullPath = path.join(STORAGE_ROOT, invoice.pdfKey);
    const normalizedRoot = path.normalize(STORAGE_ROOT + path.sep);
    const normalizedPath = path.normalize(fullPath);
    if (!normalizedPath.startsWith(normalizedRoot)) {
        throw Object.assign(new Error("Invalid PDF path"), { status: 400 });
    }

    try {
        await fs.promises.access(fullPath, fs.constants.R_OK);
    } catch {
        throw Object.assign(new Error("PDF not found"), { status: 404 });
    }
    return { fullPath, fileName: path.basename(fullPath) };
}

export async function notifyInvoiceIssued(params: { sellerId: number; invoiceId: number }) {
    const invoice = await prisma.invoice.findFirst({
        where: { id: params.invoiceId, sellerId: params.sellerId },
        select: {
            id: true,
            customerPhone: true,
            customer: { select: { phone: true } },
            pdfToken: true,
        },
    });

    if (!invoice) return;

    const phone = invoice.customerPhone ?? invoice.customer?.phone ?? null;
    const pdfUrl = invoice.pdfToken ? `/api/v1/public/invoices/${invoice.pdfToken}/pdf` : undefined;
    const message = pdfUrl
        ? `Invoice ${invoice.id} is issued. PDF: ${pdfUrl}`
        : `Invoice ${invoice.id} is issued.`;

    await sendInvoiceIssuedNotification({ phone, message });
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
