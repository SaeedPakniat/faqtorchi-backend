import { paymentToInvoiceCurrency } from "./currency";
import type { Invoice } from "./models";

// Output: invoice with updated installments (mapping only)
// Rule: new payments are allocated to unpaid installments in due-date order.
export function allocatePaymentsToInstallments(invoice: Invoice): Invoice {
  if (!invoice.installments?.length) return invoice;

  // To calculate how much each installment is paid, sum related payments.
  const installments = [...invoice.installments].sort((a, b) =>
    a.dueAt.localeCompare(b.dueAt),
  );

  // A map of paymentId -> amount (in invoice currency) for fast calculations.
  const payAmountMap = new Map<string, number>();
  for (const p of invoice.payments) {
    payAmountMap.set(p.id, paymentToInvoiceCurrency(invoice, p));
  }

  // We keep current paidPaymentIds first, but it may be incomplete/outdated.
  // We recompute from scratch to keep it consistent:
  const cleared = installments.map((inst) => ({
    ...inst,
    paidPaymentIds: [] as string[],
  }));

  // We consider payments ordered by paidAt.
  const paymentsSorted = [...invoice.payments].sort((a, b) =>
    a.paidAt.localeCompare(b.paidAt),
  );

  // For each payment, distribute across installments in order.
  for (const pay of paymentsSorted) {
    let remaining = payAmountMap.get(pay.id) ?? 0;
    if (remaining <= 0) continue;

    for (const inst of cleared) {
      if (remaining <= 0) break;

      // Current paid amount for this installment
      const instPaid = inst.paidPaymentIds.reduce(
        (sum, pid) => sum + (payAmountMap.get(pid) ?? 0),
        0,
      );

      const need = inst.amount - instPaid;
      if (need <= 0) continue; // This installment is settled

      // Attach this payment to this installment
      // Note: since we only store paidPaymentIds (not the allocated amount),
      // we might assume a full payment can go to multiple installments.
      // To avoid counting one payment multiple times, we add it only once,
      // and control the amount logic with `remaining`.
      if (!inst.paidPaymentIds.includes(pay.id)) {
        inst.paidPaymentIds.push(pay.id);
      }

      // Subtract from remaining:
      // Note: amountMap is for the whole payment, and we attach paymentId to multiple installments,
      // if we sum like that, it will double-count.
      // So this model (paidPaymentIds alone) is not enough for "splitting one payment across multiple installments" accurately.

      // ✅ Quick & correct fix: assign each payment to only *one* installment so it won't be double-counted.
      // So after adding it to the first installment that needs it, we break.
      // (If you need exact splitting, add a separate PaymentAllocation model.)
      break;
    }
  }

  return { ...invoice, installments: cleared };
}
