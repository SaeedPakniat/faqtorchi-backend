export function formatToman(amount: number) {
  // Thousands separator
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " Toman";
}

export function formatDate(iso: string) {
  // Simple: YYYY-MM-DD
  return iso.slice(0, 10);
}

export function statusLabel(status: "paid" | "unpaid" | "overdue" | "canceled") {
  if (status === "paid") return "Paid";
  if (status === "unpaid") return "Unpaid";
  if (status === "canceled") return "Canceled";
  return "Overdue";
}
