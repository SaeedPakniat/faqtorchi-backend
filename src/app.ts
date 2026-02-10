import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

import { env } from "./config/env";
import { prisma } from "./prisma/client";
import v1Router from "./routes/v1";

if (typeof (BigInt.prototype as any).toJSON !== "function") {
    (BigInt.prototype as any).toJSON = function () {
        return this.toString();
    };
}

export function createApp() {
    const app = express();

    // 0) Trust proxy (BEFORE anything that uses req.ip)
    app.set("trust proxy", true);

    // 1) Logging (BEFORE routes so every request gets logged)
    app.use(
        pinoHttp({
            redact: {
                paths: [
                    "req.headers.authorization",
                    "req.headers.cookie",
                    "req.body.password",
                    "req.body.token",
                ],
                remove: true,
            },
        })
    );

    // 2) Security + CORS (BEFORE routes)
    app.use(helmet());
    app.use(
        cors({
            origin: true,
            credentials: true,
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        })
    );

    // 3) Parsers (BEFORE routes)
    app.use(express.json({ limit: "200kb" }));
    app.use(express.urlencoded({ extended: true, limit: "200kb" }));
    app.use(cookieParser());

    // 4) Routes
    app.use("/api/v1", v1Router);

    // 5) Non-v1 routes (health/debug) – keep if you want
    app.get("/health", (_req, res) => {
        res.json({ ok: true, env: env.NODE_ENV, name: env.APP_NAME, time: new Date().toISOString() });
    });

    app.get("/debug/users", async (_req, res) => {
        const users = await prisma.user.findMany();
        res.json({ users });
    });

    // 6) Global error handler (LAST)
    app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
        req.log?.error({ err }, "Unhandled error");

        if (err instanceof ZodError) {
            return res.status(400).json({ message: "Validation error", issues: err.issues });
        }

        // jsonwebtoken errors -> 401 (refresh/login)
        if (err?.name === "JsonWebTokenError" || err?.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            return res.status(409).json({ message: "Duplicate", meta: err.meta });
        }

        const status = err?.status || 500;
        return res.status(status).json({ message: err?.message });
    });

    return app;
}
