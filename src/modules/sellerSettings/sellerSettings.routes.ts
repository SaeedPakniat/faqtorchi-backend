import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { requireSellerPermission } from "../../middlewares/requireSellerPermission";
import {
  getCurrencyHandler,
  getInvoiceTemplateHandler,
  getNotificationSettingsHandler,
  setCurrencyHandler,
  setInvoiceTemplateHandler,
  setNotificationSettingsHandler,
} from "./sellerSettings.controller";

export const sellerSettingsRouter = Router();

sellerSettingsRouter.use(requireAuth);
sellerSettingsRouter.use(requireRole("SELLER", "ADMIN"));
sellerSettingsRouter.use(requireSellerPermission("settings"));

sellerSettingsRouter.get("/invoice-template", getInvoiceTemplateHandler);
sellerSettingsRouter.put("/invoice-template", setInvoiceTemplateHandler);
sellerSettingsRouter.get("/currency", getCurrencyHandler);
sellerSettingsRouter.put("/currency", setCurrencyHandler);
sellerSettingsRouter.get("/notifications", getNotificationSettingsHandler);
sellerSettingsRouter.put("/notifications", setNotificationSettingsHandler);
