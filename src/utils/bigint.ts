export function toBigInt(value: number | string | bigint): bigint {
    if (typeof value === "bigint") return value;
    if (typeof value === "number") {
        if (!Number.isInteger(value) || value < 0) {
            throw Object.assign(new Error("Invalid money value"), { status: 400 });
        }
        return BigInt(value);
    }
    if (!/^\d+$/.test(value)) {
        throw Object.assign(new Error("Invalid money value"), { status: 400 });
    }
    return BigInt(value);
}

export function serializeBigInt<T>(value: T): T {
    if (typeof value === "bigint") {
        return value.toString() as T;
    }
    if (value instanceof Date) {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map((item) => serializeBigInt(item)) as T;
    }
    if (value && typeof value === "object") {
        const result: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
            result[key] = serializeBigInt(val);
        }
        return result as T;
    }
    return value;
}
