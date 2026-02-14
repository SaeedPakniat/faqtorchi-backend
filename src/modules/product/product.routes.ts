import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { requireSellerPermission } from "../../middlewares/requireSellerPermission";
import {
    addVariant,
    create,
    list,
    remove,
    removeVariant,
    update,
    updateVariantHandler,
} from "./product.controller";

export const productRouter = Router();

productRouter.use(requireAuth);
productRouter.use(requireRole("SELLER", "ADMIN"));
productRouter.use(requireSellerPermission("products"));

productRouter.post("/", create);
productRouter.get("/", list);
productRouter.patch("/:productId", update);
productRouter.delete("/:productId", remove);
productRouter.post("/:productId/variants", addVariant);
productRouter.patch("/:productId/variants/:variantId", updateVariantHandler);
productRouter.delete("/:productId/variants/:variantId", removeVariant);
