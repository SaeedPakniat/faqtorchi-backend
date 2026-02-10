import { Response, NextFunction } from "express";
import { AuthedRequest } from "../../middlewares/requireAuth";
import { getSellerProfileIdOrThrow } from "../seller/seller.service";
import { getAccountsReceivable, getDiscountsReport, getLowStock, getSalesReport, getTopProducts } from "./report.service";
import {
    discountsReportQuerySchema,
    lowStockQuerySchema,
    salesReportQuerySchema,
    topProductsQuerySchema,
} from "./report.schemas";

export async function sales(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const query = salesReportQuerySchema.parse(req.query);
        const result = await getSalesReport({ sellerId, ...query });
        res.json(result);
    } catch (e) {
        next(e);
    }
}

export async function accountsReceivable(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const result = await getAccountsReceivable({ sellerId });
        res.json(result);
    } catch (e) {
        next(e);
    }
}

export async function topProducts(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const query = topProductsQuerySchema.parse(req.query);
        const result = await getTopProducts({ sellerId, ...query });
        res.json(result);
    } catch (e) {
        next(e);
    }
}

export async function lowStock(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const query = lowStockQuerySchema.parse(req.query);
        const result = await getLowStock({ sellerId, ...query });
        res.json(result);
    } catch (e) {
        next(e);
    }
}

export async function discounts(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const query = discountsReportQuerySchema.parse(req.query);
        const result = await getDiscountsReport({ sellerId, ...query });
        res.json(result);
    } catch (e) {
        next(e);
    }
}
