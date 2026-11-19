/**
 * Fallback countries/cities when GET /storefront/shipping/destinations
 * is unavailable. Checkout prefers the destinations API per market.
 */

export type ServiceCountry = {
  code: string;
  name: string;
  cities: readonly string[];
};

export const SERVICE_COUNTRIES: readonly ServiceCountry[] = [
  {
    code: "EG",
    name: "Egypt",
    cities: [
      "Cairo",
      "Giza",
      "Alexandria",
      "Mansoura",
      "Aswan",
      "Luxor",
      "Hurghada",
      "Sharm El Sheikh",
      "Port Said",
      "Tanta",
    ],
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    cities: [
      "Dubai",
      "Abu Dhabi",
      "Sharjah",
      "Ajman",
      "Ras Al Khaimah",
      "Fujairah",
      "Al Ain",
    ],
  },
  {
    code: "SA",
    name: "Saudi Arabia",
    cities: [
      "Riyadh",
      "Jeddah",
      "Dammam",
      "Mecca",
      "Medina",
      "Khobar",
      "Taif",
    ],
  },
] as const;

/** @deprecated Prefer SERVICE_COUNTRIES — Egypt cities for legacy imports. */
export const CITIES = SERVICE_COUNTRIES[0].cities;

export function getServiceCountry(code: string): ServiceCountry {
  const upper = code.toUpperCase();
  return (
    SERVICE_COUNTRIES.find((c) => c.code === upper) ?? SERVICE_COUNTRIES[0]
  );
}

export function citiesForCountry(code: string): readonly string[] {
  return getServiceCountry(code).cities;
}

/**
 * Optional map of country_code → market_id for quote when the shopper
 * picks a served country other than the catalog default.
 * Example: NEXT_PUBLIC_STORE_MARKET_IDS=EG:1,AE:2,SA:3
 */
export function parseStoreMarketIds(): Record<string, number> {
  const raw = process.env.NEXT_PUBLIC_STORE_MARKET_IDS || "";
  const out: Record<string, number> = {};
  for (const part of raw.split(",")) {
    const [code, idRaw] = part.trim().split(":");
    if (!code || !idRaw) continue;
    const id = Number(idRaw);
    if (Number.isFinite(id) && id > 0) {
      out[code.trim().toUpperCase()] = id;
    }
  }
  return out;
}

export function marketIdForCountry(
  countryCode: string,
  fallbackMarketId: number,
  defaultMarketCode = "EG",
): number {
  const map = parseStoreMarketIds();
  const code = countryCode.toUpperCase();
  if (map[code]) return map[code];
  if (code === defaultMarketCode.toUpperCase()) return fallbackMarketId;
  return fallbackMarketId;
}
