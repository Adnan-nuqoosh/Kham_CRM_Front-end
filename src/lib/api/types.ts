export type ApiSuccess<T = unknown> = {
  success: true;
  code: string;
  message: string;
  data: T;
  meta: Record<string, unknown>;
  errors: Record<string, unknown>;
};

export type ApiErrorBody = {
  success: false;
  code: string;
  message: string;
  data: unknown | null;
  meta: Record<string, unknown>;
  errors: Record<string, string[]>;
};

export type StorefrontLocale = "en" | "ar";

export type StorefrontVariant = {
  id: number;
  sku?: string | null;
  title?: string | null;
  price?: string | number | null;
  compare_at_price?: string | number | null;
  available_qty?: number;
  in_stock?: boolean;
};

export type StorefrontLinkedIngredient = {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
};

export type StorefrontProductMedia = {
  id: number;
  url: string;
  alt_text?: string | null;
  sort_order?: number;
};

/** Public product payload from GET /storefront/products… */
export type StorefrontProduct = {
  id: number;
  slug: string;
  badges?: string[];
  locale?: string;
  name: string;
  name_ar?: string | null;
  short_description?: string | null;
  description?: string | null;
  description_ar?: string | null;
  ingredients?: string | null;
  linked_ingredients?: StorefrontLinkedIngredient[];
  usage_instructions?: string | null;
  currency_code?: string;
  review_count?: number;
  average_rating?: number | null;
  variants?: StorefrontVariant[];
  image_url?: string | null;
  media?: StorefrontProductMedia[];
  brand_id?: number | null;
  brand_slug?: string | null;
  brand_name?: string | null;
  category_id?: number | null;
  category_slug?: string | null;
  category_name?: string | null;
};

export type StorefrontMarket = {
  id: number;
  code: string;
  name: string;
  country_code: string;
  currency_code: string;
  is_default?: boolean;
};

export type StorefrontSettings = {
  default_market_id?: number | null;
  default_market_code?: string | null;
  market_id?: number | null;
  market_code?: string | null;
  currency_code?: string | null;
  features?: {
    production_checkout_enabled?: boolean;
    customer_accounts_enabled?: boolean;
    wishlist_enabled?: boolean;
    coupons_enabled?: boolean;
    local_mock_checkout?: boolean;
  };
  checkout?: {
    ready?: boolean;
    reason_code?: string | null;
    blockers?: string[];
    tax_status?: string;
    is_final_payable_total?: boolean;
  };
};

export type StorefrontDestinations = {
  market_id: number;
  country_code: string;
  currency_code: string;
  cities: string[];
  other_cities_supported?: boolean;
  has_shipping_rules?: boolean;
};

export type StorefrontCustomer = {
  id: number;
  first_name: string;
  last_name?: string | null;
  email: string;
  phone?: string | null;
  full_name?: string;
};

export type StorefrontAuthSession = {
  token: string;
  token_type?: string;
  customer: StorefrontCustomer;
};

export type StorefrontAddress = {
  id: number;
  type: "shipping" | "billing";
  first_name: string;
  last_name?: string | null;
  phone?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postal_code?: string | null;
  country_code: string;
  is_default?: boolean;
};

export type StorefrontWishlistItem = {
  id: number;
  slug: string;
  name: string;
  name_ar?: string | null;
};

export type StorefrontOrderSummary = {
  id?: number;
  order_number: string;
  status?: string;
  payment_status?: string;
  fulfillment_status?: string;
  currency_code?: string;
  grand_total?: string | number;
  placed_at?: string | null;
  items_count?: number;
  created_at?: string;
};

export type StorefrontOrderDetail = {
  order_number: string;
  status?: string;
  payment_status?: string;
  fulfillment_status?: string;
  market_id?: number;
  currency_code?: string;
  subtotal?: string | number;
  discount_total?: string | number;
  shipping_total?: string | number;
  tax_total?: string | number;
  grand_total?: string | number;
  placed_at?: string | null;
  items?: unknown[];
  shipping_address?: StorefrontAddress | Record<string, unknown> | null;
  shipments?: Array<{
    carrier?: string | null;
    tracking_number?: string | null;
    status?: string | null;
    shipped_at?: string | null;
    delivered_at?: string | null;
  }>;
};

export type StorefrontCheckoutResult = {
  order_number?: string;
  payment_url?: string | null;
  payment_status?: string;
  initiation_status?: string;
};

export type StorefrontBrand = {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  origin_country?: string | null;
  logo_url?: string | null;
};

export type StorefrontCategory = {
  id: number;
  slug: string;
  parent_id?: number | null;
  name: string;
  name_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  image_url?: string | null;
  sort_order?: number;
  children?: StorefrontCategory[];
};

export type StorefrontCategoryDetail = {
  category: StorefrontCategory;
  products: Array<{ id: number; slug: string; name: string }>;
};

export type StorefrontBrandDetail = {
  brand: StorefrontBrand;
  products: Array<{ id: number; slug: string; name: string }>;
};

export type StorefrontIngredient = {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
};

export type StorefrontRitual = {
  id: number;
  slug: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  steps?: Array<{
    id: number;
    title: string;
    instructions: string;
    sort_order?: number;
  }>;
  products?: Array<{ id: number; slug: string; name: string }>;
};

export type StorefrontHomepageSection = {
  key: string;
  type: string;
  title: string;
  subtitle?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  content?: Record<string, unknown> | null;
  sort_order?: number;
};

export type StorefrontCommunity = {
  locale: string;
  title: string;
  intro: string;
  sections: Array<{
    key?: string | null;
    title: string;
    body: string;
    image_url?: string | null;
    link_url?: string | null;
  }>;
  links?: unknown;
};

export type StorefrontReviewSummary = {
  reviews: Array<{
    id: number;
    rating: number;
    title?: string | null;
    body?: string | null;
    reviewer_name?: string;
    verified_purchase?: boolean;
    created_at?: string;
  }>;
  review_count: number;
  average_rating: number | null;
};

export type StorefrontQuizQuestion = {
  id: number;
  question: string;
  options: Array<{ id: number; label: string }>;
};

export type StorefrontQuizRecommendation = {
  id: number;
  slug: string;
  name: string;
  score: number;
};

export type StorefrontQuoteItem = {
  variant_id: number;
  quantity: number;
  product_name?: string;
  variant_title?: string | null;
};

export type StorefrontQuote = {
  locale?: string;
  items: StorefrontQuoteItem[];
  market_id: number;
  currency_code: string;
  subtotal: string | number;
  discount_total: string | number;
  net_subtotal: string | number;
  shipping: {
    shipping_total?: string | number;
    city?: string;
    matched?: boolean;
    [key: string]: unknown;
  };
  total_before_tax: string | number;
  tax_status?: string;
  tax_total?: string | number | null;
  is_final_payable_total: boolean;
};

export type PartnerApplicationInput = {
  contact_name: string;
  email: string;
  phone?: string | null;
  company_name: string;
  website?: string | null;
  partner_type:
    | "retailer"
    | "distributor"
    | "influencer"
    | "corporate"
    | "other";
  message?: string | null;
};

/** @deprecated Use Storefront* types — kept for gradual migration aliases */
export type StoreProduct = StorefrontProduct;
export type StoreBrand = StorefrontBrand;
export type StoreIngredient = StorefrontIngredient;
export type StoreRitual = StorefrontRitual;
export type CartQuote = StorefrontQuote;
