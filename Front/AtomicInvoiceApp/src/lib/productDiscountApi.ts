import { apiDelete, apiGet, apiPatch, apiPost } from "./api";

export type ApiProductDiscount = {
  id: number;
  sellerId?: number;
  productId?: number | null;
  variantId?: number | null;
  type: "PERCENT" | "FIXED";
  value: string | number;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export function listProductDiscounts(params?: {
  productId?: number;
  variantId?: number;
  isActive?: boolean;
}) {
  return apiGet<{ discounts: ApiProductDiscount[] }>("/product-discounts", {
    query: params,
  });
}

export function createProductDiscount(input: {
  productId?: number;
  variantId?: number;
  type: "PERCENT" | "FIXED";
  value: number;
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
}) {
  return apiPost<{ discount: ApiProductDiscount }>("/product-discounts", input);
}

export function updateProductDiscount(
  id: number,
  input: {
    productId?: number;
    variantId?: number;
    type?: "PERCENT" | "FIXED";
    value?: number;
    startsAt?: string;
    endsAt?: string;
    isActive?: boolean;
  },
) {
  return apiPatch<{ discount: ApiProductDiscount }>(
    `/product-discounts/${id}`,
    input,
  );
}

export function deleteProductDiscount(id: number) {
  return apiDelete<{ ok: true }>(`/product-discounts/${id}`);
}
