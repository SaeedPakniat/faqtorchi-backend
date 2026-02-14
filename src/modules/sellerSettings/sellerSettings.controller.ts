import type { Response, NextFunction } from "express";
import { AuthedRequest } from "../../middlewares/requireAuth";
import { getSellerProfileIdOrThrow } from "../seller/seller.service";
import { setBaseCurrencySchema, setInvoiceTemplateSchema, setNotificationSettingsSchema } from "./sellerSettings.schemas";
import {
    getCurrencySettings,
    getInvoiceTemplate,
    getNotificationSettings,
    setCurrencySettings,
    setInvoiceTemplate,
    setNotificationSettings,
} from "./sellerSettings.service";

export async function getInvoiceTemplateHandler(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const result = await getInvoiceTemplate({ sellerId });
        return res.json(result);
    } catch (e) {
        next(e);
    }
}

export async function setInvoiceTemplateHandler(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const input = setInvoiceTemplateSchema.parse(req.body);
        const result = await setInvoiceTemplate({ sellerId, templateId: input.templateId });
        return res.json(result);
    } catch (e) {
        next(e);
    }
}

export async function getCurrencyHandler(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const result = await getCurrencySettings({ sellerId });
        return res.json(result);
    } catch (e) {
        next(e);
    }
}

export async function setCurrencyHandler(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const input = setBaseCurrencySchema.parse(req.body);
        const result = await setCurrencySettings({ sellerId, baseCurrency: input.baseCurrency });
        return res.json(result);
    } catch (e) {
        next(e);
    }
}

export async function getNotificationSettingsHandler(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const result = await getNotificationSettings({ sellerId });
        return res.json(result);
    } catch (e) {
        next(e);
    }
}

export async function setNotificationSettingsHandler(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const input = setNotificationSettingsSchema.parse(req.body);
        const result = await setNotificationSettings({ sellerId, input });
        return res.json(result);
    } catch (e) {
        next(e);
    }
}
