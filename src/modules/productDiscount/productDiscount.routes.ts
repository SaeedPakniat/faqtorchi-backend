import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { requireSellerPermission } from "../../middlewares/requireSellerPermission";
import { create, list, remove, update } from "./productDiscount.controller";

export const productDiscountRouter = Router();

productDiscountRouter.use(requireAuth);
productDiscountRouter.use(requireRole("SELLER", "ADMIN"));
productDiscountRouter.use(requireSellerPermission("products"));

productDiscountRouter.get("/", list);
productDiscountRouter.post("/", create);
productDiscountRouter.patch("/:id", update);
productDiscountRouter.delete("/:id", remove);
