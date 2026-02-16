import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { sellerInvoices } from "../../data/invoices";
import { allocatePaymentsToInstallments } from "./allocatePayments";
import { loadInvoices, saveInvoices } from "./invoiceStorage";
import type { Installment, Invoice, InvoiceItem, Payment } from "./models";
import { calculateInvoiceStatus } from "./status";

type AddInvoicePayload = Omit<
  Invoice,
  "id" | "createdAt" | "status" | "payments" | "items"
> & {
  items: Omit<InvoiceItem, "id">[];
};

type AddPaymentPayload = Omit<Payment, "id" | "paidAt">;

type InvoicesContextValue = {
  loading: boolean;
  invoices: Invoice[];

  addInvoice: (invoice: AddInvoicePayload) => Promise<Invoice>;
  addPayment: (invoiceId: string, payment: AddPaymentPayload) => Promise<void>;
  updateInvoiceStatus: (
    invoiceId: string,
    status: Invoice["status"],
  ) => Promise<void>;

  setInvoiceDueAt: (invoiceId: string, dueAt?: string) => Promise<void>;
  setInvoiceInstallments: (
    invoiceId: string,
    installments: Installment[],
  ) => Promise<void>;
};

const InvoicesContext = createContext<InvoicesContextValue | null>(null);

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function seedFromMock(): Invoice[] {
  const sellerPhone = "09120000000";
  const customerPhone = "09130000000";

  return sellerInvoices.map((inv) => {
    const items: InvoiceItem[] = inv.items.map((it, idx) => ({
      id: `${inv.id}_it_${idx}`,
      name: it.name,
      qty: it.qty,
      unitPrice: it.unitPrice,
    }));

    const totalFromItems = items.reduce(
      (s, it) => s + it.qty * it.unitPrice,
      0,
    );

    const payments: Payment[] =
      inv.status === "paid"
        ? [
            {
              id: `${inv.id}_pay_0`,
              amount: inv.total ?? totalFromItems,
              currency: "IRR",
              paidAt: inv.createdAt,
              note: "Test payment",
            },
          ]
        : [];

    const seeded: Invoice = {
      id: inv.id,
      kind: "regular",
      sellerPhone,
      customerPhone,
      customerName: inv.customerName,
      createdAt: inv.createdAt,
      status: inv.status as Invoice["status"],

      currency: "IRR",
      exchangeRateToToman: undefined,
      discount: undefined,
      tax: undefined,

      dueAt: undefined,
      installments: [],

      items,
      payments,
    };

    return { ...seeded, status: calculateInvoiceStatus(seeded) };
  });
}

export function InvoicesProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const stored = await loadInvoices();
        if (!mounted) return;

        const initial = stored.length ? stored : seedFromMock();

        // ✅ normalize old stored invoices
        setInvoices(
          initial.map((inv) => ({
            ...inv,
            kind: inv.kind ?? "regular",
            installments: inv.installments ?? [],
            status: calculateInvoiceStatus(inv),
          })),
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    saveInvoices(invoices);
  }, [invoices, loading]);

  const addInvoice: InvoicesContextValue["addInvoice"] = async (payload) => {
    const now = new Date().toISOString();

    const invoice: Invoice = {
      id: uid("inv"),
      createdAt: now,
      payments: [],
      status: "unpaid",

      // defaults for new fields
      kind: payload.kind ?? "regular",
      installments: payload.installments ?? [],

      ...payload,

      // items with generated ids
      items: payload.items.map((it) => ({ ...it, id: uid("item") })),
    };

    const normalized: Invoice = {
      ...invoice,
      status: calculateInvoiceStatus(invoice),
    };

    setInvoices((prev) => [normalized, ...prev]);
    return normalized;
  };

  const addPayment: InvoicesContextValue["addPayment"] = async (
    invoiceId,
    paymentInput,
  ) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv;

        const payment: Payment = {
          id: uid("pay"),
          paidAt: new Date().toISOString(),
          ...paymentInput,
        };

        // const updated: Invoice = {
        //   ...inv,
        //   payments: [...inv.payments, payment],
        // };
        const updated: Invoice = {
          ...inv,
          payments: [...inv.payments, payment],
        };

        // ✅ Allocate payment to installments (if any)
        const allocated = allocatePaymentsToInstallments(updated);

        return {
          ...allocated,
          status: calculateInvoiceStatus(allocated),
        };
      }),
    );
  };

  const updateInvoiceStatus: InvoicesContextValue["updateInvoiceStatus"] =
    async (invoiceId, status) => {
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === invoiceId ? { ...inv, status } : inv)),
      );
    };

  const setInvoiceDueAt: InvoicesContextValue["setInvoiceDueAt"] = async (
    invoiceId,
    dueAt,
  ) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv;
        const updated: Invoice = { ...inv, dueAt };
        return { ...updated, status: calculateInvoiceStatus(updated) };
      }),
    );
  };

  const setInvoiceInstallments: InvoicesContextValue["setInvoiceInstallments"] =
    async (invoiceId, installments) => {
      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.id !== invoiceId) return inv;
          const updated: Invoice = { ...inv, installments };
          return { ...updated, status: calculateInvoiceStatus(updated) };
        }),
      );
    };

  const value = useMemo(
    () => ({
      loading,
      invoices,
      addInvoice,
      addPayment,
      updateInvoiceStatus,
      setInvoiceDueAt,
      setInvoiceInstallments,
    }),
    [loading, invoices],
  );

  return (
    <InvoicesContext.Provider value={value}>
      {children}
    </InvoicesContext.Provider>
  );
}

export function useInvoices() {
  const ctx = useContext(InvoicesContext);
  if (!ctx) throw new Error("useInvoices must be used inside InvoicesProvider");
  return ctx;
}
