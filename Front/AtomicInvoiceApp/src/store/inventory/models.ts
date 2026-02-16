export type Warehouse = {
  id: string;
  name: string;
  createdAt: string;
};

export type Product = {
  id: string;
  name: string;
  createdAt: string;
};

export type VariantAttributes = {
  color?: string;
  capacity?: string;
  warranty?: string;
  [key: string]: string | undefined;
};

export type ProductVariant = {
  id: string;
  productId: string;
  attributes: VariantAttributes;
  priceToman: number;
  createdAt: string;
};

export type InventoryRecord = {
  warehouseId: string;
  variantId: string;
  qty: number;
  updatedAt: string;
};

export type InventoryState = {
  warehouses: Warehouse[];
  products: Product[];
  variants: ProductVariant[];
  inventory: InventoryRecord[];
  lowStockThreshold: number;
};

export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

export function getVariantTitle(variant: ProductVariant) {
  const parts: string[] = [];
  const { color, capacity, warranty, ...rest } = variant.attributes || {};
  if (color) parts.push(`Color: ${color}`);
  if (capacity) parts.push(`Capacity: ${capacity}`);
  if (warranty) parts.push(`Warranty: ${warranty}`);
  Object.entries(rest).forEach(([k, v]) => {
    if (v) parts.push(`${k}: ${v}`);
  });
  return parts.length ? parts.join(" • ") : "No attributes";
}
