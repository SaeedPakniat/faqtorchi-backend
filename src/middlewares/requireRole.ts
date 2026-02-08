import { Response, NextFunction } from "express";
import { AuthedRequest } from "./requireAuth";

export function requireRole(...roles: string[]) {
    return (req: AuthedRequest, _res: Response, next: NextFunction) => {
        if (!req.user) return next(Object.assign(new Error("Unauthorized"), { status: 401 }));
        if (!roles.includes(req.user.role)) return next(Object.assign(new Error("Forbidden"), { status: 403 }));
        return next();
    };
}
