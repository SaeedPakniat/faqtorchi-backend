import { Response, NextFunction } from "express";
import { AuthedRequest } from "../../middlewares/requireAuth";
import { getSellerProfileIdOrThrow } from "../seller/seller.service";
import { bankAccountIdParamSchema, createBankAccountSchema, updateBankAccountSchema } from "./bankAccount.schemas";
import { listBankAccounts, createBankAccount, updateBankAccount, deleteBankAccount } from "./bankAccount.service";

export async function list(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const result = await listBankAccounts(sellerId);
        res.json(result);
    } catch (e) {
        next(e);
    }
}

export async function create(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const input = createBankAccountSchema.parse(req.body);
        const result = await createBankAccount({ sellerId, input });
        res.status(201).json(result);
    } catch (e) {
        next(e);
    }
}

export async function update(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const params = bankAccountIdParamSchema.parse(req.params);
        const input = updateBankAccountSchema.parse(req.body);
        const result = await updateBankAccount({ sellerId, id: params.id, input });
        res.json(result);
    } catch (e) {
        next(e);
    }
}

export async function remove(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const params = bankAccountIdParamSchema.parse(req.params);
        const result = await deleteBankAccount({ sellerId, id: params.id });
        res.json(result);
    } catch (e) {
        next(e);
    }
}
