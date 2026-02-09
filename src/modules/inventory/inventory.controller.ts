import { Response, NextFunction } from "express";
import { AuthedRequest } from "../../middlewares/requireAuth";
import { getSellerProfileIdOrThrow } from "../seller/seller.service";
import { serializeBigInt } from "../../utils/bigint";
import { adjustInventorySchema, listInventorySchema } from "./inventory.schemas";
import { adjustInventory, listInventory } from "./inventory.service";

export async function adjust(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const input = adjustInventorySchema.parse(req.body);

        const result = await adjustInventory({
            sellerId,
            warehouseId: input.warehouseId,
            variantId: input.variantId,
            delta: input.delta,
            note: input.note,
        });

        res.status(201).json(result);
    } catch (e) {
        next(e);
    }
}

export async function list(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const input = listInventorySchema.parse(req.query);

        const result = await listInventory({
            sellerId,
            warehouseId: input.warehouseId,
        });

        res.json(serializeBigInt(result));
    } catch (e) {
        next(e);
    }
}
