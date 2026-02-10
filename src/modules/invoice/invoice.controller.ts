import { Response, NextFunction } from "express";
import { AuthedRequest } from "../../middlewares/requireAuth";
import { getSellerProfileIdOrThrow } from "../seller/seller.service";
import {
    cancelInvoiceParamSchema,
    createInstantInvoiceSchema,
    createWarehouseInvoiceSchema,
    invoiceIdParamSchema,
    listInvoicesSchema,
} from "./invoice.schemas";
import { cancelInvoice, createInstantInvoice, createWarehouseInvoice, getInvoiceById, listInvoices } from "./invoice.service";

export async function createWarehouse(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const input = createWarehouseInvoiceSchema.parse(req.body);

        const result = await createWarehouseInvoice({
            sellerId,
            warehouseId: input.warehouseId,
            createdByUserId: req.user!.id,
            currency: input.currency,
            customerId: input.customerId,
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            discount: input.discount,
            tax: input.tax,
            items: input.items,
        });

        res.status(201).json(result);
    } catch (e) {
        next(e);
    }
}

export async function createInstant(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const input = createInstantInvoiceSchema.parse(req.body);

        const result = await createInstantInvoice({
            sellerId,
            createdByUserId: req.user!.id,
            currency: input.currency,
            customerId: input.customerId,
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            discount: input.discount,
            tax: input.tax,
            items: input.items,
        });

        res.status(201).json(result);
    } catch (e) {
        next(e);
    }
}

export async function getById(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const params = invoiceIdParamSchema.parse(req.params);

        const result = await getInvoiceById({
            sellerId,
            invoiceId: params.id,
        });

        res.json(result);
    } catch (e) {
        next(e);
    }
}

export async function list(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const query = listInvoicesSchema.parse(req.query);

        const result = await listInvoices({
            sellerId,
            ...query,
        });

        res.json(result);
    } catch (e) {
        next(e);
    }
}

export async function cancel(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const params = cancelInvoiceParamSchema.parse(req.params);

        const result = await cancelInvoice({
            sellerId,
            invoiceId: params.invoiceId,
        });

        res.json(result);
    } catch (e) {
        next(e);
    }
}
