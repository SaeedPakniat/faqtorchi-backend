import { Response, NextFunction } from "express";
import type { Prisma } from "@prisma/client";
import { AuthedRequest } from "./requireAuth";
import { assertSellerPermission, recordSellerMemberAudit } from "../modules/sellerMember/sellerMember.service";

export function requireSellerPermission(permission: "invoices" | "customers" | "products" | "settings" | "warehouse" | "reports") {
    return async (req: AuthedRequest, _res: Response, next: NextFunction) => {
        try {
            const ctx = await assertSellerPermission(req.user!.id, permission);
            req.sellerContext = ctx;
            if (req.user?.role === "ADMIN" && ctx.memberId) {
                const { method, originalUrl } = req;
                const ipAddress = req.ip;
                const userAgent = req.headers["user-agent"];
                const meta = extractAuditMeta(permission, req);
                _res.on("finish", () => {
                    recordSellerMemberAudit({
                        sellerId: ctx.sellerId,
                        memberId: ctx.memberId!,
                        userId: req.user!.id,
                        action: `${permission.toUpperCase()} ${method}`,
                        method,
                        path: originalUrl,
                        statusCode: _res.statusCode,
                        ipAddress: typeof ipAddress === "string" ? ipAddress : undefined,
                        userAgent: typeof userAgent === "string" ? userAgent : undefined,
                        meta,
                    }).catch(() => undefined);
                });
            }
            return next();
        } catch (e) {
            return next(e);
        }
    };
}

function extractAuditMeta(permission: string, req: AuthedRequest): Prisma.InputJsonValue | null {
    const meta: Record<string, unknown> = {};

    const num = (value: unknown) => {
        if (typeof value !== "string") return undefined;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    };

    if (req.params) {
        const invoiceId = num(req.params.invoiceId) ?? (permission === "invoices" ? num(req.params.id) : undefined);
        const customerId = num(req.params.customerId) ?? (permission === "customers" ? num(req.params.id) : undefined);
        const warehouseId = num(req.params.warehouseId);
        const productId = num(req.params.productId);
        const variantId = num(req.params.variantId);
        const paymentId = num(req.params.paymentId);
        const memberId = num(req.params.memberId);

        if (invoiceId != null) meta.invoiceId = invoiceId;
        if (customerId != null) meta.customerId = customerId;
        if (warehouseId != null) meta.warehouseId = warehouseId;
        if (productId != null) meta.productId = productId;
        if (variantId != null) meta.variantId = variantId;
        if (paymentId != null) meta.paymentId = paymentId;
        if (memberId != null) meta.memberId = memberId;

        if (permission === "invoices" && invoiceId != null) {
            meta.entityType = "invoice";
            meta.entityId = invoiceId;
        }
        if (permission === "customers" && customerId != null) {
            meta.entityType = "customer";
            meta.entityId = customerId;
        }
    }

    return Object.keys(meta).length > 0 ? (meta as Prisma.InputJsonValue) : null;
}
