import { apiGet, apiPatch, apiPost } from "./api";

export type SellerPermissions = {
  invoices: boolean;
  customers: boolean;
  products: boolean;
  settings: boolean;
  warehouse: boolean;
  reports: boolean;
};

export type ApiSellerMember = {
  id: number;
  userId: number;
  name?: string | null;
  phone: string;
  email?: string | null;
  isActive: boolean;
  permissions: SellerPermissions;
  warehouseIds: number[];
};

export type ApiSellerMemberAuditLog = {
  id: number;
  action: string;
  method: string;
  path: string;
  statusCode?: number | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
};

export function listSellerMembers() {
  return apiGet<{ members: ApiSellerMember[] }>("/seller-members");
}

export function getSellerMember(id: number) {
  return apiGet<{ member: ApiSellerMember }>(`/seller-members/${id}`);
}

export function createSellerMember(input: {
  name: string;
  phone: string;
  email?: string | null;
  password: string;
  isActive?: boolean;
  permissions: SellerPermissions;
  warehouseIds: number[];
}) {
  return apiPost<{ member: ApiSellerMember }>("/seller-members", input);
}

export function updateSellerMember(
  id: number,
  input: {
    name?: string;
    phone?: string;
    email?: string | null;
    isActive?: boolean;
    permissions?: Partial<SellerPermissions>;
    warehouseIds?: number[];
  },
) {
  return apiPatch<{ member: ApiSellerMember }>(`/seller-members/${id}`, input);
}

export function setSellerMemberPassword(id: number, password: string) {
  return apiPost<{ ok: true }>(`/seller-members/${id}/password`, { password });
}

export function listSellerMemberAuditLogs(
  id: number,
  params?: { page?: number; pageSize?: number },
) {
  return apiGet<{ logs: ApiSellerMemberAuditLog[]; page: number; pageSize: number; total: number }>(
    `/seller-members/${id}/audit`,
    { query: params },
  );
}
