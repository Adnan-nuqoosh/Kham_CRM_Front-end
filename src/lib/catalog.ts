/**
 * Money / shipping helpers for the storefront.
 * Product/brand/category data now comes from the Commerce API via CatalogProvider.
 */
export type { Currency, Locale } from "./money";
export {
  RATES,
  CURRENCY_META,
  formatMoney,
  formatPrice,
  FREE_SHIPPING_EGP,
  CITIES,
} from "./money";

export type { UiProduct as Product, UiBrand as Brand, UiCategory, UiIngredient as Ingredient } from "./api/mappers";
