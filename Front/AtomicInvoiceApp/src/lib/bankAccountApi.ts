import { apiDelete, apiGet, apiPatch, apiPost } from "./api";

export type ApiBankAccount = {
  id: number;
  name: string;
  accountNumber: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export function listBankAccounts() {
  return apiGet<{ accounts: ApiBankAccount[] }>("/bank-accounts");
}

export function createBankAccount(input: {
  name: string;
  accountNumber: string;
  isActive?: boolean;
}) {
  return apiPost<{ account: ApiBankAccount }>("/bank-accounts", input);
}

export function updateBankAccount(
  id: number,
  input: { name?: string; accountNumber?: string; isActive?: boolean },
) {
  return apiPatch<{ account: ApiBankAccount }>(`/bank-accounts/${id}`, input);
}

export function deleteBankAccount(id: number) {
  return apiDelete<{ ok: true }>(`/bank-accounts/${id}`);
}
