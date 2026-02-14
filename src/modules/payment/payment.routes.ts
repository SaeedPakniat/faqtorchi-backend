import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { requireSellerPermission } from "../../middlewares/requireSellerPermission";
import { voidPaymentHandler } from "./payment.controller";

export const paymentRouter = Router();

paymentRouter.use(requireAuth);
paymentRouter.use(requireRole("SELLER", "ADMIN"));
paymentRouter.use(requireSellerPermission("invoices"));

paymentRouter.post("/:paymentId/void", voidPaymentHandler);
