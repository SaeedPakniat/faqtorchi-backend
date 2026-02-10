import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),


    //JWT Authentication
    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters long'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters long'),
    APP_NAME: z.string().min(3, 'APP_NAME is required'),

    // Security + platform
    CORS_ORIGINS: z.string().optional(),
    RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(20),
    RATE_LIMIT_API_MAX: z.coerce.number().int().positive().default(300),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),

    // Exchange rates
    EXCHANGE_RATE_PROVIDER: z.enum(["stub", "http"]).default("stub"),
    EXCHANGE_RATE_CACHE_MINUTES: z.coerce.number().int().positive().default(60),
    EXCHANGE_RATE_URL: z.string().url().optional(),

    // Reminders
    ENABLE_REMINDER_WORKER: z.coerce.boolean().default(false),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.issues);
    process.exit(1);
}

export const env = parsed.data;
