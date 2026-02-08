import { prisma } from "../../prisma/client";
import type { RegisterInput } from "./auth.schemas";
import { hashPassword, verifyPassword } from "../common/security/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../common/security/jwt";
import { hashRefreshToken } from "../common/security/refreshToken";

const REFRESH_TTL_SECONDS = Number(process.env.REFRESH_TOKEN_TTL_SECONDS ?? "2592000");

export async function registerUser(input: RegisterInput) {
    const passwordHash = await hashPassword(input.password);

    // phone must be required by schema/validator
    const user = await prisma.user.create({
        data: {
            email: input.email ?? null,
            phone: input.phone,
            name: input.name ?? null,
            passwordHash,
            role: "USER",
        },
        select: {
            id: true,
            email: true,
            phone: true,
            name: true,
            role: true,
            createdAt: true,
        },
    });

    return user;
}

export async function loginUser(params: {
    phone: string;
    password: string;
    userAgent?: string;
    ipAddress?: string;
}) {
    const user = await prisma.user.findUnique({
        where: { phone: params.phone },
    });

    if (!user || !user.isActive) {
        throw Object.assign(new Error("Invalid credentials"), { status: 401 });
    }

    const ok = await verifyPassword(user.passwordHash, params.password);
    if (!ok) {
        throw Object.assign(new Error("Invalid credentials"), { status: 401 });
    }

    const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);

    // create session first (no token yet)
    const session = await prisma.session.create({
        data: {
            userId: user.id,
            refreshTokenHash: "temp", // will update right after we sign token
            expiresAt,
            userAgent: params.userAgent ?? null,
            ipAddress: params.ipAddress ?? null,
        },
        select: { id: true },
    });

    const refreshToken = signRefreshToken(session.id, user.id);
    const refreshTokenHash = hashRefreshToken(refreshToken);

    await prisma.session.update({
        where: { id: session.id },
        data: { refreshTokenHash },
    });

    const accessToken = signAccessToken(user.id, user.role);

    return {
        user: { id: user.id, phone: user.phone, email: user.email, name: user.name, role: user.role },
        accessToken,
        refreshToken,
    };
}

export async function refreshSession(refreshToken: string) {
    const { sid, sub } = verifyRefreshToken(refreshToken);
    const refreshTokenHash = hashRefreshToken(refreshToken);

    const session = await prisma.session.findUnique({
        where: { id: sid },
        include: { user: true },
    });

    if (
        !session ||
        session.userId !== sub ||
        session.revokedAt ||
        session.expiresAt.getTime() < Date.now() ||
        session.refreshTokenHash !== refreshTokenHash ||
        !session.user.isActive
    ) {
        throw Object.assign(new Error("Unauthorized"), { status: 401 });
    }

    // rotate: revoke old session, create new session
    await prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
    });

    const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);
    const newSession = await prisma.session.create({
        data: {
            userId: session.userId,
            refreshTokenHash: "temp",
            expiresAt,
            userAgent: session.userAgent,
            ipAddress: session.ipAddress,
        },
        select: { id: true },
    });

    const newRefreshToken = signRefreshToken(newSession.id, session.userId);
    await prisma.session.update({
        where: { id: newSession.id },
        data: { refreshTokenHash: hashRefreshToken(newRefreshToken) },
    });

    const accessToken = signAccessToken(session.userId, session.user.role);

    return {
        accessToken,
        refreshToken: newRefreshToken,
    };
}

export async function logoutSession(refreshToken: string) {
    const { sid } = verifyRefreshToken(refreshToken);

    await prisma.session.updateMany({
        where: { id: sid, revokedAt: null },
        data: { revokedAt: new Date() },
    });

    return { ok: true };
}
