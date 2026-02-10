import { Response, NextFunction } from "express";
import { AuthedRequest } from "../../middlewares/requireAuth";
import { getSellerProfileIdOrThrow } from "../seller/seller.service";
import { createWarehouseInvoiceSchema } from "./invoice.schemas";
import { createWarehouseInvoice } from "./invoice.service";
import { serializeBigInt } from "../../utils/bigint";

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

        res.status(201).json(serializeBigInt(result));
    } catch (e) {
        next(e);
    }
}
