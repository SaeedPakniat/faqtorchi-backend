export type InvoiceStatus = "paid" | "unpaid" | "overdue" | "canceled";

export type Invoice = {
  id: string;
  customerName: string;
  total: number; // Toman
  currency?: "IRR" | "IRT" | "USD" | "EUR";
  exchangeRateToToman?: number;
  createdAt: string; // ISO
  status: InvoiceStatus;
  items: { name: string; qty: number; unitPrice: number }[];
};

export const sellerInvoices: Invoice[] = [
  {
    id: "1021",
    customerName: "Ali Rezaei",
    total: 2300000,
    createdAt: "2026-01-04T10:20:00.000Z",
    status: "unpaid",
    items: [
      { name: "Type-C Cable", qty: 2, unitPrice: 250000 },
      { name: "Power Bank", qty: 1, unitPrice: 1800000 },
    ],
  },
  {
    id: "1020",
    customerName: "Sara Mohammadi",
    total: 980000,
    createdAt: "2026-01-03T16:10:00.000Z",
    status: "paid",
    items: [{ name: "Earphones", qty: 1, unitPrice: 980000 }],
  },
  {
    id: "1019",
    customerName: "Mohammad Karimi",
    total: 1250000,
    createdAt: "2025-12-28T12:00:00.000Z",
    status: "overdue",
    items: [{ name: "64GB Flash Drive", qty: 2, unitPrice: 625000 }],
  },
];
