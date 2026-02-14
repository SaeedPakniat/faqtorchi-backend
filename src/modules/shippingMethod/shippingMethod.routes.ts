import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { requireSellerPermission } from "../../middlewares/requireSellerPermission";
import { list, create, update, remove } from "./shippingMethod.controller";

export const shippingMethodRouter = Router();

shippingMethodRouter.use(requireAuth);
shippingMethodRouter.use(requireRole("SELLER", "ADMIN"));
shippingMethodRouter.use(requireSellerPermission("settings"));

shippingMethodRouter.get("/", list);
shippingMethodRouter.post("/", create);
shippingMethodRouter.patch("/:id", update);
shippingMethodRouter.delete("/:id", remove);
