import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { getInvoice, listInvoices, login, register } from "./customerPortal.controller";

export const customerPortalRouter = Router();

customerPortalRouter.post("/register", register);
customerPortalRouter.post("/login", login);

customerPortalRouter.get("/invoices", requireAuth, requireRole("USER"), listInvoices);
customerPortalRouter.get("/invoices/:id", requireAuth, requireRole("USER"), getInvoice);
