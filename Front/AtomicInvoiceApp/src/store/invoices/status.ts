import { calculateInvoiceTotal } from "./calculations";
import { paymentToInvoiceCurrency } from "./currency";
import { isOverdue } from "./installments";
import type { Invoice } from "./models";

export function calculateInvoiceStatus(
  invoice: Invoice,
): "paid" | "unpaid" | "overdue" {
  const total = calculateInvoiceTotal(invoice);

  const paid = invoice.payments.reduce((sum, p) => {
    return sum + paymentToInvoiceCurrency(invoice, p);
  }, 0);

  if (paid >= total) return "paid";
  if (isOverdue(invoice)) return "overdue";
  return "unpaid";
}
