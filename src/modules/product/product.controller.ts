import { Response, NextFunction } from "express";
import { AuthedRequest } from "../../middlewares/requireAuth";
import { getSellerProfileIdOrThrow } from "../seller/seller.service";
import {
    createProductSchema,
    createVariantSchema,
    updateProductSchema,
    updateVariantSchema,
} from "./product.schemas";
import {
    createProduct,
    createVariant,
    deleteProduct,
    deleteVariant,
    listProducts,
    updateProduct,
    updateVariant,
} from "./product.service";

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
        res.json({ products });
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

        res.status(201).json({ variant });
    } catch (e) {
        next(e);
    }
}

export async function update(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const productId = Number(req.params.productId);
        if (!Number.isInteger(productId)) {
            return res.status(400).json({ message: "Invalid productId" });
        }

        const input = updateProductSchema.parse(req.body);
        const product = await updateProduct({
            sellerId,
            productId,
            name: input.name,
            description: input.description,
        });

        res.json({ product });
    } catch (e) {
        next(e);
    }
}

export async function remove(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const productId = Number(req.params.productId);
        if (!Number.isInteger(productId)) {
            return res.status(400).json({ message: "Invalid productId" });
        }

        const result = await deleteProduct({ sellerId, productId });
        res.json(result);
    } catch (e) {
        next(e);
    }
}

export async function updateVariantHandler(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const productId = Number(req.params.productId);
        const variantId = Number(req.params.variantId);
        if (!Number.isInteger(productId) || !Number.isInteger(variantId)) {
            return res.status(400).json({ message: "Invalid productId or variantId" });
        }

        const input = updateVariantSchema.parse(req.body);
        const variant = await updateVariant({
            sellerId,
            productId,
            variantId,
            sku: input.sku,
            price: input.price,
            attributes: input.attributes ?? undefined,
        });

        res.json({ variant });
    } catch (e) {
        next(e);
    }
}

export async function removeVariant(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const productId = Number(req.params.productId);
        const variantId = Number(req.params.variantId);
        if (!Number.isInteger(productId) || !Number.isInteger(variantId)) {
            return res.status(400).json({ message: "Invalid productId or variantId" });
        }

        const result = await deleteVariant({ sellerId, productId, variantId });
        res.json(result);
    } catch (e) {
        next(e);
    }
}
