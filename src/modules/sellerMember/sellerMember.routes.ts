import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { requireSellerPermission } from "../../middlewares/requireSellerPermission";
import { create, getById, list, listAudit, setPassword, update } from "./sellerMember.controller";

export const sellerMemberRouter = Router();

sellerMemberRouter.use(requireAuth);
sellerMemberRouter.use(requireRole("SELLER", "ADMIN"));
sellerMemberRouter.use(requireSellerPermission("settings"));

sellerMemberRouter.get("/", list);
sellerMemberRouter.get("/:id", getById);
sellerMemberRouter.get("/:id/audit", listAudit);
sellerMemberRouter.post("/", create);
sellerMemberRouter.patch("/:id", update);
sellerMemberRouter.post("/:id/password", setPassword);
