import { Response, NextFunction } from "express";
import { AuthedRequest } from "../../middlewares/requireAuth";
import { getSellerProfileIdOrThrow } from "../seller/seller.service";
import { assertWarehouseAccess, getSellerContextOrThrow } from "../sellerMember/sellerMember.service";
import {
    cancelInvoiceParamSchema,
    createInstantInvoiceSchema,
    createWarehouseInvoiceSchema,
    invoiceIdParamSchema,
    invoicePdfParamSchema,
    listInvoicesSchema,
    publicInvoicePdfParamSchema,
} from "./invoice.schemas";
import {
    cancelInvoice,
    createInstantInvoice,
    createWarehouseInvoice,
    generateInvoicePdf,
    assertInvoiceWarehouseAccess,
    getInvoiceById,
    getInvoicePdfByToken,
    getInvoicePdfForSeller,
    listInvoices,
    notifyInvoiceIssued,
} from "./invoice.service";

export async function createWarehouse(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const input = createWarehouseInvoiceSchema.parse(req.body);

        await assertWarehouseAccess(req.user!.id, input.warehouseId);

        const result = await createWarehouseInvoice({
            sellerId,
            warehouseId: input.warehouseId,
            createdByUserId: req.user!.id,
            currency: input.currency,
            customerId: input.customerId,
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            discountCode: input.discountCode,
            discount: input.discount,
            discountPercent: input.discountPercent,
            tax: input.tax,
            taxPercent: input.taxPercent,
            extra: input.extra,
            items: input.items,
        });

        try {
            await generateInvoicePdf({ sellerId, invoiceId: result.invoice.id });
            await notifyInvoiceIssued({ sellerId, invoiceId: result.invoice.id });
        } catch (err) {
            console.warn("Invoice post-create tasks failed", err);
        }

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
            discountCode: input.discountCode,
            discount: input.discount,
            discountPercent: input.discountPercent,
            tax: input.tax,
            taxPercent: input.taxPercent,
            extra: input.extra,
            items: input.items,
        });

        try {
            await generateInvoicePdf({ sellerId, invoiceId: result.invoice.id });
            await notifyInvoiceIssued({ sellerId, invoiceId: result.invoice.id });
        } catch (err) {
            console.warn("Invoice post-create tasks failed", err);
        }

        res.status(201).json(result);
    } catch (e) {
        next(e);
    }
}

export async function getById(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerContext = await getSellerContextOrThrow(req.user!.id);
        const params = invoiceIdParamSchema.parse(req.params);

        const allowedWarehouseIds = sellerContext.isOwner
            ? undefined
            : sellerContext.permissions?.warehouse
              ? sellerContext.warehouseIds ?? []
              : [];

        const result = await getInvoiceById({
            sellerId: sellerContext.sellerId,
            invoiceId: params.id,
            allowedWarehouseIds,
        });

        res.json(result);
    } catch (e) {
        next(e);
    }
}

export async function list(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerContext = await getSellerContextOrThrow(req.user!.id);
        const query = listInvoicesSchema.parse(req.query);

        const allowedWarehouseIds = sellerContext.isOwner
            ? undefined
            : sellerContext.permissions?.warehouse
              ? sellerContext.warehouseIds ?? []
              : [];

        const result = await listInvoices({
            sellerId: sellerContext.sellerId,
            allowedWarehouseIds,
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

export async function createPdf(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerContext = await getSellerContextOrThrow(req.user!.id);
        const params = invoicePdfParamSchema.parse(req.params);

        const allowedWarehouseIds = sellerContext.isOwner
            ? undefined
            : sellerContext.permissions?.warehouse
              ? sellerContext.warehouseIds ?? []
              : [];

        await assertInvoiceWarehouseAccess({
            sellerId: sellerContext.sellerId,
            invoiceId: params.invoiceId,
            allowedWarehouseIds,
        });

        const result = await generateInvoicePdf({
            sellerId: sellerContext.sellerId,
            invoiceId: params.invoiceId,
        });

        res.json(result);
    } catch (e) {
        next(e);
    }
}

export async function getPdf(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerContext = await getSellerContextOrThrow(req.user!.id);
        const params = invoicePdfParamSchema.parse(req.params);

        const allowedWarehouseIds = sellerContext.isOwner
            ? undefined
            : sellerContext.permissions?.warehouse
              ? sellerContext.warehouseIds ?? []
              : [];

        await assertInvoiceWarehouseAccess({
            sellerId: sellerContext.sellerId,
            invoiceId: params.invoiceId,
            allowedWarehouseIds,
        });

        const { fullPath, fileName } = await getInvoicePdfForSeller({
            sellerId: sellerContext.sellerId,
            invoiceId: params.invoiceId,
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename=\"${fileName}\"`);
        res.setHeader("Cache-Control", "no-store");
        res.sendFile(fullPath);
    } catch (e) {
        next(e);
    }
}

export async function getPublicPdf(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const params = publicInvoicePdfParamSchema.parse(req.params);
        const { fullPath, fileName } = await getInvoicePdfByToken({ token: params.token });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename=\"${fileName}\"`);
        res.setHeader("Cache-Control", "no-store");
        res.sendFile(fullPath);
    } catch (e) {
        next(e);
    }
}
