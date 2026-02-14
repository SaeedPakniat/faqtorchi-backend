import { Response, NextFunction } from "express";
import { AuthedRequest } from "../../middlewares/requireAuth";
import { getSellerProfileIdOrThrow } from "../seller/seller.service";
import {
    createSellerMemberSchema,
    sellerMemberAuditQuerySchema,
    sellerMemberIdParamSchema,
    setSellerMemberPasswordSchema,
    updateSellerMemberSchema,
} from "./sellerMember.schemas";
import {
    createSellerMember,
    getSellerMemberById,
    listSellerMembers,
    listSellerMemberAuditLogs,
    setSellerMemberPassword,
    updateSellerMember,
} from "./sellerMember.service";

export async function list(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const result = await listSellerMembers(sellerId);
        res.json(result);
    } catch (e) {
        next(e);
    }
}

export async function getById(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const params = sellerMemberIdParamSchema.parse(req.params);
        const result = await getSellerMemberById({ sellerId, memberId: params.id });
        res.json(result);
    } catch (e) {
        next(e);
    }
}

export async function create(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const input = createSellerMemberSchema.parse(req.body);
        const result = await createSellerMember({ sellerId, input });
        res.status(201).json(result);
    } catch (e) {
        next(e);
    }
}

export async function update(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const params = sellerMemberIdParamSchema.parse(req.params);
        const input = updateSellerMemberSchema.parse(req.body);
        const result = await updateSellerMember({ sellerId, memberId: params.id, input });
        res.json(result);
    } catch (e) {
        next(e);
    }
}

export async function setPassword(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const params = sellerMemberIdParamSchema.parse(req.params);
        const input = setSellerMemberPasswordSchema.parse(req.body);
        const result = await setSellerMemberPassword({ sellerId, memberId: params.id, input });
        res.json(result);
    } catch (e) {
        next(e);
    }
}

export async function listAudit(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const params = sellerMemberIdParamSchema.parse(req.params);
        const query = sellerMemberAuditQuerySchema.parse(req.query);
        const result = await listSellerMemberAuditLogs({
            sellerId,
            memberId: params.id,
            page: query.page,
            pageSize: query.pageSize,
        });
        res.json(result);
    } catch (e) {
        next(e);
    }
}
