import { Invoice } from "./models";

export function calculateInvoiceTotal(invoice: Invoice): number {
  const itemsTotal = invoice.items.reduce(
    (sum, it) => sum + it.qty * it.unitPrice,
    0,
  );

  let total = itemsTotal;

  // discount
  if (invoice.discount) {
    if (invoice.discount.type === "percent") {
      total -= (total * invoice.discount.value) / 100;
    } else {
      total -= invoice.discount.value;
    }
  }

  // tax
  if (invoice.tax) {
    if (invoice.tax.type === "percent") {
      total += (total * invoice.tax.value) / 100;
    } else {
      total += invoice.tax.value;
    }
  }

  return Math.max(0, Math.round(total));
}
