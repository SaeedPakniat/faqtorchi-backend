export type CurrencyCode = "IRR" | "USD" | "EUR";

export type InvoiceStatus = "paid" | "unpaid" | "overdue";

export type InvoiceItem = {
  id: string;
  name: string;
  qty: number;
  unitPrice: number; // in invoice currency (for now we store toman when IRR)
};

export type Payment = {
  id: string;
  amount: number;
  currency: CurrencyCode;
  paidAt: string; // ISO
  note?: string;
};

// ✅ NEW
export type Installment = {
  id: string;
  amount: number;
  dueAt: string; // ISO
  paidAt?: string; // ISO
  note?: string;
};

// ✅ NEW
export type InvoiceKind = "regular" | "warehouse";

export type Invoice = {
  id: string;

  // ✅ NEW (for the "invoice from warehouse" scenario)
  kind?: InvoiceKind; // default: "regular"
  warehouseId?: string;

  sellerPhone: string;
  customerPhone: string;
  customerName?: string;

  createdAt: string; // ISO
  status: InvoiceStatus;

  currency: CurrencyCode;
  exchangeRateToToman?: number; // when currency != IRR
  discount?: { type: "percent" | "fixed"; value: number };
  tax?: { type: "percent" | "fixed"; value: number };

  // ✅ NEW (for due date/installments)
  dueAt?: string; // ISO
  installments?: Installment[];

  items: InvoiceItem[];
  payments: Payment[];
};
