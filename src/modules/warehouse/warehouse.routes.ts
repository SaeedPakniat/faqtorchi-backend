import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { create, list } from "./warehouse.controller";

export const warehouseRouter = Router();

warehouseRouter.use(requireAuth);
warehouseRouter.use(requireRole("SELLER", "ADMIN"));

warehouseRouter.post("/", create);
warehouseRouter.get("/", list);
