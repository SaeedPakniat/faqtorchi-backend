import { Request, Response, NextFunction } from "express";
import { publicInvoicesQuerySchema, requestPublicTokenSchema } from "./publicAccess.schemas";
import { listPublicInvoices, requestPublicInvoiceToken } from "./publicAccess.service";

export async function requestToken(req: Request, res: Response, next: NextFunction) {
    try {
        const input = requestPublicTokenSchema.parse(req.body);
        const result = await requestPublicInvoiceToken(input.phone);
        const response =
            process.env.NODE_ENV === "production"
                ? { message: "Token sent" }
                : { message: "Token sent", token: result.token };
        return res.json(response);
    } catch (err) {
        return next(err);
    }
}

export async function listInvoices(req: Request, res: Response, next: NextFunction) {
    try {
        const query = publicInvoicesQuerySchema.parse(req.query);
        const result = await listPublicInvoices({ phone: query.phone, token: query.token });
        return res.json(result);
    } catch (err) {
        return next(err);
    }
}
