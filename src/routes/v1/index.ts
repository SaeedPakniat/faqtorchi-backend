import { Router } from "express";
import { authRouter } from "../../modules/auth/auth.routes";
import {warehouseRouter} from "../../modules/warehouse/warehouse.routes";


const router = Router();

router.use("/auth", authRouter);
router.use("/warehouses", warehouseRouter);









export default router;
