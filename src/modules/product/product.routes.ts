import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { addVariant, create, list } from "./product.controller";

export const productRouter = Router();

productRouter.use(requireAuth);
productRouter.use(requireRole("SELLER", "ADMIN"));

productRouter.post("/", create);
productRouter.get("/", list);
productRouter.post("/:productId/variants", addVariant);
