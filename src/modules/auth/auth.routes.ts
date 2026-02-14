import { Router } from "express";
import { login, logout, refresh, register, exists } from "./auth.controller";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.get("/exists", exists);
authRouter.post("/login", login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);
