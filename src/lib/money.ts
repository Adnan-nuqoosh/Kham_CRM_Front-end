export type Currency = "EGP" | "USD" | "AED" | "EUR" | "SAR";
export type Locale = "en" | "ar";

export const RATES: Record<Currency, number> = {
  EGP: 1,
  USD: 1 / 49.5,
  AED: 1 / 13.47,
  EUR: 1 / 53.2,
  SAR: 1 / 13.2,
};

export const CURRENCY_META: Record<Currency, { label: string; locale: string }> = {
  EGP: { label: "Egypt (EGP)", locale: "en-EG" },
  USD: { label: "USD", locale: "en-US" },
  AED: { label: "UAE (AED)", locale: "en-AE" },
  EUR: { label: "EUR", locale: "de-DE" },
  SAR: { label: "Saudi (SAR)", locale: "en-SA" },
};

/** Format an amount already in the given currency (API market prices). */
export function formatMoney(amount: number, currency: string) {
  const code = (currency || "EGP").toUpperCase() as Currency;
  const known = CURRENCY_META[code];
  const fraction = code === "EGP" ? 0 : 2;
  const formatted = new Intl.NumberFormat(known?.locale || "en", {
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  }).format(amount);
  return `${code} ${formatted}`;
}

/** @deprecated Prefer formatMoney with market currency from API. */
export function formatPrice(egp: number, currency: Currency) {
  const value = egp * RATES[currency];
  return formatMoney(value, currency);
}

export const FREE_SHIPPING_EGP = 1000;

/** @deprecated Import from `@/lib/shipping-regions` instead. */
export { CITIES } from "@/lib/shipping-regions";
