import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { create, list, update } from "./discountCode.controller";

export const discountCodeRouter = Router();

discountCodeRouter.use(requireAuth);
discountCodeRouter.use(requireRole("SELLER"));

discountCodeRouter.post("/", create);
discountCodeRouter.get("/", list);
discountCodeRouter.patch("/:id", update);
