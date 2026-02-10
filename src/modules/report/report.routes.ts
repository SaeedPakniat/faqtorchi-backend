import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { accountsReceivable, lowStock, sales, topProducts } from "./report.controller";

export const reportRouter = Router();

reportRouter.use(requireAuth);
reportRouter.use(requireRole("SELLER"));

reportRouter.get("/sales", sales);
reportRouter.get("/accounts-receivable", accountsReceivable);
reportRouter.get("/top-products", topProducts);
reportRouter.get("/low-stock", lowStock);
