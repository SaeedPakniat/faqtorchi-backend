import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { requireSellerPermission } from "../../middlewares/requireSellerPermission";
import { cancel, createForInvoice, listForInvoice } from "./reminder.controller";

export const reminderRouter = Router();

reminderRouter.use(requireAuth);
reminderRouter.use(requireRole("SELLER", "ADMIN"));
reminderRouter.use(requireSellerPermission("invoices"));

reminderRouter.post("/invoices/:invoiceId/reminders", createForInvoice);
reminderRouter.get("/invoices/:invoiceId/reminders", listForInvoice);
reminderRouter.post("/reminders/:reminderId/cancel", cancel);
