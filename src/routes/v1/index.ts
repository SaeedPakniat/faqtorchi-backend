import { Router } from "express";
import { authRouter } from "../../modules/auth/auth.routes";
import {warehouseRouter} from "../../modules/warehouse/warehouse.routes";
import { productRouter } from "../../modules/product/product.routes";
import { inventoryRouter } from "../../modules/inventory/inventory.routes";


const router = Router();

router.use("/auth", authRouter);
router.use("/warehouses", warehouseRouter);
router.use("/products", productRouter);
router.use("/inventory", inventoryRouter);







export default router;
