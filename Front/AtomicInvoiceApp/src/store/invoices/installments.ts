// src/store/invoices/installments.ts

import { calculateInvoiceTotal } from "./calculations";
import { paymentToInvoiceCurrency } from "./currency";
import type { Installment, Invoice } from "./models";

type CreateInstallmentsParams = {
  total: number;
  count: number;
  firstDueAt: Date;
  intervalDays: number;
};

function uid(prefix = "inst") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

/**
 * Builds installments monthly/daily (without paidPaymentIds).
 */
export function createInstallments(
  params: CreateInstallmentsParams,
): Installment[] {
  const { total, count, firstDueAt, intervalDays } = params;

  const safeCount = Math.max(2, Math.floor(count));
  const base = Math.floor(total / safeCount);
  const remainder = total - base * safeCount;

  const out: Installment[] = [];
  for (let i = 0; i < safeCount; i++) {
    const amount = base + (i === safeCount - 1 ? remainder : 0);
    const due = new Date(firstDueAt);
    due.setDate(due.getDate() + i * intervalDays);

    out.push({
      id: uid("inst"),
      amount,
      dueAt: due.toISOString(),
    });
  }

  return out;
}

/**
 * Splits payments (in invoice currency) across installments and returns a map:
 * installmentId -> paidAmount
 */
export function allocatePaymentsToInstallments(
  invoice: Invoice,
): Record<string, number> {
  const installments = (invoice.installments ?? [])
    .slice()
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));

  const paidMap: Record<string, number> = {};
  installments.forEach((inst) => {
    paidMap[inst.id] = 0;
  });

  // We consider payments in chronological order.
  const paymentsSorted = (invoice.payments ?? [])
    .slice()
    .sort((a, b) => a.paidAt.localeCompare(b.paidAt));

  let paymentPool = 0;
  for (const p of paymentsSorted) {
    paymentPool += paymentToInvoiceCurrency(invoice, p);
  }

  // Spread payments across installments by due date (greedy).
  for (const inst of installments) {
    if (paymentPool <= 0) break;
    const need = Math.max(0, inst.amount - (paidMap[inst.id] ?? 0));
    const give = Math.min(need, paymentPool);
    paidMap[inst.id] = (paidMap[inst.id] ?? 0) + give;
    paymentPool -= give;
  }

  return paidMap;
}

/**
 * Total paid for an installment
 */
export function getInstallmentPaid(
  invoice: Invoice,
  installmentId: string,
): number {
  if (!invoice.installments?.length) return 0;
  const map = allocatePaymentsToInstallments(invoice);
  return map[installmentId] ?? 0;
}

/**
 * Total invoice balance (in invoice currency)
 */
export function getInvoiceRemaining(invoice: Invoice): number {
  const total = calculateInvoiceTotal(invoice);
  const paid = (invoice.payments ?? []).reduce(
    (sum, p) => sum + paymentToInvoiceCurrency(invoice, p),
    0,
  );
  return Math.max(0, total - paid);
}

/**
 * Does the invoice have any overdue amount?
 * If overall dueAt exists => we check it
 * And if there are installments => if any installment is overdue and not fully paid => true
 */
export function isOverdue(invoice: Invoice, now: Date = new Date()): boolean {
  // 1) If we have an overall dueAt
  if (invoice.dueAt) {
    const due = new Date(invoice.dueAt);
    if (due.getTime() < now.getTime() && getInvoiceRemaining(invoice) > 0)
      return true;
  }

  // 2) If we have installments
  if (invoice.installments?.length) {
    const paidMap = allocatePaymentsToInstallments(invoice);
    const sorted = invoice.installments
      .slice()
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt));

    for (const inst of sorted) {
      const due = new Date(inst.dueAt);
      const paid = paidMap[inst.id] ?? 0;
      const remaining = Math.max(0, inst.amount - paid);
      if (due.getTime() < now.getTime() && remaining > 0) return true;
    }
  }

  return false;
}
