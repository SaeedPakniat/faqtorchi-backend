export type ApiExchangeRate = {
  base: "IRR" | "IRT" | "USD" | "EUR";
  quote: "IRR" | "IRT" | "USD" | "EUR";
  rate: number;
  fetchedAt?: string;
};

import { USE_REAL_API, apiGet } from "./api";

type NavasanItem = {
  value: string | number;
  change?: number;
  timestamp?: number;
  date?: string;
};

const NAVASAN_BASE_URL =
  process.env.EXPO_PUBLIC_NAVASAN_API_BASE_URL ?? "https://api.navasan.tech";
const NAVASAN_API_KEY = process.env.EXPO_PUBLIC_NAVASAN_API_KEY ?? "";

const ITEM_BY_CURRENCY: Record<"USD" | "EUR", string> = {
  USD: "usd_sell",
  EUR: "eur",
};

function toNumber(value: string | number | undefined): number {
  if (value === undefined) return NaN;
  if (typeof value === "number") return value;
  const cleaned = value.replace(/,/g, "").trim();
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : NaN;
}

function buildNavasanUrl(item: string) {
  const url = new URL("/latest/", NAVASAN_BASE_URL);
  url.searchParams.set("api_key", NAVASAN_API_KEY);
  url.searchParams.set("item", item);
  return url.toString();
}

async function fetchNavasanItem(item: string): Promise<NavasanItem> {
  if (!NAVASAN_API_KEY) {
    throw new Error("Missing EXPO_PUBLIC_NAVASAN_API_KEY");
  }
  const res = await fetch(buildNavasanUrl(item));
  const isJson = res.headers.get("content-type")?.includes("json");
  const data = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && (data as any).message) ||
      (typeof data === "string" ? data : "Failed to fetch exchange rate");
    throw new Error(String(msg));
  }
  if (!data || typeof data !== "object" || !(item in data)) {
    throw new Error("Unexpected exchange rate response");
  }
  return (data as Record<string, NavasanItem>)[item];
}

async function resolveTomanPerCurrency(
  currencies: ApiExchangeRate["base"][]
): Promise<Record<ApiExchangeRate["base"], number>> {
  const result = {
    IRR: 0.1,
    IRT: 1,
    USD: NaN,
    EUR: NaN,
  } as Record<ApiExchangeRate["base"], number>;

  const needsUsd = currencies.includes("USD");
  const needsEur = currencies.includes("EUR");

  if (needsUsd) {
    const usdItem = await fetchNavasanItem(ITEM_BY_CURRENCY.USD);
    result.USD = toNumber(usdItem.value);
  }
  if (needsEur) {
    const eurItem = await fetchNavasanItem(ITEM_BY_CURRENCY.EUR);
    result.EUR = toNumber(eurItem.value);
  }

  return result;
}

export async function getExchangeRate(params: {
  base: ApiExchangeRate["base"];
  quote: ApiExchangeRate["quote"];
}) {
  const { base, quote } = params;
  if (USE_REAL_API) {
    return apiGet<{ rate: ApiExchangeRate }>("/exchange-rates", { query: { base, quote } });
  }
  if (base === quote) {
    return { rate: { base, quote, rate: 1, fetchedAt: new Date().toISOString() } };
  }

  const tomanPer = await resolveTomanPerCurrency([base, quote]);
  const baseToman = tomanPer[base];
  const quoteToman = tomanPer[quote];

  if (!Number.isFinite(baseToman) || !Number.isFinite(quoteToman) || quoteToman === 0) {
    throw new Error("Exchange rate unavailable");
  }

  const rate = baseToman / quoteToman;
  return {
    rate: {
      base,
      quote,
      rate,
      fetchedAt: new Date().toISOString(),
    },
  };
}
