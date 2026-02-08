export const authConfig = {
    accessTokenTtlSeconds: 15 * 60,      // 15 min
    refreshTokenTtlSeconds: 30 * 24 * 60 * 60, // 30 days
    refreshCookieName: "refresh_token",
    cookie: {
        httpOnly: true,
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
        path: "/api/v1/auth/refresh",
    },
};
