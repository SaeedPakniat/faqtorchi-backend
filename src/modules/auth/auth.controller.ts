import { Request, Response, NextFunction } from "express";
import { RegisterSchema } from "./auth.schemas";
import { loginUser, logoutSession, refreshSession, registerUser, isPhoneRegistered } from "./auth.service";

const REFRESH_COOKIE = "refresh_token";

const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/api/v1/auth/refresh",
};

export async function register(req: Request, res: Response, next: NextFunction) {
    try {
        const input = RegisterSchema.parse(req.body);
        const user = await registerUser(input);
        res.status(201).json({ user });
    } catch (e) {
        next(e);
    }
}

export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        const { phone, password } = req.body;

        const result = await loginUser({
            phone,
            password,
            userAgent: req.headers["user-agent"] ?? undefined,
            ipAddress: req.ip,
        });

        res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);
        res.json({ user: result.user, accessToken: result.accessToken });
    } catch (e) {
        next(e);
    }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.cookies?.[REFRESH_COOKIE];
        if (!token) return res.status(401).json({ message: "Unauthorized" });

        const result = await refreshSession(token);

        res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);
        res.json({ accessToken: result.accessToken });
    } catch (e: any) {
        // jwt malformed / expired -> 401
        if (e?.name === "JsonWebTokenError" || e?.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Unauthorized" });
        }
        next(e);
    }
}



export async function exists(req: Request, res: Response, next: NextFunction) {
    try {
        const phone = String(req.query.phone ?? "").trim();
        if (!phone) return res.status(400).json({ message: "Phone is required" });

        const exists = await isPhoneRegistered(phone);
        res.json({ exists });
    } catch (e) {
        next(e);
    }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.cookies?.[REFRESH_COOKIE];
        if (token) await logoutSession(token);

        res.clearCookie(REFRESH_COOKIE, cookieOptions);
        res.json({ ok: true });
    } catch (e) {
        next(e);
    }
}
