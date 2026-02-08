// @ts-ignore
import express from "express";
// @ts-ignore
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import {env} from "./config/env";
import {prisma} from "./prisma/client";
import {authRouter} from "./modules/auth/auth.routes";
import cookieParser from "cookie-parser";
import v1Router from "./routes/v1";


export function createApp() {

    const app = express();

    app.set('trust proxy', true);

    app.use(
        pinoHttp({
            redact:{
                paths: [
                    'req.headers.authorization',
                    'req.headers.cookie',
                    'req.body.password',
                    'req.body.token',
                ],
                remove : true,
            },
        })
    );

    app.use(helmet());


    app.use(cors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH','DELETE'],

    }));

    app.use((err:unknown, _req:express.Request, res:express.Response, _next: express.NextFunction)=>{
        _req.log?.error({ err }, 'Unhandled error');

        res.status(500).json({ error: 'Internal Server Error' });
    });

    app.use(cookieParser());

    app.use("/api/v1", v1Router);

    app.use(express.json({limit : '200kb'}));
    app.use(express.urlencoded({extended: true, limit: '200kb'}));

    app.get('/health', (_req, res)=>{
        res.json({ok: true, env: env.NODE_ENV, name: env.APP_NAME, time: new Date().toISOString()});
    });



    app.get('/debug/users', async (_req, res)=>{
        const users = await prisma.user.findMany();
        res.json({ users });
    });

    app.use("/auth", authRouter);

    return app;
}