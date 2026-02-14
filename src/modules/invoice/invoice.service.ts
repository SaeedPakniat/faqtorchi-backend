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


function formatMoney(value: bigint) {
    return value.toString();
}

function formatDateShort(value: Date) {
    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, "0");
    const dd = String(value.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function applyProductDiscount(unitPrice: bigint, discount?: { type: "PERCENT" | "FIXED"; value: bigint }) {
    if (!discount) return unitPrice;
    if (discount.type === "FIXED") {
        const next = unitPrice - discount.value;
        return next < 0n ? 0n : next;
    }
    const reduction = (unitPrice * discount.value) / 100n;
    const next = unitPrice - reduction;
    return next < 0n ? 0n : next;
}

function drawTableRow(doc: PDFKit.PDFDocument, y: number, cols: { x: number; w: number; text: string; align?: PDFKit.Mixins.TextOptions["align"] }[], opts?: { height?: number; fontSize?: number; bold?: boolean }) {
    const height = opts?.height ?? 22;
    doc.fontSize(opts?.fontSize ?? 10);
    doc.font(opts?.bold ? "Helvetica-Bold" : "Helvetica");
    for (const col of cols) {
        doc.text(col.text, col.x + 4, y + 6, { width: col.w - 8, align: col.align ?? "left" });
    }
    doc.moveTo(cols[0].x, y + height).lineTo(cols[0].x + cols.reduce((a, c) => a + c.w, 0), y + height).stroke("#E3E7ED");
}



function renderInvoicePdfSunriseClassic(doc: PDFKit.PDFDocument, invoice: {
    id: number;
    currency: string;
    subtotal: bigint;
    discount: bigint;
    tax: bigint;
    total: bigint;
    issuedAt: Date;
    customerName: string | null;
    customerPhone: string | null;
    seller: { storeName: string };
    items: Array<{
        description: string | null;
        quantity: number;
        unitPrice: bigint;
        lineTotal: bigint;
    }>;
}) {
    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const margin = 36;
    const orange = "#F39C12";
    const red = "#E74C3C";
    const dark = "#2D3436";

    doc.rect(0, 0, pageW, 80).fill(orange);
    doc.circle(pageW - 70, 40, 24).fill(red);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(18).text(invoice.seller.storeName, margin, 26);
    doc.font("Helvetica").fontSize(10).fillColor("#FFFFFF");
    doc.text(`Invoice #${invoice.id}`, margin, 48);

    doc.fillColor(dark).font("Helvetica").fontSize(10);
    doc.text(`Issued: ${formatDateShort(invoice.issuedAt)}`, pageW - margin - 140, 26, { width: 140, align: "right" });
    doc.text(`Currency: ${invoice.currency}`, pageW - margin - 140, 42, { width: 140, align: "right" });

    doc.fillColor("#FFF7ED").rect(margin, 100, pageW - margin * 2, 54).fill();
    doc.fillColor(dark).font("Helvetica-Bold").fontSize(11).text("Customer", margin + 10, 108);
    doc.font("Helvetica").fontSize(10).text(`Name: ${invoice.customerName ?? "-"}`, margin + 10, 126);
    doc.text(`Phone: ${invoice.customerPhone ?? "-"}`, margin + 10, 142);

    const tableY = 170;
    const tableW = pageW - margin * 2;
    const cols = [
        { x: margin, w: 30, label: "#" },
        { x: margin + 30, w: tableW - 30 - 60 - 80 - 80, label: "Description" },
        { x: margin + (tableW - 60 - 80 - 80), w: 60, label: "Qty" },
        { x: margin + (tableW - 80 - 80), w: 80, label: "Unit" },
        { x: margin + (tableW - 80), w: 80, label: "Line" },
    ];

    doc.fillColor("#FDEBD0").rect(margin, tableY, tableW, 24).fill();
    doc.fillColor(dark);
    drawTableRow(doc, tableY, cols.map(c => ({ x: c.x, w: c.w, text: c.label, align: c.label == "Description" ? "left" : "center" })), { height: 24, fontSize: 10, bold: true });

    let y = tableY + 24;
    invoice.items.forEach((item, idx) => {
        drawTableRow(doc, y, [
            { x: cols[0].x, w: cols[0].w, text: String(idx + 1), align: "center" },
            { x: cols[1].x, w: cols[1].w, text: item.description ?? "Item", align: "left" },
            { x: cols[2].x, w: cols[2].w, text: String(item.quantity), align: "center" },
            { x: cols[3].x, w: cols[3].w, text: formatMoney(item.unitPrice), align: "center" },
            { x: cols[4].x, w: cols[4].w, text: formatMoney(item.lineTotal), align: "center" },
        ], { height: 22, fontSize: 10, bold: false });
        y += 22;
    });

    const totalsW = 200;
    const totalsX = pageW - margin - totalsW;
    const totalsY = y + 16;
    doc.fillColor("#FFF1E6").rect(totalsX, totalsY, totalsW, 80).fill();
    doc.fillColor(dark).font("Helvetica").fontSize(10);
    doc.text(`Subtotal: ${formatMoney(invoice.subtotal)}`, totalsX + 10, totalsY + 10, { width: totalsW - 20, align: "right" });
    doc.text(`Discount: ${formatMoney(invoice.discount)}`, totalsX + 10, totalsY + 28, { width: totalsW - 20, align: "right" });
    doc.text(`Tax: ${formatMoney(invoice.tax)}`, totalsX + 10, totalsY + 46, { width: totalsW - 20, align: "right" });
    doc.font("Helvetica-Bold").text(`Total: ${formatMoney(invoice.total)}`, totalsX + 10, totalsY + 62, { width: totalsW - 20, align: "right" });

    doc.rect(0, pageH - 40, pageW, 40).fill(orange);
    doc.fillColor("#FFFFFF").font("Helvetica").fontSize(10).text("Thank you", margin, pageH - 26);
}

function renderInvoicePdfMonoGrid(doc: PDFKit.PDFDocument, invoice: {
    id: number;
    currency: string;
    subtotal: bigint;
    discount: bigint;
    tax: bigint;
    total: bigint;
    issuedAt: Date;
    customerName: string | null;
    customerPhone: string | null;
    seller: { storeName: string };
    items: Array<{
        description: string | null;
        quantity: number;
        unitPrice: bigint;
        lineTotal: bigint;
    }>;
}) {
    const pageW = doc.page.width;
    const margin = 36;
    const dark = "#111827";
    const gray = "#E5E7EB";

    doc.fillColor(dark).font("Helvetica-Bold").fontSize(20).text("INVOICE", margin, 24);
    doc.font("Helvetica").fontSize(10).fillColor(dark).text(`No: ${invoice.id}`, margin, 48);
    doc.text(`Date: ${formatDateShort(invoice.issuedAt)}`, margin, 62);

    doc.rect(margin, 88, pageW - margin * 2, 1).fill(gray);

    doc.font("Helvetica-Bold").fontSize(11).text(invoice.seller.storeName, margin, 100);
    doc.font("Helvetica").fontSize(10).text(`To: ${invoice.customerName ?? "-"}`, margin, 118);
    doc.text(`Phone: ${invoice.customerPhone ?? "-"}`, margin, 134);

    const tableY = 160;
    const tableW = pageW - margin * 2;
    const cols = [
        { x: margin, w: 30, label: "#" },
        { x: margin + 30, w: tableW - 30 - 60 - 80 - 80, label: "Description" },
        { x: margin + (tableW - 60 - 80 - 80), w: 60, label: "Qty" },
        { x: margin + (tableW - 80 - 80), w: 80, label: "Unit" },
        { x: margin + (tableW - 80), w: 80, label: "Line" },
    ];

    doc.rect(margin, tableY, tableW, 24).fill(gray);
    doc.fillColor(dark);
    drawTableRow(doc, tableY, cols.map(c => ({ x: c.x, w: c.w, text: c.label, align: c.label == "Description" ? "left" : "center" })), { height: 24, fontSize: 10, bold: true });

    let y = tableY + 24;
    invoice.items.forEach((item, idx) => {
        drawTableRow(doc, y, [
            { x: cols[0].x, w: cols[0].w, text: String(idx + 1), align: "center" },
            { x: cols[1].x, w: cols[1].w, text: item.description ?? "Item", align: "left" },
            { x: cols[2].x, w: cols[2].w, text: String(item.quantity), align: "center" },
            { x: cols[3].x, w: cols[3].w, text: formatMoney(item.unitPrice), align: "center" },
            { x: cols[4].x, w: cols[4].w, text: formatMoney(item.lineTotal), align: "center" },
        ], { height: 22, fontSize: 10, bold: false });
        y += 22;
    });

    const totalsW = 200;
    const totalsX = pageW - margin - totalsW;
    const totalsY = y + 16;
    doc.rect(totalsX, totalsY, totalsW, 80).fill(gray);
    doc.fillColor(dark).font("Helvetica").fontSize(10);
    doc.text(`Subtotal: ${formatMoney(invoice.subtotal)}`, totalsX + 10, totalsY + 10, { width: totalsW - 20, align: "right" });
    doc.text(`Discount: ${formatMoney(invoice.discount)}`, totalsX + 10, totalsY + 28, { width: totalsW - 20, align: "right" });
    doc.text(`Tax: ${formatMoney(invoice.tax)}`, totalsX + 10, totalsY + 46, { width: totalsW - 20, align: "right" });
    doc.font("Helvetica-Bold").text(`Total: ${formatMoney(invoice.total)}`, totalsX + 10, totalsY + 62, { width: totalsW - 20, align: "right" });
}

function renderInvoicePdfBlueMin(doc: PDFKit.PDFDocument, invoice: {
    id: number;
    currency: string;
    subtotal: bigint;
    discount: bigint;
    tax: bigint;
    total: bigint;
    issuedAt: Date;
    customerName: string | null;
    customerPhone: string | null;
    seller: { storeName: string };
    items: Array<{
        description: string | null;
        quantity: number;
        unitPrice: bigint;
        lineTotal: bigint;
    }>;
}) {
    const pageW = doc.page.width;
    const margin = 36;
    const blue = "#1B4F9B";
    const dark = "#0E1A2B";

    doc.rect(0, 0, pageW, 60).fill(blue);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(16).text(invoice.seller.storeName, margin, 20);
    doc.font("Helvetica").fontSize(10).fillColor("#FFFFFF");
    doc.text(`Invoice #${invoice.id}`, pageW - margin - 140, 18, { width: 140, align: "right" });
    doc.text(`Issued: ${formatDateShort(invoice.issuedAt)}`, pageW - margin - 140, 34, { width: 140, align: "right" });

    // Customer box
    doc.fillColor("#F2F5FA").rect(margin, 80, pageW - margin * 2, 60).fill();
    doc.fillColor(dark).font("Helvetica-Bold").fontSize(11).text("Customer", margin + 10, 88);
    doc.font("Helvetica").fontSize(10).text(`Name: ${invoice.customerName ?? "-"}`, margin + 10, 106);
    doc.text(`Phone: ${invoice.customerPhone ?? "-"}`, margin + 10, 122);

    // Items table
    const tableY = 160;
    const tableW = pageW - margin * 2;
    const cols = [
        { x: margin, w: 30, label: "#" },
        { x: margin + 30, w: tableW - 30 - 60 - 80 - 80, label: "Description" },
        { x: margin + (tableW - 60 - 80 - 80), w: 60, label: "Qty" },
        { x: margin + (tableW - 80 - 80), w: 80, label: "Unit" },
        { x: margin + (tableW - 80), w: 80, label: "Line" },
    ];

    doc.fillColor("#E6ECF7").rect(margin, tableY, tableW, 24).fill();
    doc.fillColor(dark);
    drawTableRow(doc, tableY, cols.map(c => ({ x: c.x, w: c.w, text: c.label, align: c.label === "Description" ? "left" : "center" })), { height: 24, fontSize: 10, bold: true });

    let y = tableY + 24;
    invoice.items.forEach((item, idx) => {
        drawTableRow(doc, y, [
            { x: cols[0].x, w: cols[0].w, text: String(idx + 1), align: "center" },
            { x: cols[1].x, w: cols[1].w, text: item.description ?? "Item", align: "left" },
            { x: cols[2].x, w: cols[2].w, text: String(item.quantity), align: "center" },
            { x: cols[3].x, w: cols[3].w, text: formatMoney(item.unitPrice), align: "center" },
            { x: cols[4].x, w: cols[4].w, text: formatMoney(item.lineTotal), align: "center" },
        ], { height: 22, fontSize: 10, bold: false });
        y += 22;
    });

    // Totals
    const totalsW = 200;
    const totalsX = pageW - margin - totalsW;
    const totalsY = y + 16;
    doc.fillColor("#F2F5FA").rect(totalsX, totalsY, totalsW, 80).fill();
    doc.fillColor(dark).font("Helvetica").fontSize(10);
    doc.text(`Subtotal: ${formatMoney(invoice.subtotal)}`, totalsX + 10, totalsY + 10, { width: totalsW - 20, align: "right" });
    doc.text(`Discount: ${formatMoney(invoice.discount)}`, totalsX + 10, totalsY + 28, { width: totalsW - 20, align: "right" });
    doc.text(`Tax: ${formatMoney(invoice.tax)}`, totalsX + 10, totalsY + 46, { width: totalsW - 20, align: "right" });
    doc.font("Helvetica-Bold").text(`Total: ${formatMoney(invoice.total)}`, totalsX + 10, totalsY + 62, { width: totalsW - 20, align: "right" });
}

function renderInvoicePdfSlateModern(doc: PDFKit.PDFDocument, invoice: {
    id: number;
    currency: string;
    subtotal: bigint;
    discount: bigint;
    tax: bigint;
    total: bigint;
    issuedAt: Date;
    customerName: string | null;
    customerPhone: string | null;
    seller: { storeName: string };
    items: Array<{
        description: string | null;
        quantity: number;
        unitPrice: bigint;
        lineTotal: bigint;
    }>;
}) {
    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const margin = 36;
    const slate = "#2C3E50";
    const accent = "#7F8C8D";

    doc.rect(0, 0, pageW, 18).fill(slate);
    doc.fillColor(slate).font("Helvetica-Bold").fontSize(18).text("INVOICE", margin, 26);
    doc.fillColor(accent).font("Helvetica").fontSize(10).text(`Invoice #${invoice.id}`, margin, 50);
    doc.text(`Issued: ${formatDateShort(invoice.issuedAt)}`, margin, 64);

    doc.fillColor("#FFFFFF").rect(margin, 90, pageW - margin * 2, 54).fillAndStroke("#FFFFFF", "#E0E4EA");
    doc.fillColor(slate).font("Helvetica-Bold").fontSize(11).text("Bill To", margin + 10, 98);
    doc.font("Helvetica").fontSize(10).text(`${invoice.customerName ?? "-"}`, margin + 10, 116);
    doc.text(`${invoice.customerPhone ?? "-"}`, margin + 10, 132);

    // Items
    const tableY = 160;
    const tableW = pageW - margin * 2;
    const cols = [
        { x: margin, w: 30, label: "#" },
        { x: margin + 30, w: tableW - 30 - 60 - 80 - 80, label: "Description" },
        { x: margin + (tableW - 60 - 80 - 80), w: 60, label: "Qty" },
        { x: margin + (tableW - 80 - 80), w: 80, label: "Unit" },
        { x: margin + (tableW - 80), w: 80, label: "Line" },
    ];

    doc.fillColor("#F0F2F5").rect(margin, tableY, tableW, 24).fill();
    doc.fillColor(slate);
    drawTableRow(doc, tableY, cols.map(c => ({ x: c.x, w: c.w, text: c.label, align: c.label === "Description" ? "left" : "center" })), { height: 24, fontSize: 10, bold: true });

    let y = tableY + 24;
    invoice.items.forEach((item, idx) => {
        drawTableRow(doc, y, [
            { x: cols[0].x, w: cols[0].w, text: String(idx + 1), align: "center" },
            { x: cols[1].x, w: cols[1].w, text: item.description ?? "Item", align: "left" },
            { x: cols[2].x, w: cols[2].w, text: String(item.quantity), align: "center" },
            { x: cols[3].x, w: cols[3].w, text: formatMoney(item.unitPrice), align: "center" },
            { x: cols[4].x, w: cols[4].w, text: formatMoney(item.lineTotal), align: "center" },
        ], { height: 22, fontSize: 10, bold: false });
        y += 22;
    });

    const totalsW = 200;
    const totalsX = pageW - margin - totalsW;
    const totalsY = y + 16;
    doc.fillColor("#F0F2F5").rect(totalsX, totalsY, totalsW, 80).fill();
    doc.fillColor(slate).font("Helvetica").fontSize(10);
    doc.text(`Subtotal: ${formatMoney(invoice.subtotal)}`, totalsX + 10, totalsY + 10, { width: totalsW - 20, align: "right" });
    doc.text(`Discount: ${formatMoney(invoice.discount)}`, totalsX + 10, totalsY + 28, { width: totalsW - 20, align: "right" });
    doc.text(`Tax: ${formatMoney(invoice.tax)}`, totalsX + 10, totalsY + 46, { width: totalsW - 20, align: "right" });
    doc.font("Helvetica-Bold").text(`Total: ${formatMoney(invoice.total)}`, totalsX + 10, totalsY + 62, { width: totalsW - 20, align: "right" });

    doc.fillColor(accent).font("Helvetica").fontSize(9).text("Generated by Faqtori", margin, pageH - 30);
}

function renderInvoicePdfGreen(doc: PDFKit.PDFDocument, invoice: {
    id: number;
    currency: string;
    subtotal: bigint;
    discount: bigint;
    tax: bigint;
    total: bigint;
    issuedAt: Date;
    customerName: string | null;
    customerPhone: string | null;
    seller: { storeName: string };
    items: Array<{
        description: string | null;
        quantity: number;
        unitPrice: bigint;
        lineTotal: bigint;
    }>;
}) {
    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const margin = 36;
    const green = "#1F8E74";
    const dark = "#0F2320";

    // Header band
    doc.rect(0, 0, pageW, 70).fill(green);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(16).text(invoice.seller.storeName, margin, 24, { width: pageW - margin * 2, align: "left" });

    doc.font("Helvetica").fontSize(10).fillColor("#FFFFFF");
    doc.text(`Invoice #${invoice.id}`, pageW - margin - 140, 18, { width: 140, align: "right" });
    doc.text(`Issued: ${formatDateShort(invoice.issuedAt)}`, pageW - margin - 140, 34, { width: 140, align: "right" });
    doc.text(`Currency: ${invoice.currency}`, pageW - margin - 140, 50, { width: 140, align: "right" });

    // Customer / Seller boxes
    const boxY = 90;
    const boxH = 80;
    const gap = 12;
    const boxW = (pageW - margin * 2 - gap) / 2;

    doc.fillColor("#F6F8FB").rect(margin, boxY, boxW, boxH).fill();
    doc.fillColor(dark).font("Helvetica-Bold").fontSize(11).text("Customer", margin + 10, boxY + 8);
    doc.font("Helvetica").fontSize(10).text(`Name: ${invoice.customerName ?? "-"}`, margin + 10, boxY + 28);
    doc.text(`Phone: ${invoice.customerPhone ?? "-"}`, margin + 10, boxY + 44);

    doc.fillColor("#F6F8FB").rect(margin + boxW + gap, boxY, boxW, boxH).fill();
    doc.fillColor(dark).font("Helvetica-Bold").fontSize(11).text("Seller", margin + boxW + gap + 10, boxY + 8);
    doc.font("Helvetica").fontSize(10).text(`Store: ${invoice.seller.storeName}`, margin + boxW + gap + 10, boxY + 28);

    // Items table
    const tableY = boxY + boxH + 24;
    const tableW = pageW - margin * 2;
    const cols = [
        { x: margin, w: 30, label: "#" },
        { x: margin + 30, w: tableW - 30 - 60 - 80 - 80, label: "Description" },
        { x: margin + (tableW - 60 - 80 - 80), w: 60, label: "Qty" },
        { x: margin + (tableW - 80 - 80), w: 80, label: "Unit" },
        { x: margin + (tableW - 80), w: 80, label: "Line" },
    ];

    doc.fillColor("#EAF2EF").rect(margin, tableY, tableW, 24).fill();
    doc.fillColor(dark);
    drawTableRow(doc, tableY, cols.map(c => ({ x: c.x, w: c.w, text: c.label, align: c.label === "Description" ? "left" : "center" })), { height: 24, fontSize: 10, bold: true });

    let y = tableY + 24;
    invoice.items.forEach((item, idx) => {
        const row = [
            { x: cols[0].x, w: cols[0].w, text: String(idx + 1), align: "center" as const },
            { x: cols[1].x, w: cols[1].w, text: item.description ?? "Item", align: "left" as const },
            { x: cols[2].x, w: cols[2].w, text: String(item.quantity), align: "center" as const },
            { x: cols[3].x, w: cols[3].w, text: formatMoney(item.unitPrice), align: "center" as const },
            { x: cols[4].x, w: cols[4].w, text: formatMoney(item.lineTotal), align: "center" as const },
        ];
        drawTableRow(doc, y, row, { height: 22, fontSize: 10, bold: false });
        y += 22;
    });

    // Totals box
    const totalsW = 200;
    const totalsX = pageW - margin - totalsW;
    const totalsY = y + 20;
    doc.fillColor("#F6F8FB").rect(totalsX, totalsY, totalsW, 80).fill();
    doc.fillColor(dark).font("Helvetica").fontSize(10);
    doc.text(`Subtotal: ${formatMoney(invoice.subtotal)}`, totalsX + 10, totalsY + 10, { width: totalsW - 20, align: "right" });
    doc.text(`Discount: ${formatMoney(invoice.discount)}`, totalsX + 10, totalsY + 28, { width: totalsW - 20, align: "right" });
    doc.text(`Tax: ${formatMoney(invoice.tax)}`, totalsX + 10, totalsY + 46, { width: totalsW - 20, align: "right" });
    doc.font("Helvetica-Bold").text(`Total: ${formatMoney(invoice.total)}`, totalsX + 10, totalsY + 62, { width: totalsW - 20, align: "right" });

    // Footer band
    doc.rect(0, pageH - 50, pageW, 50).fill(green);
    doc.fillColor("#FFFFFF").font("Helvetica").fontSize(10).text("Thank you for your business", margin, pageH - 32, { width: pageW - margin * 2, align: "left" });
}

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
    seller: { storeName: string; invoiceTemplateId?: string | null };
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

    const templateId = invoice.seller.invoiceTemplateId ?? "default";
    if (templateId === "green-v1") {
        renderInvoicePdfGreen(doc, {
            id: invoice.id,
            currency: invoice.currency,
            subtotal: invoice.subtotal,
            discount: invoice.discount,
            tax: invoice.tax,
            total: invoice.total,
            issuedAt: invoice.issuedAt,
            customerName: invoice.customerName,
            customerPhone: invoice.customerPhone,
            seller: { storeName: invoice.seller.storeName },
            items: invoice.items,
        });
        doc.end();
        await new Promise<void>((resolve, reject) => {
            stream.on("finish", () => resolve());
            stream.on("error", reject);
        });
        return;
    }

    if (templateId === "blue-min") {
        renderInvoicePdfBlueMin(doc, {
            id: invoice.id,
            currency: invoice.currency,
            subtotal: invoice.subtotal,
            discount: invoice.discount,
            tax: invoice.tax,
            total: invoice.total,
            issuedAt: invoice.issuedAt,
            customerName: invoice.customerName,
            customerPhone: invoice.customerPhone,
            seller: { storeName: invoice.seller.storeName },
            items: invoice.items,
        });
        doc.end();
        await new Promise<void>((resolve, reject) => {
            stream.on("finish", () => resolve());
            stream.on("error", reject);
        });
        return;
    }

    if (templateId === "slate-modern") {
        renderInvoicePdfSlateModern(doc, {
            id: invoice.id,
            currency: invoice.currency,
            subtotal: invoice.subtotal,
            discount: invoice.discount,
            tax: invoice.tax,
            total: invoice.total,
            issuedAt: invoice.issuedAt,
            customerName: invoice.customerName,
            customerPhone: invoice.customerPhone,
            seller: { storeName: invoice.seller.storeName },
            items: invoice.items,
        });
        doc.end();
        await new Promise<void>((resolve, reject) => {
            stream.on("finish", () => resolve());
            stream.on("error", reject);
        });
        return;
    }

    if (templateId === "sunrise-classic") {
        renderInvoicePdfSunriseClassic(doc, {
            id: invoice.id,
            currency: invoice.currency,
            subtotal: invoice.subtotal,
            discount: invoice.discount,
            tax: invoice.tax,
            total: invoice.total,
            issuedAt: invoice.issuedAt,
            customerName: invoice.customerName,
            customerPhone: invoice.customerPhone,
            seller: { storeName: invoice.seller.storeName },
            items: invoice.items,
        });
        doc.end();
        await new Promise<void>((resolve, reject) => {
            stream.on("finish", () => resolve());
            stream.on("error", reject);
        });
        return;
    }

    if (templateId === "mono-grid") {
        renderInvoicePdfMonoGrid(doc, {
            id: invoice.id,
            currency: invoice.currency,
            subtotal: invoice.subtotal,
            discount: invoice.discount,
            tax: invoice.tax,
            total: invoice.total,
            issuedAt: invoice.issuedAt,
            customerName: invoice.customerName,
            customerPhone: invoice.customerPhone,
            seller: { storeName: invoice.seller.storeName },
            items: invoice.items,
        });
        doc.end();
        await new Promise<void>((resolve, reject) => {
            stream.on("finish", () => resolve());
            stream.on("error", reject);
        });
        return;
    }

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
            select: { id: true, price: true, productId: true },
        });

        if (variants.length !== variantIds.length) {
            throw Object.assign(new Error("Variant not found"), { status: 404 });
        }

        const priceByVariant = new Map<number, bigint>(variants.map((v) => [v.id, v.price]));
        const productByVariant = new Map<number, number>(variants.map((v) => [v.id, v.productId]));

        const productIds = [...new Set(variants.map((v) => v.productId))];
        const now = new Date();
        const discounts = await tx.productDiscount.findMany({
            where: {
                sellerId: params.sellerId,
                isActive: true,
                OR: [{ variantId: { in: variantIds } }, { productId: { in: productIds } }],
                AND: [
                    { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
                    { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
                ],
            },
            orderBy: [{ createdAt: "desc" }],
            select: { id: true, productId: true, variantId: true, type: true, value: true },
        });

        const discountByVariant = new Map<number, { type: "PERCENT" | "FIXED"; value: bigint }>();
        const discountByProduct = new Map<number, { type: "PERCENT" | "FIXED"; value: bigint }>();
        for (const d of discounts) {
            if (d.variantId && !discountByVariant.has(d.variantId)) {
                discountByVariant.set(d.variantId, { type: d.type, value: d.value });
            }
            if (d.productId && !discountByProduct.has(d.productId)) {
                discountByProduct.set(d.productId, { type: d.type, value: d.value });
            }
        }

        // 3) build invoice items (unitPrice from variant.price)
        const itemsPrepared = params.items.map((i) => {
            const unitPrice = priceByVariant.get(i.variantId);
            if (unitPrice == null) throw Object.assign(new Error("Variant not found"), { status: 404 });
            const productId = productByVariant.get(i.variantId);
            const discount =
                discountByVariant.get(i.variantId) ??
                (productId ? discountByProduct.get(productId) : undefined);
            const discountedUnit = applyProductDiscount(unitPrice, discount);

            const lineTotal = discountedUnit * BigInt(i.quantity);
            return {
                variantId: i.variantId,
                quantity: i.quantity,
                unitPrice: discountedUnit,
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

export async function getInvoiceById(params: { sellerId: number; invoiceId: number; allowedWarehouseIds?: number[] | null }) {
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
    if (params.allowedWarehouseIds !== undefined && invoice.warehouseId != null) {
        const allowed = params.allowedWarehouseIds ?? [];
        if (!allowed.includes(invoice.warehouseId)) {
            throw Object.assign(new Error("Forbidden"), { status: 403 });
        }
    }

    return { invoice };
}

export async function assertInvoiceWarehouseAccess(params: {
    sellerId: number;
    invoiceId: number;
    allowedWarehouseIds?: number[] | null;
}) {
    const invoice = await prisma.invoice.findFirst({
        where: { id: params.invoiceId, sellerId: params.sellerId },
        select: { id: true, warehouseId: true },
    });

    if (!invoice) throw Object.assign(new Error("Invoice not found"), { status: 404 });
    if (params.allowedWarehouseIds !== undefined && invoice.warehouseId != null) {
        const allowed = params.allowedWarehouseIds ?? [];
        if (!allowed.includes(invoice.warehouseId)) {
            throw Object.assign(new Error("Forbidden"), { status: 403 });
        }
    }

    return invoice;
}

export async function listInvoices(params: { sellerId: number; allowedWarehouseIds?: number[] | null } & ListInvoicesInput) {
    const where: Record<string, unknown> = { sellerId: params.sellerId };

    if (params.status) where.status = params.status;
    if (params.type) where.type = params.type;

    if (params.from || params.to) {
        where.issuedAt = {
            ...(params.from ? { gte: new Date(params.from) } : {}),
            ...(params.to ? { lte: new Date(params.to) } : {}),
        };
    }

    if (params.allowedWarehouseIds !== undefined) {
        const allowed = params.allowedWarehouseIds ?? [];
        if (allowed.length === 0) {
            where.warehouseId = null;
        } else {
            where.OR = [{ warehouseId: { in: allowed } }, { warehouseId: null }];
        }
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
            seller: { select: { storeName: true, invoiceTemplateId: true } },
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
