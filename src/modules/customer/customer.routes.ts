import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { create, getById, list } from "./customer.controller";

export const customerRouter = Router();

customerRouter.use(requireAuth);
customerRouter.use(requireRole("SELLER"));

customerRouter.post("/", create);
customerRouter.get("/", list);
customerRouter.get("/:customerId", getById);
