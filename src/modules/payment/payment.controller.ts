import { Response, NextFunction } from "express";
import { AuthedRequest } from "../../middlewares/requireAuth";
import { getSellerContextOrThrow } from "../sellerMember/sellerMember.service";
import { createPaymentSchema, invoiceIdParamSchema, paymentIdParamSchema } from "./payment.schemas";
import { createPaymentForInvoice, listPaymentsForInvoice, voidPayment } from "./payment.service";

export async function createPaymentForInvoiceHandler(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerContext = await getSellerContextOrThrow(req.user!.id);
        const params = invoiceIdParamSchema.parse(req.params);
        const body = createPaymentSchema.parse(req.body);

        const allowedWarehouseIds = sellerContext.isOwner
            ? undefined
            : sellerContext.permissions?.warehouse
              ? sellerContext.warehouseIds ?? []
              : [];

        const result = await createPaymentForInvoice({
            sellerId: sellerContext.sellerId,
            invoiceId: params.invoiceId,
            allowedWarehouseIds,
            ...body,
        });

        res.status(201).json(result);
    } catch (e) {
        next(e);
    }
}

export async function listPaymentsForInvoiceHandler(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerContext = await getSellerContextOrThrow(req.user!.id);
        const params = invoiceIdParamSchema.parse(req.params);

        const allowedWarehouseIds = sellerContext.isOwner
            ? undefined
            : sellerContext.permissions?.warehouse
              ? sellerContext.warehouseIds ?? []
              : [];

        const result = await listPaymentsForInvoice({
            sellerId: sellerContext.sellerId,
            invoiceId: params.invoiceId,
            allowedWarehouseIds,
        });

        res.json(result);
    } catch (e) {
        next(e);
    }
}

export async function voidPaymentHandler(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerContext = await getSellerContextOrThrow(req.user!.id);
        const params = paymentIdParamSchema.parse(req.params);

        const allowedWarehouseIds = sellerContext.isOwner
            ? undefined
            : sellerContext.permissions?.warehouse
              ? sellerContext.warehouseIds ?? []
              : [];

        const result = await voidPayment({
            sellerId: sellerContext.sellerId,
            paymentId: params.paymentId,
            allowedWarehouseIds,
        });

        res.json(result);
    } catch (e) {
        next(e);
    }
}
