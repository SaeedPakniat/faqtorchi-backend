import { Response, NextFunction } from "express";
import { AuthedRequest } from "../../middlewares/requireAuth";
import { getSellerProfileIdOrThrow } from "../seller/seller.service";
import { assertWarehouseAccess } from "../sellerMember/sellerMember.service";
import { adjustInventorySchema, listInventorySchema, listLedgerSchema } from "./inventory.schemas";
import { adjustInventory, listInventory, listInventoryLedger } from "./inventory.service";

export async function adjust(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const input = adjustInventorySchema.parse(req.body);

        await assertWarehouseAccess(req.user!.id, input.warehouseId);

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

        await assertWarehouseAccess(req.user!.id, input.warehouseId);

        const result = await listInventory({
            sellerId,
            warehouseId: input.warehouseId,
        });

        res.json(result);
    } catch (e) {
        next(e);
    }
}

export async function listLedger(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const input = listLedgerSchema.parse(req.query);
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);

        const result = await listInventoryLedger({
            sellerId,
            userId: req.user!.id,
            inventoryId: input.inventoryId,
        });

        res.json({
            inventoryId: result.inventoryId,
            ledger: result.ledger.map((entry) => ({
                id: entry.id,
                changeType: entry.changeType,
                delta: entry.delta,
                note: entry.note,
                createdAt: entry.createdAt.toISOString(),
            })),
        });
    } catch (e) {
        next(e);
    }
}
