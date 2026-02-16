import { Alert, Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import type { Invoice } from "../store/invoices/models";
import { formatDate, formatToman, statusLabel } from "./format";

/**
 * Generates a PDF file for an invoice and returns its local file URI.
 * Note: On web, printing/sharing behavior is limited.
 */
export async function generateInvoicePdfFile(invoice: Invoice): Promise<string> {
  const total = invoice.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);

  const rows = invoice.items
    .map(
      (it) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(it.name)}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${it.qty}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:left;">${escapeHtml(formatToman(it.unitPrice))}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:left;">${escapeHtml(formatToman(it.qty * it.unitPrice))}</td>
      </tr>`
    )
    .join("");

  const paymentsTotal = invoice.payments.reduce((s, p) => s + p.amount, 0);

  const html = `
  <html dir="rtl" lang="fa">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Invoice ${invoice.id}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial; padding: 24px; color:#111827;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px;">
        <div>
          <div style="font-size:20px; font-weight:700;">Invoice #${escapeHtml(invoice.id)}</div>
          <div style="margin-top:6px; color:#6b7280;">Date: ${escapeHtml(formatDate(invoice.createdAt))}</div>
          <div style="margin-top:6px; color:#6b7280;">Status: ${escapeHtml(statusLabel(invoice.status))}</div>
        </div>
        <div style="text-align:left; color:#6b7280;">
          <div>Seller: ${escapeHtml(invoice.sellerPhone)}</div>
          <div>Customer: ${escapeHtml(invoice.customerName ?? invoice.customerPhone)}</div>
        </div>
      </div>

      <div style="margin-top:18px; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden;">
        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:10px; text-align:right;">Item/Service</th>
              <th style="padding:10px; text-align:center; width:70px;">Qty</th>
              <th style="padding:10px; text-align:left; width:140px;">Unit Price</th>
              <th style="padding:10px; text-align:left; width:160px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>

      <div style="margin-top:16px; display:flex; justify-content:flex-end;">
        <div style="min-width:260px; border:1px solid #e5e7eb; border-radius:12px; padding:12px;">
          <div style="display:flex; justify-content:space-between; margin:6px 0;">
            <span style="color:#6b7280;">Total Amount</span>
            <span style="font-weight:700;">${escapeHtml(formatToman(total))}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin:6px 0;">
            <span style="color:#6b7280;">Payments Total</span>
            <span>${escapeHtml(formatToman(paymentsTotal))}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin:6px 0; border-top:1px solid #e5e7eb; padding-top:8px;">
            <span style="color:#6b7280;">Balance</span>
            <span style="font-weight:700;">${escapeHtml(formatToman(Math.max(0, total - paymentsTotal)))}</span>
          </div>
        </div>
      </div>

      <div style="margin-top:18px; color:#9ca3af; font-size:12px;">
        Generated with AtomicInvoiceApp
      </div>
    </body>
  </html>
  `;

  // Web has limitations; still try to print to file where supported.
  const file = await Print.printToFileAsync({
    html,
    base64: false,
  });

  return file.uri;
}

export async function shareInvoicePdf(invoice: Invoice): Promise<void> {
  if (Platform.OS === "web") {
    Alert.alert("Limited on web", "In the web version, sharing a PDF from a local path is not supported.");
    return;
  }

  const uri = await generateInvoicePdfFile(invoice);

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    Alert.alert("Sharing not available", "Sharing is not available on this device.");
    return;
  }

  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    dialogTitle: "Share Invoice PDF",
    UTI: "com.adobe.pdf",
  });
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
