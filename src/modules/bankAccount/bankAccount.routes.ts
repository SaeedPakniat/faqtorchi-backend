import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { requireSellerPermission } from "../../middlewares/requireSellerPermission";
import { list, create, update, remove } from "./bankAccount.controller";

export const bankAccountRouter = Router();

bankAccountRouter.use(requireAuth);
bankAccountRouter.use(requireRole("SELLER", "ADMIN"));
bankAccountRouter.use(requireSellerPermission("settings"));

bankAccountRouter.get("/", list);
bankAccountRouter.post("/", create);
bankAccountRouter.patch("/:id", update);
bankAccountRouter.delete("/:id", remove);
