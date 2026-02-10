import { Response, NextFunction } from "express";
import { AuthedRequest } from "../../middlewares/requireAuth";
import { getSellerProfileIdOrThrow } from "../seller/seller.service";
import { cancelReminder, createReminders, listReminders } from "./reminder.service";
import { createRemindersSchema, invoiceIdParamSchema, reminderIdParamSchema } from "./reminder.schemas";

export async function createForInvoice(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const params = invoiceIdParamSchema.parse(req.params);
        const input = createRemindersSchema.parse(req.body);

        const result = await createReminders({
            sellerId,
            invoiceId: params.invoiceId,
            installments: input.installments,
        });

        res.status(201).json(result);
    } catch (e) {
        next(e);
    }
}

export async function listForInvoice(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const params = invoiceIdParamSchema.parse(req.params);

        const result = await listReminders({
            sellerId,
            invoiceId: params.invoiceId,
        });

        res.json(result);
    } catch (e) {
        next(e);
    }
}

export async function cancel(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const sellerId = await getSellerProfileIdOrThrow(req.user!.id);
        const params = reminderIdParamSchema.parse(req.params);

        const result = await cancelReminder({
            sellerId,
            reminderId: params.reminderId,
        });

        res.json(result);
    } catch (e) {
        next(e);
    }
}
