import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { createWarehouse, getById, list } from "./invoice.controller";
import { createPaymentForInvoiceHandler, listPaymentsForInvoiceHandler } from "../payment/payment.controller";

export const invoiceRouter = Router();

invoiceRouter.use(requireAuth);
invoiceRouter.use(requireRole("SELLER"));

invoiceRouter.post("/warehouse", createWarehouse);
invoiceRouter.get("/", list);
invoiceRouter.get("/:id", getById);
invoiceRouter.post("/:invoiceId/payments", createPaymentForInvoiceHandler);
invoiceRouter.get("/:invoiceId/payments", listPaymentsForInvoiceHandler);
