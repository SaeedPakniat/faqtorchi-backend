import { Response, NextFunction } from "express";
import { AuthedRequest } from "../../middlewares/requireAuth";
import { getSellerProfileIdOrThrow } from "../seller/seller.service";
import { createProductSchema, createVariantSchema } from "./product.schemas";
import { createProduct, createVariant, listProducts } from "./product.service";
import { serializeBigInt } from "../../utils/bigint";

export async function create(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const input = createProductSchema.parse(req.body);

        const product = await createProduct({
            sellerId,
            name: input.name,
            description: input.description,
        });

        res.status(201).json({ product });
    } catch (e) {
        next(e);
    }
}

export async function list(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const products = await listProducts(sellerId);
        res.json(serializeBigInt({ products }));
    } catch (e) {
        next(e);
    }
}

export async function addVariant(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const productId = Number(req.params.productId);
        if (!Number.isInteger(productId)) {
            return res.status(400).json({ message: "Invalid productId" });
        }

        const input = createVariantSchema.parse(req.body);

        const variant = await createVariant({
            sellerId,
            productId,
            sku: input.sku,
            price: input.price,
            attributes: input.attributes,
        });

        res.status(201).json(serializeBigInt({ variant }));
    } catch (e) {
        next(e);
    }
}
