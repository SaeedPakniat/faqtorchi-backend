import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../modules/common/security/jwt";

export type SellerContext = {
    sellerId: number;
    isOwner: boolean;
    memberId?: number;
    permissions?: {
        invoices: boolean;
        customers: boolean;
        products: boolean;
        settings: boolean;
        warehouse: boolean;
        reports: boolean;
    };
    warehouseIds?: number[];
};

export type AuthedRequest = Request & { user?: { id: number; role: string }; sellerContext?: SellerContext };

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return res.status(401).json({ message: "Unauthorized" });

    const token = header.slice("Bearer ".length);
    try {
        const payload = verifyAccessToken(token);
        req.user = { id: payload.sub, role: payload.role };
        return next();
    } catch {
        return res.status(401).json({ message: "Unauthorized" });
    }
}
