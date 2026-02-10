import { Response, NextFunction } from "express";
import { AuthedRequest } from "../../middlewares/requireAuth";
import { exchangeRateQuerySchema } from "./exchangeRate.schemas";
import { getExchangeRateSnapshot } from "./exchangeRate.service";

export async function getExchangeRate(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const query = exchangeRateQuerySchema.parse(req.query);
        const rate = await getExchangeRateSnapshot({ base: query.base, quote: query.quote });
        res.json({ rate });
    } catch (e) {
        next(e);
    }
}
