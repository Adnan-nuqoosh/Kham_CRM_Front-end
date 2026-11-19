import { apiRequest, getStoreLocale, getStoreMarketId } from "./client";
import type {
  PartnerApplicationInput,
  StorefrontAddress,
  StorefrontAuthSession,
  StorefrontBrand,
  StorefrontBrandDetail,
  StorefrontCategory,
  StorefrontCategoryDetail,
  StorefrontCheckoutResult,
  StorefrontCommunity,
  StorefrontCustomer,
  StorefrontDestinations,
  StorefrontHomepageSection,
  StorefrontIngredient,
  StorefrontLocale,
  StorefrontMarket,
  StorefrontOrderDetail,
  StorefrontOrderSummary,
  StorefrontProduct,
  StorefrontQuizQuestion,
  StorefrontQuizRecommendation,
  StorefrontQuote,
  StorefrontReviewSummary,
  StorefrontRitual,
  StorefrontSettings,
  StorefrontWishlistItem,
} from "./types";

function localeQuery(locale?: StorefrontLocale) {
  return { locale: locale || getStoreLocale() };
}

function marketId(market?: number) {
  return market ?? getStoreMarketId();
}

async function collectPages<T>(
  fetchPage: (
    page: number,
  ) => Promise<{ data: T[]; meta: Record<string, unknown> }>,
  maxPages = 20,
): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  while (page <= maxPages) {
    const res = await fetchPage(page);
    all.push(...(res.data ?? []));
    const last = Number(res.meta?.last_page ?? 1);
    if (!Number.isFinite(last) || page >= last) break;
    page += 1;
  }
  return all;
}

export const storeApi = {
  markets() {
    return apiRequest<StorefrontMarket[]>("/storefront/markets");
  },

  settings(market?: number) {
    return apiRequest<StorefrontSettings>("/storefront/settings", {
      query: { market_id: marketId(market) },
    });
  },

  destinations(market?: number) {
    return apiRequest<StorefrontDestinations>(
      "/storefront/shipping/destinations",
      { query: { market_id: marketId(market) } },
    );
  },

  register(payload: {
    first_name: string;
    last_name?: string | null;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
  }) {
    return apiRequest<StorefrontAuthSession>("/storefront/auth/register", {
      method: "POST",
      body: payload,
    });
  },

  login(payload: { email: string; password: string }) {
    return apiRequest<StorefrontAuthSession>("/storefront/auth/login", {
      method: "POST",
      body: payload,
    });
  },

  me() {
    return apiRequest<StorefrontCustomer>("/storefront/auth/me", {
      auth: true,
    });
  },

  logout() {
    return apiRequest<null>("/storefront/auth/logout", {
      method: "POST",
      auth: true,
    });
  },

  addresses() {
    return apiRequest<StorefrontAddress[]>("/storefront/addresses", {
      auth: true,
    });
  },

  createAddress(
    payload: Omit<StorefrontAddress, "id"> & { is_default?: boolean },
  ) {
    return apiRequest<StorefrontAddress>("/storefront/addresses", {
      method: "POST",
      auth: true,
      body: payload,
    });
  },

  updateAddress(
    id: number,
    payload: Partial<Omit<StorefrontAddress, "id">>,
  ) {
    return apiRequest<StorefrontAddress>(`/storefront/addresses/${id}`, {
      method: "PATCH",
      auth: true,
      body: payload,
    });
  },

  deleteAddress(id: number) {
    return apiRequest<null>(`/storefront/addresses/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },

  wishlist() {
    return apiRequest<StorefrontWishlistItem[]>("/storefront/wishlist", {
      auth: true,
    });
  },

  addWishlist(productId: number) {
    return apiRequest<{ product_id: number }>("/storefront/wishlist", {
      method: "POST",
      auth: true,
      body: { product_id: productId },
    });
  },

  removeWishlist(productId: number) {
    return apiRequest<null>(`/storefront/wishlist/${productId}`, {
      method: "DELETE",
      auth: true,
    });
  },

  orders(params: { page?: number; per_page?: number } = {}) {
    return apiRequest<StorefrontOrderSummary[]>("/storefront/orders", {
      auth: true,
      query: {
        page: params.page,
        per_page: params.per_page ?? 15,
      },
    });
  },

  order(orderNumber: string) {
    return apiRequest<StorefrontOrderDetail>(
      `/storefront/orders/${encodeURIComponent(orderNumber)}`,
      { auth: true },
    );
  },

  submitReview(
    product: number | string,
    payload: {
      order_item_id: number;
      rating: number;
      title?: string | null;
      body?: string | null;
    },
  ) {
    return apiRequest<unknown>(
      `/storefront/products/${encodeURIComponent(String(product))}/reviews`,
      { method: "POST", auth: true, body: payload },
    );
  },

  /**
   * Authenticated production checkout (MyFatoorah live). Returns 503 until
   * backend readiness gates pass.
   */
  checkout(payload: {
    idempotency_key: string;
    market_id?: number;
    payment_method: "CARD" | "APPLE_PAY" | "GOOGLE_PAY" | "KNET";
    items: Array<{ variant_id: number; quantity: number }>;
    shipping_address: {
      first_name: string;
      last_name?: string | null;
      phone?: string | null;
      line1: string;
      line2?: string | null;
      city: string;
      state?: string | null;
      postal_code?: string | null;
      country_code: string;
    };
  }) {
    return apiRequest<StorefrontCheckoutResult>("/storefront/checkout", {
      method: "POST",
      auth: true,
      body: {
        ...payload,
        market_id: marketId(payload.market_id),
      },
    });
  },

  /** Published homepage CMS sections */
  homepage(locale?: StorefrontLocale) {
    return apiRequest<StorefrontHomepageSection[]>("/storefront/homepage", {
      query: localeQuery(locale),
    });
  },

  community(locale?: StorefrontLocale) {
    return apiRequest<StorefrontCommunity>("/storefront/community", {
      query: localeQuery(locale),
    });
  },

  brands(params: { search?: string; page?: number; per_page?: number } = {}) {
    return apiRequest<StorefrontBrand[]>("/storefront/brands", {
      query: {
        ...localeQuery(),
        search: params.search,
        page: params.page,
        per_page: params.per_page ?? 100,
      },
    });
  },

  async allBrands() {
    return collectPages((page) =>
      storeApi.brands({ page, per_page: 100 }).then((r) => ({
        data: r.data,
        meta: r.meta,
      })),
    );
  },

  brand(slug: string, market?: number) {
    return apiRequest<StorefrontBrandDetail>(
      `/storefront/brands/${encodeURIComponent(slug)}`,
      {
        query: {
          ...localeQuery(),
          market_id: marketId(market),
        },
      },
    );
  },

  categories(
    params: {
      search?: string;
      page?: number;
      per_page?: number;
      tree?: boolean;
      parent_id?: number | null;
    } = {},
  ) {
    return apiRequest<StorefrontCategory[]>("/storefront/categories", {
      query: {
        ...localeQuery(),
        search: params.search,
        page: params.page,
        per_page: params.per_page ?? 100,
        tree: params.tree ? 1 : undefined,
        parent_id: params.parent_id,
      },
    });
  },

  async allCategories() {
    return collectPages((page) =>
      storeApi.categories({ page, per_page: 100 }).then((r) => ({
        data: r.data,
        meta: r.meta,
      })),
    );
  },

  category(slug: string, market?: number) {
    return apiRequest<StorefrontCategoryDetail>(
      `/storefront/categories/${encodeURIComponent(slug)}`,
      {
        query: {
          ...localeQuery(),
          market_id: marketId(market),
        },
      },
    );
  },

  products(
    params: {
      market?: number;
      search?: string;
      brand?: string;
      category?: string;
      sort?: "newest" | "name" | "price_asc" | "price_desc";
      page?: number;
      per_page?: number;
    } = {},
  ) {
    return apiRequest<StorefrontProduct[]>("/storefront/products", {
      query: {
        ...localeQuery(),
        market_id: marketId(params.market),
        search: params.search,
        brand: params.brand,
        category: params.category,
        sort: params.sort,
        page: params.page,
        per_page: params.per_page ?? 100,
      },
    });
  },

  async allProducts(market?: number) {
    return collectPages((page) =>
      storeApi
        .products({ market, page, per_page: 100 })
        .then((r) => ({ data: r.data, meta: r.meta })),
    );
  },

  product(productId: number | string, market?: number) {
    return apiRequest<StorefrontProduct>(
      `/storefront/products/${encodeURIComponent(String(productId))}`,
      {
        query: {
          ...localeQuery(),
          market_id: marketId(market),
        },
      },
    );
  },

  /** Product detail by slug or numeric id. */
  productBySlug(slug: string, market?: number) {
    return storeApi.product(slug, market);
  },

  productReviews(
    productId: number | string,
    params: { page?: number; per_page?: number } = {},
  ) {
    return apiRequest<StorefrontReviewSummary>(
      `/storefront/products/${encodeURIComponent(String(productId))}/reviews`,
      {
        query: {
          page: params.page,
          per_page: params.per_page ?? 10,
        },
      },
    );
  },

  ingredients(params: { search?: string; page?: number; per_page?: number } = {}) {
    return apiRequest<StorefrontIngredient[]>("/storefront/ingredients", {
      query: {
        ...localeQuery(),
        search: params.search,
        page: params.page,
        per_page: params.per_page ?? 100,
      },
    });
  },

  async allIngredients() {
    return collectPages((page) =>
      storeApi.ingredients({ page, per_page: 100 }).then((r) => ({
        data: r.data,
        meta: r.meta,
      })),
    );
  },

  ingredient(slug: string) {
    return apiRequest<StorefrontIngredient>(
      `/storefront/ingredients/${encodeURIComponent(slug)}`,
      { query: localeQuery() },
    );
  },

  rituals(params: { page?: number; per_page?: number } = {}) {
    return apiRequest<StorefrontRitual[]>("/storefront/rituals", {
      query: {
        ...localeQuery(),
        page: params.page,
        per_page: params.per_page ?? 100,
      },
    });
  },

  async allRituals() {
    return collectPages((page) =>
      storeApi.rituals({ page, per_page: 100 }).then((r) => ({
        data: r.data,
        meta: r.meta,
      })),
    );
  },

  ritual(slug: string) {
    return apiRequest<StorefrontRitual>(
      `/storefront/rituals/${encodeURIComponent(slug)}`,
      { query: localeQuery() },
    );
  },

  ritualQuizQuestions(locale?: StorefrontLocale) {
    return apiRequest<StorefrontQuizQuestion[]>(
      "/storefront/ritual-quiz/questions",
      { query: localeQuery(locale) },
    );
  },

  ritualQuizRecommendations(payload: {
    market_id?: number;
    option_ids: number[];
  }) {
    return apiRequest<StorefrontQuizRecommendation[]>(
      "/storefront/ritual-quiz/recommendations",
      {
        method: "POST",
        body: {
          market_id: marketId(payload.market_id),
          option_ids: payload.option_ids,
        },
        query: localeQuery(),
      },
    );
  },

  /**
   * Public non-binding quote. Requires shipping city/country.
   * Coupons and client prices are not accepted by the API.
   */
  quote(payload: {
    market_id?: number;
    items: Array<{ variant_id: number; quantity: number }>;
    shipping_address: { country_code: string; city: string };
  }) {
    return apiRequest<StorefrontQuote>("/storefront/checkout/quote", {
      method: "POST",
      body: {
        market_id: marketId(payload.market_id),
        items: payload.items,
        shipping_address: payload.shipping_address,
      },
      query: localeQuery(),
    });
  },

  /**
   * Local/testing guest checkout only. Backend returns 404 unless enabled.
   * payment_method must be mock_fatoora.
   */
  testCheckout(payload: {
    idempotency_key: string;
    market_id?: number;
    items: Array<{ variant_id: number; quantity: number }>;
    customer: {
      first_name: string;
      last_name?: string | null;
      email: string;
      phone: string;
    };
    shipping_address: {
      first_name: string;
      last_name?: string | null;
      phone?: string | null;
      line1: string;
      line2?: string | null;
      city: string;
      state?: string | null;
      postal_code?: string | null;
      country_code: string;
    };
  }) {
    return apiRequest<unknown>("/storefront/checkout/test-order", {
      method: "POST",
      body: {
        ...payload,
        market_id: marketId(payload.market_id),
        payment_method: "mock_fatoora",
      },
    });
  },

  applyPartner(payload: PartnerApplicationInput) {
    return apiRequest<null>("/storefront/partners/apply", {
      method: "POST",
      body: payload,
    });
  },

  newsletterSubscribe(email: string) {
    return apiRequest<null>("/storefront/newsletter/subscribe", {
      method: "POST",
      body: { email },
    });
  },

  newsletterUnsubscribe(token: string) {
    return apiRequest<null>("/storefront/newsletter/unsubscribe", {
      method: "POST",
      body: { token },
    });
  },
};
