import { apiGet } from "./api";

export type SellerPermissions = {
  invoices: boolean;
  customers: boolean;
  products: boolean;
  settings: boolean;
  warehouse: boolean;
  reports: boolean;
};

export type SellerContext = {
  sellerId: number;
  isOwner: boolean;
  memberId?: number;
  permissions?: SellerPermissions;
  warehouseIds?: number[];
};

export type MeResponse = {
  user: {
    id: number;
    phone: string;
    role: string;
    isActive: boolean;
    email?: string | null;
    name?: string | null;
  };
  seller?: SellerContext;
};

export function getMe() {
  return apiGet<MeResponse>("/me");
}
