import { Router } from "express";
import { requireAuth, AuthedRequest } from "../../middlewares/requireAuth";

export const meRouter = Router();

meRouter.get("/me", requireAuth, (req: AuthedRequest, res) => {
    res.json({ user: req.user });
});
