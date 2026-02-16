import { apiGet, apiPatch, apiPost } from "./api";

export type ApiDiscountCode = {
  id: number;
  code: string;
  type: "PERCENT" | "FIXED";
  value: string | number;
  variantId?: number | null;
  maxUses?: number | null;
  uses?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive?: boolean | null;
  createdAt?: string;
};

export function listDiscountCodes(params?: { active?: boolean }) {
  return apiGet<{ discounts: ApiDiscountCode[] }>("/discount-codes", {
    query: params,
  });
}

export function createDiscountCode(input: {
  code?: string;
  type: "PERCENT" | "FIXED";
  value: number | string;
  variantId?: number;
  maxUses?: number;
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
}) {
  return apiPost<{ discount: ApiDiscountCode }>("/discount-codes", input);
}

export function updateDiscountCode(
  id: number,
  input: { isActive?: boolean; maxUses?: number; endsAt?: string },
) {
  return apiPatch<{ discount: ApiDiscountCode }>(`/discount-codes/${id}`, input);
}
