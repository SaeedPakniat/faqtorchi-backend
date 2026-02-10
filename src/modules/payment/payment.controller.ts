import { Response, NextFunction } from "express";
import { AuthedRequest } from "../../middlewares/requireAuth";
import { getSellerProfileIdOrThrow } from "../seller/seller.service";
import { serializeBigInt } from "../../utils/bigint";
import { createPaymentSchema, invoiceIdParamSchema, paymentIdParamSchema } from "./payment.schemas";
import { createPaymentForInvoice, listPaymentsForInvoice, voidPayment } from "./payment.service";

export async function createPaymentForInvoiceHandler(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const params = invoiceIdParamSchema.parse(req.params);
        const body = createPaymentSchema.parse(req.body);

        const result = await createPaymentForInvoice({
            sellerId,
            invoiceId: params.invoiceId,
            ...body,
        });

        res.status(201).json(serializeBigInt(result));
    } catch (e) {
        next(e);
    }
}

export async function listPaymentsForInvoiceHandler(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const params = invoiceIdParamSchema.parse(req.params);

        const result = await listPaymentsForInvoice({
            sellerId,
            invoiceId: params.invoiceId,
        });

        res.json(serializeBigInt(result));
    } catch (e) {
        next(e);
    }
}

export async function voidPaymentHandler(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const params = paymentIdParamSchema.parse(req.params);

        const result = await voidPayment({
            sellerId,
            paymentId: params.paymentId,
        });

        res.json(serializeBigInt(result));
    } catch (e) {
        next(e);
    }
}
