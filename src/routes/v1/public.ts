import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getPublicPdf } from "../../modules/invoice/invoice.controller";
import { listInvoices, requestToken } from "../../modules/publicAccess/publicAccess.controller";

const publicRouter = Router();

const publicLimiter = rateLimit({
    windowMs: 60_000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
});

publicRouter.use(publicLimiter);

publicRouter.get("/invoices/:token/pdf", getPublicPdf);
publicRouter.post("/invoices/request-token", requestToken);
publicRouter.get("/invoices", listInvoices);

export default publicRouter;
