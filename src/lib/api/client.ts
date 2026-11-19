import type { ApiErrorBody, ApiSuccess, StorefrontLocale } from "./types";

const TOKEN_KEY = "kham-store-token";

export class ApiClientError extends Error {
  status: number;
  code: string;
  errors: Record<string, string[]>;

  constructor(
    message: string,
    opts: { status: number; code?: string; errors?: Record<string, string[]> },
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = opts.status;
    this.code = opts.code ?? "UNKNOWN";
    this.errors = opts.errors ?? {};
  }
}

export function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:8000/api/v1"
  );
}

/** Display / legacy market code (e.g. EG). */
export function getStoreMarket(): string {
  return (process.env.NEXT_PUBLIC_STORE_MARKET || "EG").toUpperCase();
}

/**
 * Numeric market id required by /storefront/* APIs.
 * Default 1 matches typical Egypt seed order — override via env.
 */
export function getStoreMarketId(): number {
  const raw = process.env.NEXT_PUBLIC_STORE_MARKET_ID;
  const n = raw ? Number(raw) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** Runtime locale for API queries — kept in sync with the shop `locale` state. */
let runtimeLocale: StorefrontLocale | null = null;

export function setStoreLocale(locale: StorefrontLocale | null) {
  runtimeLocale = locale === "ar" ? "ar" : locale === "en" ? "en" : null;
}

export function getStoreLocale(): StorefrontLocale {
  if (runtimeLocale) return runtimeLocale;
  const loc = (process.env.NEXT_PUBLIC_STORE_LOCALE || "en").toLowerCase();
  return loc === "ar" ? "ar" : "en";
}

export function getStoreToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoreToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  auth?: boolean;
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const base = getApiBaseUrl();
  const url = new URL(
    path.startsWith("http")
      ? path
      : `${base}${path.startsWith("/") ? path : `/${path}`}`,
  );
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiSuccess<T>> {
  const { method = "GET", body, query, auth = false, signal } = options;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = getStoreToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  const json = (await res.json().catch(() => null)) as
    | ApiSuccess<T>
    | ApiErrorBody
    | null;

  if (!res.ok || !json || json.success !== true) {
    const err = json && "success" in json && json.success === false ? json : null;
    throw new ApiClientError(err?.message || `Request failed (${res.status})`, {
      status: res.status,
      code: err?.code,
      errors: err?.errors,
    });
  }

  return json;
}

/** Resolve API media paths that may be relative. */
export function mediaUrl(path?: string | null): string {
  if (!path) return "/images/products/serum.jpg";
  const value = String(path).trim();
  if (!value) return "/images/products/serum.jpg";

  // Demo catalog assets live in the storefront `public/images` folder.
  const imagesIdx = value.indexOf("/images/");
  if (imagesIdx >= 0) return value.slice(imagesIdx);

  if (/^(https?:|data:|blob:)/i.test(value)) return value;

  const apiRoot = getApiBaseUrl().replace(/\/api\/v\d+\/?$/i, "");
  if (value.startsWith("/storage/")) return `${apiRoot}${value}`;
  if (value.startsWith("storage/")) return `${apiRoot}/${value}`;
  return value.startsWith("/") ? `${apiRoot}${value}` : `${apiRoot}/storage/${value}`;
}
