import { apiGet } from "./api";

export function getSalesReport(params?: { from?: string; to?: string }) {
  return apiGet("/reports/sales", { query: params });
}

export function getDiscountsReport(params?: { from?: string; to?: string }) {
  return apiGet("/reports/discounts", { query: params });
}

export function getAccountsReceivableReport() {
  return apiGet("/reports/accounts-receivable");
}

export function getTopProductsReport(params?: { limit?: number }) {
  return apiGet("/reports/top-products", { query: params });
}

export function getLowStockReport(params?: { threshold?: number; warehouseId?: number }) {
  return apiGet("/reports/low-stock", { query: params });
}
