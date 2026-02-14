import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import pino from "pino";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import crypto from "crypto";

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

    const logger =
        env.NODE_ENV === "production"
            ? pino()
            : pino({
                  transport: {
                      target: "pino-pretty",
                      options: {
                          colorize: true,
                          translateTime: "SYS:standard",
                          ignore:
                              "pid,hostname,req.headers,res.headers,req.remoteAddress,req.remotePort,req.query,req.params",
                          messageFormat: "{req.method} {req.url} {res.statusCode} {responseTime}ms",
                      },
                  },
              });

    // 0) Trust proxy (BEFORE anything that uses req.ip)
    app.set("trust proxy", true);

    // 1) Logging (BEFORE routes so every request gets logged)
    app.use(
        pinoHttp({
            logger,
            genReqId: (req, res) => {
                const incoming = req.headers["x-request-id"];
                const id = Array.isArray(incoming) ? incoming[0] : incoming;
                const reqId = id ?? crypto.randomUUID();
                res.setHeader("X-Request-Id", reqId);
                return reqId;
            },
            redact: {
                paths: [
                    "req.headers.authorization",
                    "req.headers.cookie",
                    "req.body.password",
                    "req.body.token",
                ],
                remove: true,
            },
            serializers: {
                req: (req) => ({
                    id: req.id,
                    method: req.method,
                    url: req.url,
                }),
                res: (res) => ({
                    statusCode: res.statusCode,
                }),
            },
        })
    );

    // 2) Security + CORS (BEFORE routes)
    app.use(helmet());
    const corsOrigins = (env.CORS_ORIGINS ?? "")
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);
    app.use(
        cors({
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);
                if (corsOrigins.length === 0) return callback(null, false);
                if (corsOrigins.includes(origin)) return callback(null, true);
                return callback(Object.assign(new Error("Not allowed by CORS"), { status: 403 }));
            },
            credentials: true,
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        })
    );

    // 3) Parsers (BEFORE routes)
    app.use(express.json({ limit: "200kb" }));
    app.use(express.urlencoded({ extended: true, limit: "200kb" }));
    app.use(cookieParser());

    const authLimiter = rateLimit({
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        max: env.RATE_LIMIT_AUTH_MAX,
        standardHeaders: true,
        legacyHeaders: false,
    });

    const apiLimiter = rateLimit({
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        max: env.RATE_LIMIT_API_MAX,
        standardHeaders: true,
        legacyHeaders: false,
    });

    app.use("/api/v1/auth", authLimiter);
    app.use("/api/v1", apiLimiter);

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
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
            return res.status(404).json({ message: "Not found" });
        }

        const status = err?.status || 500;
        if (status >= 500 && env.NODE_ENV === "production") {
            return res.status(status).json({ message: "Internal server error" });
        }
        return res.status(status).json({ message: err?.message ?? "Internal server error" });
    });

    return app;
}
