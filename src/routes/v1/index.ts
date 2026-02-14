import { Router } from "express";
import { authRouter } from "../../modules/auth/auth.routes";
import {warehouseRouter} from "../../modules/warehouse/warehouse.routes";
import { productRouter } from "../../modules/product/product.routes";
import { inventoryRouter } from "../../modules/inventory/inventory.routes";
import { invoiceRouter } from "../../modules/invoice/invoice.routes";
import { paymentRouter } from "../../modules/payment/payment.routes";
import { customerRouter } from "../../modules/customer/customer.routes";
import { customerPortalRouter } from "../../modules/customerPortal/customerPortal.routes";
import { sellerMemberRouter } from "../../modules/sellerMember/sellerMember.routes";
import { exchangeRateRouter } from "../../modules/exchangeRate/exchangeRate.routes";
import { discountCodeRouter } from "../../modules/discountCode/discountCode.routes";
import { reminderRouter } from "../../modules/reminder/reminder.routes";
import { reportRouter } from "../../modules/report/report.routes";
import publicRouter from "./public";
import { meRouter } from "./me";


const router = Router();

router.use("/auth", authRouter);
router.use("/warehouses", warehouseRouter);
router.use("/products", productRouter);
router.use("/inventory", inventoryRouter);
router.use("/invoices", invoiceRouter);
router.use("/payments", paymentRouter);
router.use("/customers", customerRouter);
router.use("/seller-members", sellerMemberRouter);
router.use("/customer", customerPortalRouter);
router.use("/discount-codes", discountCodeRouter);
router.use("/exchange-rates", exchangeRateRouter);
router.use("/reports", reportRouter);
router.use("/public", publicRouter);
router.use("/", meRouter);
router.use("/", reminderRouter);




export default router;
