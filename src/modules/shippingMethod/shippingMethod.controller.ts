import { Response, NextFunction } from "express";
import { AuthedRequest } from "../../middlewares/requireAuth";
import { getSellerProfileIdOrThrow } from "../seller/seller.service";
import { shippingMethodIdParamSchema, createShippingMethodSchema, updateShippingMethodSchema } from "./shippingMethod.schemas";
import { listShippingMethods, createShippingMethod, updateShippingMethod, deleteShippingMethod } from "./shippingMethod.service";

export async function list(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const result = await listShippingMethods(sellerId);
        res.json(result);
    } catch (e) {
        next(e);
    }
}

export async function create(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const input = createShippingMethodSchema.parse(req.body);
        const result = await createShippingMethod({ sellerId, input });
        res.status(201).json(result);
    } catch (e) {
        next(e);
    }
}

export async function update(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const params = shippingMethodIdParamSchema.parse(req.params);
        const input = updateShippingMethodSchema.parse(req.body);
        const result = await updateShippingMethod({ sellerId, id: params.id, input });
        res.json(result);
    } catch (e) {
        next(e);
    }
}

export async function remove(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const params = shippingMethodIdParamSchema.parse(req.params);
        const result = await deleteShippingMethod({ sellerId, id: params.id });
        res.json(result);
    } catch (e) {
        next(e);
    }
}
