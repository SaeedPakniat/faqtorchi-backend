import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { getExchangeRate } from "./exchangeRate.controller";

export const exchangeRateRouter = Router();

exchangeRateRouter.use(requireAuth);
exchangeRateRouter.use(requireRole("SELLER"));

exchangeRateRouter.get("/", getExchangeRate);
