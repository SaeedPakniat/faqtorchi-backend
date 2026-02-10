import { Response, NextFunction } from "express";
import type { AuthedRequest } from "../../middlewares/requireAuth";
import {
    customerInvoiceIdParamSchema,
    customerLoginSchema,
    customerRegisterSchema,
    listCustomerInvoicesSchema,
} from "./customerPortal.schemas";
import { getCustomerInvoiceById, listCustomerInvoices, loginCustomer, registerCustomer } from "./customerPortal.service";

export async function register(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const input = customerRegisterSchema.parse(req.body);
        const result = await registerCustomer(input);
        return res.status(201).json(result);
    } catch (err) {
        return next(err);
    }
}

export async function login(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const input = customerLoginSchema.parse(req.body);
        const result = await loginCustomer(input, {
            userAgent: req.headers["user-agent"],
            ipAddress: req.ip,
        });
        return res.json(result);
    } catch (err) {
        return next(err);
    }
}

export async function listInvoices(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const query = listCustomerInvoicesSchema.parse(req.query);
        const result = await listCustomerInvoices({ userId: req.user!.id, ...query });
        return res.json(result);
    } catch (err) {
        return next(err);
    }
}

export async function getInvoice(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const params = customerInvoiceIdParamSchema.parse(req.params);
        const result = await getCustomerInvoiceById({ userId: req.user!.id, invoiceId: params.id });
        return res.json(result);
    } catch (err) {
        return next(err);
    }
}
