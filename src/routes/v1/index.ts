import { Router } from "express";
import { authRouter } from "../../modules/auth/auth.routes";
import {warehouseRouter} from "../../modules/warehouse/warehouse.routes";
import { productRouter } from "../../modules/product/product.routes";
import { inventoryRouter } from "../../modules/inventory/inventory.routes";
import { invoiceRouter } from "../../modules/invoice/invoice.routes";
import { paymentRouter } from "../../modules/payment/payment.routes";
import { customerRouter } from "../../modules/customer/customer.routes";


const router = Router();

router.use("/auth", authRouter);
router.use("/warehouses", warehouseRouter);
router.use("/products", productRouter);
router.use("/inventory", inventoryRouter);
router.use("/invoices", invoiceRouter);
router.use("/payments", paymentRouter);
router.use("/customers", customerRouter);




export default router;
