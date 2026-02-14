import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { requireSellerPermission } from "../../middlewares/requireSellerPermission";
import { accountsReceivable, discounts, lowStock, sales, topProducts } from "./report.controller";

export const reportRouter = Router();

reportRouter.use(requireAuth);
reportRouter.use(requireRole("SELLER", "ADMIN"));
reportRouter.use(requireSellerPermission("reports"));

reportRouter.get("/sales", sales);
reportRouter.get("/discounts", discounts);
reportRouter.get("/accounts-receivable", accountsReceivable);
reportRouter.get("/top-products", topProducts);
reportRouter.get("/low-stock", lowStock);
