import { apiDelete, apiGet, apiPatch, apiPost } from "./api";

export type ApiShippingMethod = {
  id: number;
  name: string;
  price: string | number;
  currency?: "IRR" | "IRT" | "USD" | "EUR";
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export function listShippingMethods() {
  return apiGet<{ methods: ApiShippingMethod[] }>("/shipping-methods");
}

export function createShippingMethod(input: {
  name: string;
  price: number;
  currency?: "IRR" | "IRT" | "USD" | "EUR";
  isActive?: boolean;
}) {
  return apiPost<{ method: ApiShippingMethod }>("/shipping-methods", input);
}

export function updateShippingMethod(
  id: number,
  input: {
    name?: string;
    price?: number;
    currency?: "IRR" | "IRT" | "USD" | "EUR";
    isActive?: boolean;
  },
) {
  return apiPatch<{ method: ApiShippingMethod }>(
    `/shipping-methods/${id}`,
    input,
  );
}

export function deleteShippingMethod(id: number) {
  return apiDelete<{ ok: true }>(`/shipping-methods/${id}`);
}
