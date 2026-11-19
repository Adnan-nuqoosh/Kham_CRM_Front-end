import { getStoreMarket, getStoreMarketId } from "@/lib/api/client";
import type { StorefrontMarket } from "@/lib/api/types";
import {
  SERVICE_COUNTRIES,
  parseStoreMarketIds,
} from "@/lib/shipping-regions";

/**
 * Storefront sales markets. Prefer live GET /storefront/markets via
 * `setLiveMarkets`; env map / hardcoded list remain fallbacks.
 */
export type StoreMarket = {
  id?: number;
  code: string;
  name: string;
  /** ISO currency typically used for this market (display fallback). */
  currencyCode: string;
  countryCode: string;
  isDefault?: boolean;
};

export const FALLBACK_STORE_MARKETS: readonly StoreMarket[] = [
  { code: "EG", name: "Egypt", currencyCode: "EGP", countryCode: "EG" },
  {
    code: "AE",
    name: "United Arab Emirates",
    currencyCode: "AED",
    countryCode: "AE",
  },
  { code: "SA", name: "Saudi Arabia", currencyCode: "SAR", countryCode: "SA" },
] as const;

/** @deprecated Prefer getStoreMarkets() — kept for static imports. */
export const STORE_MARKETS = FALLBACK_STORE_MARKETS;

let liveMarkets: StoreMarket[] | null = null;

export function setLiveMarkets(rows: StorefrontMarket[]) {
  liveMarkets = rows.map((m) => ({
    id: m.id,
    code: String(m.code).toUpperCase(),
    name: m.name,
    currencyCode: String(m.currency_code || "").toUpperCase(),
    countryCode: String(m.country_code || m.code).toUpperCase(),
    isDefault: Boolean(m.is_default),
  }));
}

export function getStoreMarkets(): StoreMarket[] {
  if (liveMarkets && liveMarkets.length > 0) return liveMarkets;
  return [...FALLBACK_STORE_MARKETS];
}

export function getStoreMarketByCode(code: string): StoreMarket {
  const upper = code.toUpperCase();
  return (
    getStoreMarkets().find((m) => m.code === upper) ?? getStoreMarkets()[0]
  );
}

/** Resolve numeric market_id for a market/country code. */
export function resolveMarketId(code: string): number {
  const upper = code.toUpperCase();
  const live = getStoreMarkets().find((m) => m.code === upper);
  if (live?.id) return live.id;

  const map = parseStoreMarketIds();
  if (map[upper]) return map[upper];
  if (upper === getStoreMarket()) return getStoreMarketId();
  const fallbacks: Record<string, number> = { EG: 1, AE: 2, SA: 3 };
  return fallbacks[upper] ?? getStoreMarketId();
}

export function marketSelectOptions() {
  return getStoreMarkets().map((m) => ({
    value: m.code,
    label: `${m.name} (${m.currencyCode})`,
  }));
}

export function defaultCityForMarket(code: string): string {
  const country =
    SERVICE_COUNTRIES.find((c) => c.code === code.toUpperCase()) ??
    SERVICE_COUNTRIES[0];
  return country.cities[0] ?? "";
}

export function mapApiMarketToStore(m: StorefrontMarket): StoreMarket {
  return {
    id: m.id,
    code: String(m.code).toUpperCase(),
    name: m.name,
    currencyCode: String(m.currency_code || "").toUpperCase(),
    countryCode: String(m.country_code || m.code).toUpperCase(),
    isDefault: Boolean(m.is_default),
  };
}
