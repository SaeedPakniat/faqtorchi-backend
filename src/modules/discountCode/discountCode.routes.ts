import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { requireSellerPermission } from "../../middlewares/requireSellerPermission";
import { create, list, update } from "./discountCode.controller";

export const discountCodeRouter = Router();

discountCodeRouter.use(requireAuth);
discountCodeRouter.use(requireRole("SELLER", "ADMIN"));
discountCodeRouter.use(requireSellerPermission("settings"));

discountCodeRouter.post("/", create);
discountCodeRouter.get("/", list);
discountCodeRouter.patch("/:id", update);
