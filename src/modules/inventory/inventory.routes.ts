import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { adjust, list, listLedger } from "./inventory.controller";

export const inventoryRouter = Router();

inventoryRouter.use(requireAuth);
inventoryRouter.use(requireRole("SELLER"));

inventoryRouter.post("/adjust", adjust);
inventoryRouter.get("/", list);
inventoryRouter.get("/ledger", listLedger);
