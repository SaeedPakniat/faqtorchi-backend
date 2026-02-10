import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { voidPaymentHandler } from "./payment.controller";

export const paymentRouter = Router();

paymentRouter.use(requireAuth);
paymentRouter.use(requireRole("SELLER"));

paymentRouter.post("/:paymentId/void", voidPaymentHandler);
