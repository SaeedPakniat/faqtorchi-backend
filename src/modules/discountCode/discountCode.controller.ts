import { Request, Response, NextFunction } from "express";
import {
    createDiscountCodeSchema,
    discountCodeIdParamSchema,
    listDiscountCodesSchema,
    updateDiscountCodeSchema,
} from "./discountCode.schemas";
import { createDiscountCode, listDiscountCodes, updateDiscountCode } from "./discountCode.service";
import type { AuthedRequest } from "../../middlewares/requireAuth";
import { getSellerProfileIdOrThrow } from "../seller/seller.service";

export async function create(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const input = createDiscountCodeSchema.parse(req.body);
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const result = await createDiscountCode({ sellerId, input });
        return res.status(201).json(result);
    } catch (err) {
        return next(err);
    }
}

export async function list(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const input = listDiscountCodesSchema.parse(req.query);
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const result = await listDiscountCodes({ sellerId, input });
        return res.json(result);
    } catch (err) {
        return next(err);
    }
}

export async function update(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const params = discountCodeIdParamSchema.parse(req.params);
        const input = updateDiscountCodeSchema.parse(req.body);
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const result = await updateDiscountCode({
            sellerId,
            id: params.id,
            input,
        });
        return res.json(result);
    } catch (err) {
        return next(err);
    }
}
