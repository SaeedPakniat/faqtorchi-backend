import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { requireSellerPermission } from "../../middlewares/requireSellerPermission";
import { getExchangeRate } from "./exchangeRate.controller";

export const exchangeRateRouter = Router();

exchangeRateRouter.use(requireAuth);
exchangeRateRouter.use(requireRole("SELLER", "ADMIN"));
exchangeRateRouter.use(requireSellerPermission("settings"));

exchangeRateRouter.get("/", getExchangeRate);
