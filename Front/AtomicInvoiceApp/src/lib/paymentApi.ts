import { apiPost } from "./api";

export function voidPayment(paymentId: number) {
  return apiPost<{ payment: any }>(`/payments/${paymentId}/void`);
}
