import { apiDelete, apiGet, apiPatch, apiPost } from "./api";

export type ApiWarehouse = {
  id: number;
  name: string;
  location?: string | null;
  createdAt?: string;
};

export type ApiVariant = {
  id: number;
  productId?: number;
  sku: string;
  price: string | number;
  attributes?: Record<string, any> | null;
  createdAt?: string;
};

export type ApiProduct = {
  id: number;
  name: string;
  description?: string | null;
  createdAt?: string;
  variants: ApiVariant[];
};

export type ApiInventory = {
  id: number;
  warehouseId: number;
  variantId: number;
  quantity: number;
  updatedAt?: string;
  variant?: {
    id: number;
    sku: string;
    price: string | number;
    attributes?: Record<string, any> | null;
    product: { id: number; name: string };
  };
};

export function listWarehouses() {
  return apiGet<{ warehouses: ApiWarehouse[] }>("/warehouses");
}

export function createWarehouse(input: { name: string; location?: string }) {
  return apiPost<{ warehouse: ApiWarehouse }>("/warehouses", input);
}

export function updateWarehouse(id: number, input: { name?: string; location?: string | null }) {
  return apiPatch<{ warehouse: ApiWarehouse }>(`/warehouses/${id}`, input);
}

export function deleteWarehouse(id: number) {
  return apiDelete<{ ok: true }>(`/warehouses/${id}`);
}

export function listProducts() {
  return apiGet<{ products: ApiProduct[] }>("/products");
}

export function createProduct(input: { name: string; description?: string }) {
  return apiPost<{ product: ApiProduct }>("/products", input);
}

export function updateProduct(
  id: number,
  input: { name?: string; description?: string | null },
) {
  return apiPatch<{ product: ApiProduct }>(`/products/${id}`, input);
}

export function deleteProduct(id: number) {
  return apiDelete<{ ok: true }>(`/products/${id}`);
}

export function addVariant(
  productId: number,
  input: { sku: string; price: number | string; attributes?: Record<string, any> }
) {
  return apiPost<{ variant: ApiVariant }>(`/products/${productId}/variants`, input);
}

export function updateVariant(
  productId: number,
  variantId: number,
  input: { sku?: string; price?: number | string; attributes?: Record<string, any> | null },
) {
  return apiPatch<{ variant: ApiVariant }>(
    `/products/${productId}/variants/${variantId}`,
    input,
  );
}

export function deleteVariant(productId: number, variantId: number) {
  return apiDelete<{ ok: true }>(`/products/${productId}/variants/${variantId}`);
}

export function listInventory(warehouseId: number) {
  return apiGet<{ inventory: ApiInventory[] }>(`/inventory?warehouseId=${warehouseId}`);
}

export function adjustInventory(input: { warehouseId: number; variantId: number; delta: number; note?: string }) {
  return apiPost<{ inventory: ApiInventory }>("/inventory/adjust", input);
}

export function listInventoryLedger(inventoryId: number) {
  return apiGet<{ ledger: any[] }>(`/inventory/ledger?inventoryId=${inventoryId}`);
}

export function toNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}
