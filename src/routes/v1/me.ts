import { Router } from "express";
import { requireAuth, AuthedRequest } from "../../middlewares/requireAuth";
import { getSellerContextOrThrow } from "../../modules/sellerMember/sellerMember.service";

export const meRouter = Router();

meRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
    try {
        const seller = await getSellerContextOrThrow(req.user!.id);
        res.json({ user: req.user, seller });
    } catch {
        res.json({ user: req.user });
    }
});
