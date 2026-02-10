import { Response, NextFunction } from "express";
import { AuthedRequest } from "../../middlewares/requireAuth";
import { getSellerProfileIdOrThrow } from "../seller/seller.service";
import { createCustomerSchema, customerIdParamSchema, listCustomersSchema } from "./customer.schemas";
import { createCustomer, getCustomerById, listCustomers } from "./customer.service";

export async function create(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const input = createCustomerSchema.parse(req.body);

        const result = await createCustomer({ sellerId, ...input });
        res.status(201).json(result);
    } catch (e) {
        next(e);
    }
}

export async function list(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const query = listCustomersSchema.parse(req.query);

        const result = await listCustomers({ sellerId, ...query });
        res.json(result);
    } catch (e) {
        next(e);
    }
}

export async function getById(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const params = customerIdParamSchema.parse(req.params);

        const result = await getCustomerById({
            sellerId,
            customerId: params.customerId,
        });
        res.json(result);
    } catch (e) {
        next(e);
    }
}
