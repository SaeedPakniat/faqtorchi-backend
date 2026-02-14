import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { requireSellerPermission } from "../../middlewares/requireSellerPermission";
import { cancel, createInstant, createWarehouse, createPdf, getById, getPdf, list } from "./invoice.controller";
import { createPaymentForInvoiceHandler, listPaymentsForInvoiceHandler } from "../payment/payment.controller";

export const invoiceRouter = Router();

invoiceRouter.use(requireAuth);
invoiceRouter.use(requireRole("SELLER", "ADMIN"));
invoiceRouter.use(requireSellerPermission("invoices"));

invoiceRouter.post("/warehouse", createWarehouse);
invoiceRouter.post("/instant", createInstant);
invoiceRouter.get("/", list);
invoiceRouter.get("/:id", getById);
invoiceRouter.post("/:invoiceId/pdf", createPdf);
invoiceRouter.get("/:invoiceId/pdf", getPdf);
invoiceRouter.post("/:invoiceId/cancel", cancel);
invoiceRouter.post("/:invoiceId/payments", createPaymentForInvoiceHandler);
invoiceRouter.get("/:invoiceId/payments", listPaymentsForInvoiceHandler);
