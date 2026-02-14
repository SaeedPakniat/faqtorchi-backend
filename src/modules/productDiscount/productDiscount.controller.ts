import { Response, NextFunction } from "express";
import { AuthedRequest } from "../../middlewares/requireAuth";
import { getSellerProfileIdOrThrow } from "../seller/seller.service";
import {
  createProductDiscountSchema,
  listProductDiscountsSchema,
  productDiscountIdParamSchema,
  updateProductDiscountSchema,
} from "./productDiscount.schemas";
import {
  createProductDiscount,
  deleteProductDiscount,
  listProductDiscounts,
  updateProductDiscount,
} from "./productDiscount.service";

export async function list(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
    const query = listProductDiscountsSchema.parse(req.query);
    const result = await listProductDiscounts({ sellerId, ...query });
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function create(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
    const input = createProductDiscountSchema.parse(req.body);
    const result = await createProductDiscount({ sellerId, input });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

export async function update(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
    const params = productDiscountIdParamSchema.parse(req.params);
    const input = updateProductDiscountSchema.parse(req.body);
    const result = await updateProductDiscount({ sellerId, id: params.id, input });
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function remove(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
    const params = productDiscountIdParamSchema.parse(req.params);
    const result = await deleteProductDiscount({ sellerId, id: params.id });
    res.json(result);
  } catch (e) {
    next(e);
  }
}
