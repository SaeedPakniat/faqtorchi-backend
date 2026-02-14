import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { requireSellerPermission } from "../../middlewares/requireSellerPermission";
import { create, list, remove, update } from "./warehouse.controller";

export const warehouseRouter = Router();

warehouseRouter.use(requireAuth);
warehouseRouter.use(requireRole("SELLER", "ADMIN"));
warehouseRouter.use(requireSellerPermission("warehouse"));

warehouseRouter.post("/", create);
warehouseRouter.get("/", list);
warehouseRouter.patch("/:id", update);
warehouseRouter.delete("/:id", remove);
