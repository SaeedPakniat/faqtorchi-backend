import { getAccessToken, saveAccessToken } from "../store/auth/authStorage";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";
export const USE_REAL_API = process.env.EXPO_PUBLIC_USE_REAL_API === "true";

export type ApiError = {
  status: number;
  message: string;
  issues?: unknown;
  meta?: unknown;
};

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  auth?: boolean;
  _retry?: boolean;
};

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const base = path.startsWith("http")
    ? path
    : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  if (!query) return base;
  const url = new URL(base);
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined) continue;
    url.searchParams.set(k, String(v));
  }
  return url.toString();
}

async function readResponseBody(res: Response): Promise<{
  data: unknown;
  isJson: boolean;
}> {
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json") || contentType.includes("+json");

  if (isJson) {
    try {
      return { data: await res.json(), isJson: true };
    } catch {
      const text = await res.text();
      return { data: text, isJson: false };
    }
  }

  const text = await res.text();
  return { data: text, isJson: false };
}

function normalizeError(status: number, data: unknown): ApiError {
  if (data && typeof data === "object") {
    const msg =
      (data as any).message ||
      (data as any).error ||
      (data as any).detail ||
      "Request failed";
    return {
      status,
      message: String(msg),
      issues: (data as any).issues ?? (data as any).errors,
      meta: (data as any).meta ?? data,
    };
  }
  return {
    status,
    message: typeof data === "string" && data.trim() ? data : "Request failed",
  };
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { query, auth = true, body, headers, ...rest } = options;

  const url = buildUrl(path, query);
  const finalHeaders = new Headers(headers ?? {});

  let bodyToSend: BodyInit | undefined = undefined;
  if (body !== undefined) {
    if (body instanceof FormData) {
      bodyToSend = body;
    } else if (typeof body === "string") {
      bodyToSend = body;
      if (!finalHeaders.has("Content-Type")) {
        finalHeaders.set("Content-Type", "text/plain");
      }
    } else {
      bodyToSend = JSON.stringify(body);
      if (!finalHeaders.has("Content-Type")) {
        finalHeaders.set("Content-Type", "application/json");
      }
    }
  }

  if (auth) {
    const token = await getAccessToken();
    if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  try {
    const res = await fetch(url, {
      ...rest,
      headers: finalHeaders,
      body: bodyToSend,
    });

    if (res.status === 401 && auth && !options._retry && !path.includes("/auth/refresh")) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return apiRequest<T>(path, { ...options, _retry: true });
      }
    }

    const { data } = await readResponseBody(res);

    if (!res.ok) {
      throw normalizeError(res.status, data);
    }

    return data as T;
  } catch (err: any) {
    if (err && typeof err === "object" && "status" in err) {
      throw err as ApiError;
    }
    throw {
      status: 0,
      message: err?.message || "Network error",
    } as ApiError;
  }
}

export function apiGet<T>(path: string, options: RequestOptions = {}) {
  return apiRequest<T>(path, { ...options, method: "GET" });
}

export function apiPost<T>(path: string, body?: unknown, options: RequestOptions = {}) {
  return apiRequest<T>(path, { ...options, method: "POST", body });
}

export function apiPatch<T>(path: string, body?: unknown, options: RequestOptions = {}) {
  return apiRequest<T>(path, { ...options, method: "PATCH", body });
}

export function apiPut<T>(path: string, body?: unknown, options: RequestOptions = {}) {
  return apiRequest<T>(path, { ...options, method: "PUT", body });
}

export function apiDelete<T>(path: string, options: RequestOptions = {}) {
  return apiRequest<T>(path, { ...options, method: "DELETE" });
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(buildUrl("/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const { data } = await readResponseBody(res);
    if (!res.ok) return null;
    const token = (data as any)?.accessToken;
    if (typeof token === "string" && token.length > 0) {
      await saveAccessToken(token);
      return token;
    }
    return null;
  } catch {
    return null;
  }
}
