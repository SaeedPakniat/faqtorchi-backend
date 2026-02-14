import { Response, NextFunction } from "express";
import { AuthedRequest } from "../../middlewares/requireAuth";
import { getSellerProfileIdOrThrow } from "../seller/seller.service";
import { createWarehouseSchema, updateWarehouseSchema } from "./warehouse.schemas";
import { createWarehouse, deleteWarehouse, listWarehouses, updateWarehouse } from "./warehouse.service";

export async function create(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const input = createWarehouseSchema.parse(req.body);

        const warehouse = await createWarehouse({
            sellerId,
            name: input.name,
            location: input.location,
        });

        res.status(201).json({ warehouse });
    } catch (e) {
        next(e);
    }
}

export async function list(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const warehouses = await listWarehouses(sellerId);
        res.json({ warehouses });
    } catch (e) {
        next(e);
    }
}

export async function update(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const warehouseId = Number(req.params.id);
        const input = updateWarehouseSchema.parse(req.body);

        const warehouse = await updateWarehouse({
            sellerId,
            warehouseId,
            name: input.name,
            location: input.location,
        });

        res.json({ warehouse });
    } catch (e) {
        next(e);
    }
}

export async function remove(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const warehouseId = Number(req.params.id);
        const result = await deleteWarehouse({ sellerId, warehouseId });
        res.json(result);
    } catch (e) {
        next(e);
    }
}
