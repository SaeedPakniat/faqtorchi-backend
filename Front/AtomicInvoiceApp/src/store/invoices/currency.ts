import { Invoice, Payment } from "./models";

export function paymentToInvoiceCurrency(
  invoice: Invoice,
  payment: Payment,
): number {
  // If currencies are the same
  if (payment.currency === invoice.currency) {
    return payment.amount;
  }

  // If invoice is IRR/Toman and payment is foreign currency
  if (invoice.currency === "IRR") {
    if (!invoice.exchangeRateToToman) return 0;
    return payment.amount * invoice.exchangeRateToToman;
  }

  // If invoice is foreign currency and payment is IRR/Toman
  if (payment.currency === "IRR") {
    if (!invoice.exchangeRateToToman) return 0;
    return payment.amount / invoice.exchangeRateToToman;
  }

  // FX to FX (simple for now)
  return payment.amount;
}
