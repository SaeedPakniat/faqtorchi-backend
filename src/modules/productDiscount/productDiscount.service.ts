import { prisma } from "../../prisma/client";
import type {
  CreateProductDiscountInput,
  UpdateProductDiscountInput,
  ListProductDiscountsInput,
} from "./productDiscount.schemas";

async function assertProductOwnership(sellerId: number, productId: number) {
  const product = await prisma.product.findFirst({
    where: { id: productId, sellerId },
    select: { id: true },
  });
  if (!product) throw Object.assign(new Error("Product not found"), { status: 404 });
}

async function assertVariantOwnership(sellerId: number, variantId: number, productId?: number) {
  const variant = await prisma.productVariant.findFirst({
    where: {
      id: variantId,
      product: { sellerId },
      ...(productId ? { productId } : {}),
    },
    select: { id: true, productId: true },
  });
  if (!variant) throw Object.assign(new Error("Variant not found"), { status: 404 });
  return variant.productId;
}

export async function listProductDiscounts(params: { sellerId: number } & ListProductDiscountsInput) {
  const where: Record<string, unknown> = { sellerId: params.sellerId };
  if (params.productId) where.productId = params.productId;
  if (params.variantId) where.variantId = params.variantId;
  if (params.isActive != null) where.isActive = params.isActive;

  const discounts = await prisma.productDiscount.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
  });

  return { discounts };
}

export async function createProductDiscount(params: { sellerId: number; input: CreateProductDiscountInput }) {
  const { productId, variantId } = params.input;

  if (productId) await assertProductOwnership(params.sellerId, productId);
  if (variantId) {
    const resolvedProductId = await assertVariantOwnership(params.sellerId, variantId, productId);
    if (!productId) {
      params.input.productId = resolvedProductId;
    }
  }

  const discount = await prisma.productDiscount.create({
    data: {
      sellerId: params.sellerId,
      productId: params.input.productId ?? null,
      variantId: params.input.variantId ?? null,
      type: params.input.type,
      value: BigInt(params.input.value),
      startsAt: params.input.startsAt ?? null,
      endsAt: params.input.endsAt ?? null,
      isActive: params.input.isActive ?? true,
    },
  });

  return { discount };
}

export async function updateProductDiscount(params: {
  sellerId: number;
  id: number;
  input: UpdateProductDiscountInput;
}) {
  const existing = await prisma.productDiscount.findFirst({
    where: { id: params.id, sellerId: params.sellerId },
    select: { id: true },
  });
  if (!existing) throw Object.assign(new Error("Product discount not found"), { status: 404 });

  if (params.input.productId) await assertProductOwnership(params.sellerId, params.input.productId);
  if (params.input.variantId) await assertVariantOwnership(params.sellerId, params.input.variantId, params.input.productId);

  const discount = await prisma.productDiscount.update({
    where: { id: params.id },
    data: {
      productId: params.input.productId ?? undefined,
      variantId: params.input.variantId ?? undefined,
      type: params.input.type ?? undefined,
      value: params.input.value != null ? BigInt(params.input.value) : undefined,
      startsAt: params.input.startsAt ?? undefined,
      endsAt: params.input.endsAt ?? undefined,
      isActive: params.input.isActive ?? undefined,
    },
  });

  return { discount };
}

export async function deleteProductDiscount(params: { sellerId: number; id: number }) {
  const existing = await prisma.productDiscount.findFirst({
    where: { id: params.id, sellerId: params.sellerId },
    select: { id: true },
  });
  if (!existing) throw Object.assign(new Error("Product discount not found"), { status: 404 });

  await prisma.productDiscount.delete({ where: { id: params.id } });
  return { ok: true };
}
