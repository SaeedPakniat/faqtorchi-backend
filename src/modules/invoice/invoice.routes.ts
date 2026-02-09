import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { createWarehouse } from "./invoice.controller";

export const invoiceRouter = Router();

invoiceRouter.use(requireAuth);
invoiceRouter.use(requireRole("SELLER", "ADMIN"));

invoiceRouter.post("/warehouse", createWarehouse);

