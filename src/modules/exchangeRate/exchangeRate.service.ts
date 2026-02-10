import { prisma } from "../../prisma/client";
import { Currency } from "@prisma/client";
import { env } from "../../config/env";
import { moneyBigIntSchema } from "../../utils/validation";

const STUB_RATES_TO_IRR: Record<string, bigint> = {
    IRR: 1n,
    IRT: 10n,
    USD: 420000n,
    EUR: 450000n,
};

function fetchStubRate(base: Currency, quote: Currency): bigint {
    if (base === quote) return 1n;
    if (quote === "IRR" && STUB_RATES_TO_IRR[base]) {
        return STUB_RATES_TO_IRR[base];
    }
    throw Object.assign(new Error("Unsupported currency pair for stub provider"), { status: 400 });
}

async function fetchHttpRate(base: Currency, quote: Currency): Promise<bigint> {
    if (!env.EXCHANGE_RATE_URL) {
        throw Object.assign(new Error("EXCHANGE_RATE_URL is not configured"), { status: 500 });
    }
    const url = new URL(env.EXCHANGE_RATE_URL);
    url.searchParams.set("base", base);
    url.searchParams.set("quote", quote);

    const resp = await fetch(url.toString(), { method: "GET" });
    if (!resp.ok) {
        throw Object.assign(new Error("Failed to fetch exchange rate"), { status: 502 });
    }
    const data = await resp.json();
    const raw = data?.rate ?? data?.value;
    if (raw === undefined || raw === null) {
        throw Object.assign(new Error("Invalid exchange rate response"), { status: 502 });
    }
    return moneyBigIntSchema.parse(raw);
}

async function fetchRate(base: Currency, quote: Currency): Promise<bigint> {
    if (env.EXCHANGE_RATE_PROVIDER === "http") {
        return fetchHttpRate(base, quote);
    }
    return fetchStubRate(base, quote);
}

export async function getExchangeRateSnapshot(params: { base: Currency; quote: Currency }) {
    const cacheMs = env.EXCHANGE_RATE_CACHE_MINUTES * 60 * 1000;
    const cutoff = new Date(Date.now() - cacheMs);

    const latest = await prisma.exchangeRate.findFirst({
        where: { base: params.base, quote: params.quote },
        orderBy: { fetchedAt: "desc" },
    });

    if (latest && latest.fetchedAt >= cutoff) {
        return { base: latest.base, quote: latest.quote, rate: latest.rate, fetchedAt: latest.fetchedAt };
    }

    const rate = await fetchRate(params.base, params.quote);
    const created = await prisma.exchangeRate.create({
        data: {
            base: params.base,
            quote: params.quote,
            rate,
        },
        select: { base: true, quote: true, rate: true, fetchedAt: true },
    });

    return created;
}
