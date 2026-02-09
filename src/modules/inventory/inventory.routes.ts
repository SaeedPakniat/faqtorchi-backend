import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { adjust } from "./inventory.controller";

export const inventoryRouter = Router();

inventoryRouter.use(requireAuth);
inventoryRouter.use(requireRole("SELLER", "ADMIN"));

inventoryRouter.post("/adjust", adjust);
