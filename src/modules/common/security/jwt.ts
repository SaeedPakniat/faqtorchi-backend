import jwt, { JwtPayload } from "jsonwebtoken";

const must = (v: string | undefined, name: string) => {
    if (!v) throw new Error(`Missing env: ${name}`);
    return v;
};

const ACCESS_SECRET = must(process.env.JWT_ACCESS_SECRET, "JWT_ACCESS_SECRET");
const REFRESH_SECRET = must(process.env.JWT_REFRESH_SECRET, "JWT_REFRESH_SECRET");

const ACCESS_TTL = Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? "900");       // 15m
const REFRESH_TTL = Number(process.env.REFRESH_TOKEN_TTL_SECONDS ?? "2592000"); // 30d

export function signAccessToken(userId: number, role: string) {
    return jwt.sign({ sub: userId, role }, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}

export function signRefreshToken(sessionId: number, userId: number) {
    return jwt.sign({ sid: sessionId, sub: userId }, REFRESH_SECRET, { expiresIn: REFRESH_TTL });
}

function asObjectPayload(payload: string | JwtPayload): JwtPayload {
    if (typeof payload === "string") {
        throw Object.assign(new Error("Invalid token payload"), { status: 401 });
    }
    return payload;
}

export function verifyAccessToken(token: string): { sub: number; role: string } {
    const raw = jwt.verify(token, ACCESS_SECRET);
    const p = asObjectPayload(raw);

    const sub = p.sub;
    const role = (p as any).role;

    if (sub === undefined) {
        throw Object.assign(new Error("Invalid token"), { status: 401 });
    }

    const userId = Number(sub);
    if (!Number.isInteger(userId)) {
        throw Object.assign(new Error("Invalid token"), { status: 401 });
    }
    if (typeof role !== "string") {
        throw Object.assign(new Error("Invalid token"), { status: 401 });
    }

    return { sub: userId, role };
}

export function verifyRefreshToken(token: string): { sid: number; sub: number } {
    const raw = jwt.verify(token, REFRESH_SECRET);
    const p = asObjectPayload(raw);

    const sid = (p as any).sid;
    const sub = p.sub;

    if (sub === undefined) {
        throw Object.assign(new Error("Invalid token"), { status: 401 });
    }

    const userId = Number(sub);
    if (!Number.isInteger(userId)) {
        throw Object.assign(new Error("Invalid token"), { status: 401 });
    }
    if (!Number.isInteger(sid)) {
        throw Object.assign(new Error("Invalid token"), { status: 401 });
    }

    return { sid, sub: userId };
}
