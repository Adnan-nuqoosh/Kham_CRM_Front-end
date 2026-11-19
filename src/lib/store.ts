"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Currency, Locale } from "./money";
import { getStoreMarket, setStoreLocale, setStoreToken, storeApi } from "./api";
import { refreshCartForLocale, syncCartForMarket } from "./cart-market";
import {
  getStoreMarketByCode,
  resolveMarketId,
  setLiveMarkets,
} from "./markets";

export interface CartLine {
  /** Product slug for links/display */
  slug: string;
  /** First sellable variant — required for quote/checkout */
  variantId: number;
  productId: number;
  name: string;
  image: string;
  unitPrice: number;
  qty: number;
}

export interface GuestUser {
  id?: number;
  name: string;
  email: string;
  phone?: string;
}

export interface Order {
  id: string;
  createdAt: string;
  lines: CartLine[];
  totalEgp: number;
  city: string;
  name: string;
}

interface ShopState {
  cart: CartLine[];
  /** Last known bag per market (snapshot on leave / after sync). Active cart always migrates. */
  cartsByMarket: Record<string, CartLine[]>;
  wishlist: string[];
  wishlistIds: number[];
  /** Sales market code (EG | AE | SA) — drives catalog market_id. */
  marketCode: string;
  /** Display currency synced from the selected market (not FX conversion). */
  currency: Currency;
  locale: Locale;
  user: GuestUser | null;
  token: string | null;
  orders: Order[];
  recent: string[];
  checkoutReady: boolean;
  sandboxCheckoutReady: boolean;
  localMockCheckout: boolean;
  marketSwitching: boolean;
  addToCart: (line: Omit<CartLine, "qty"> & { qty?: number }) => void;
  setQty: (variantId: number, qty: number) => void;
  removeFromCart: (variantId: number) => void;
  clearCart: () => void;
  toggleWishlist: (slug: string, productId?: number) => Promise<void>;
  setMarketCode: (code: string) => Promise<void>;
  /** @deprecated Prefer setMarketCode — kept for older callers. */
  setCurrency: (c: Currency) => void;
  setLocale: (l: Locale) => Promise<void>;
  setSession: (user: GuestUser, token: string) => void;
  signInLocal: (user: GuestUser) => void;
  signOut: () => Promise<void>;
  placeOrder: (order: Omit<Order, "id" | "createdAt">) => Order;
  viewProduct: (slug: string) => void;
  hydrateAuth: () => Promise<void>;
  syncWishlistFromApi: () => Promise<void>;
  bootstrapMarkets: () => Promise<void>;
}

function customerToUser(customer: {
  id: number;
  first_name: string;
  last_name?: string | null;
  email: string;
  phone?: string | null;
  full_name?: string;
}): GuestUser {
  const name =
    customer.full_name?.trim() ||
    [customer.first_name, customer.last_name].filter(Boolean).join(" ").trim() ||
    customer.email;
  return {
    id: customer.id,
    name,
    email: customer.email,
    phone: customer.phone ?? undefined,
  };
}

const initialMarket = getStoreMarketByCode(getStoreMarket());

export const useShop = create<ShopState>()(
  persist(
    (set, get) => ({
      cart: [],
      cartsByMarket: {},
      wishlist: [],
      wishlistIds: [],
      marketCode: initialMarket.code,
      currency: initialMarket.currencyCode as Currency,
      locale: "en",
      user: null,
      token: null,
      orders: [],
      recent: [],
      checkoutReady: false,
      sandboxCheckoutReady: false,
      localMockCheckout: false,
      marketSwitching: false,
      addToCart: (line) => {
        const qty = line.qty ?? 1;
        const cart = [...get().cart];
        const i = cart.findIndex((l) => l.variantId === line.variantId);
        if (i >= 0) cart[i] = { ...cart[i], qty: cart[i].qty + qty };
        else cart.push({ ...line, qty });
        const marketCode = get().marketCode;
        set({
          cart,
          cartsByMarket: { ...get().cartsByMarket, [marketCode]: cart },
        });
      },
      setQty: (variantId, qty) => {
        const marketCode = get().marketCode;
        let cart: CartLine[];
        if (qty <= 0) {
          cart = get().cart.filter((l) => l.variantId !== variantId);
        } else {
          cart = get().cart.map((l) =>
            l.variantId === variantId ? { ...l, qty } : l,
          );
        }
        set({
          cart,
          cartsByMarket: { ...get().cartsByMarket, [marketCode]: cart },
        });
      },
      removeFromCart: (variantId) => {
        const cart = get().cart.filter((l) => l.variantId !== variantId);
        const marketCode = get().marketCode;
        set({
          cart,
          cartsByMarket: { ...get().cartsByMarket, [marketCode]: cart },
        });
      },
      clearCart: () => {
        const marketCode = get().marketCode;
        set({
          cart: [],
          cartsByMarket: { ...get().cartsByMarket, [marketCode]: [] },
        });
      },
      toggleWishlist: async (slug, productId) => {
        const { wishlist, wishlistIds, token } = get();
        const loved = wishlist.includes(slug);
        const nextSlugs = loved
          ? wishlist.filter((s) => s !== slug)
          : [...wishlist, slug];
        const nextIds =
          productId == null
            ? wishlistIds
            : loved
              ? wishlistIds.filter((id) => id !== productId)
              : [...wishlistIds, productId];
        set({ wishlist: nextSlugs, wishlistIds: nextIds });

        if (!token || productId == null) return;
        try {
          if (loved) await storeApi.removeWishlist(productId);
          else await storeApi.addWishlist(productId);
        } catch {
          set({ wishlist, wishlistIds });
        }
      },
      setMarketCode: async (code) => {
        const market = getStoreMarketByCode(code);
        const prev = get().marketCode;
        if (prev === market.code) return;
        if (get().marketSwitching) return;

        // Always migrate the *active* bag into the destination market.
        // Restoring a stale destination snapshot made it look like products
        // were deleted when the catalogs are shared across markets.
        const seed = [...get().cart];
        const cartsByMarket = {
          ...get().cartsByMarket,
          [prev]: seed,
        };

        set({
          marketCode: market.code,
          currency: market.currencyCode as Currency,
          cartsByMarket,
          marketSwitching: true,
        });

        try {
          // Resolve live market ids before repricing so market_id is correct.
          await get().bootstrapMarkets();
          const marketId = resolveMarketId(market.code);
          const result = await syncCartForMarket(seed, marketId);
          set({
            cart: result.kept,
            cartsByMarket: {
              ...get().cartsByMarket,
              [market.code]: result.kept,
            },
            marketSwitching: false,
          });

          if (result.removed > 0 && result.kept.length > 0) {
            toast.message(
              `Switched to ${market.code}. ${result.removed} item${result.removed === 1 ? "" : "s"} unavailable there were removed; prices updated for the rest.`,
            );
          } else if (result.removed > 0 && result.kept.length === 0) {
            toast.message(
              `Switched to ${market.code}. Those items aren’t available in this market, so the bag was cleared.`,
            );
          } else if (result.repriced > 0) {
            toast.success(
              `Switched to ${market.code}. Bag prices updated for this market.`,
            );
          } else if (seed.length > 0) {
            toast.success(
              `Switched to ${market.code}. Your bag was kept for this market.`,
            );
          }
        } catch {
          set({ marketSwitching: false });
          toast.error(
            "Could not update bag prices for the new market. Please review your bag.",
          );
        }
      },
      setCurrency: (currency) => set({ currency }),
      setLocale: async (locale) => {
        const prev = get().locale;
        if (prev === locale) return;

        setStoreLocale(locale);
        set({ locale });

        if (typeof document !== "undefined") {
          document.documentElement.lang = locale;
          document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
        }

        const cart = get().cart;
        if (!cart.length) return;

        try {
          const marketId = resolveMarketId(get().marketCode);
          const updated = await refreshCartForLocale(cart, marketId, locale);
          set({
            cart: updated,
            cartsByMarket: {
              ...get().cartsByMarket,
              [get().marketCode]: updated,
            },
          });
        } catch {
          /* keep existing cart names if refresh fails */
        }
      },
      setSession: (user, token) => {
        setStoreToken(token);
        set({ user, token });
      },
      signInLocal: (user) => set({ user }),
      signOut: async () => {
        const { token } = get();
        if (token) {
          try {
            await storeApi.logout();
          } catch {
            /* clear local session anyway */
          }
        }
        setStoreToken(null);
        set({ user: null, token: null, wishlist: [], wishlistIds: [] });
      },
      placeOrder: (data) => {
        const order: Order = {
          ...data,
          id: `KHAM-${Date.now().toString(36).toUpperCase()}`,
          createdAt: new Date().toISOString(),
        };
        const marketCode = get().marketCode;
        set({
          orders: [order, ...get().orders],
          cart: [],
          cartsByMarket: { ...get().cartsByMarket, [marketCode]: [] },
        });
        return order;
      },
      viewProduct: (slug) => {
        const recent = [slug, ...get().recent.filter((s) => s !== slug)].slice(
          0,
          8,
        );
        set({ recent });
      },
      syncWishlistFromApi: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const res = await storeApi.wishlist();
          const items = res.data ?? [];
          set({
            wishlist: items.map((p) => p.slug),
            wishlistIds: items.map((p) => p.id),
          });
        } catch {
          /* keep local wishlist */
        }
      },
      bootstrapMarkets: async () => {
        try {
          const marketsRes = await storeApi.markets();
          setLiveMarkets(marketsRes.data ?? []);
          const code = get().marketCode;
          const market = getStoreMarketByCode(code);
          if (market.currencyCode) {
            set({ currency: market.currencyCode as Currency });
          }
          const settingsRes = await storeApi.settings(market.id);
          const settings = settingsRes.data;
          set({
            checkoutReady: Boolean(settings.checkout?.ready),
            sandboxCheckoutReady: Boolean(
              settings.features?.sandbox_checkout_enabled ??
                settings.sandbox_checkout?.ready,
            ),
            localMockCheckout: Boolean(settings.features?.local_mock_checkout),
          });
        } catch {
          /* keep fallbacks */
        }
      },
      hydrateAuth: async () => {
        const { token, locale } = get();
        setStoreLocale(locale);
        if (typeof document !== "undefined") {
          document.documentElement.lang = locale;
          document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
        }
        await get().bootstrapMarkets();
        // Keep cartsByMarket in sync with active cart after rehydrate.
        const marketCode = get().marketCode;
        const cart = get().cart;
        if (cart.length && !get().cartsByMarket[marketCode]?.length) {
          set({
            cartsByMarket: { ...get().cartsByMarket, [marketCode]: cart },
          });
        }
        // Ensure persisted bag names match the restored locale.
        if (cart.length) {
          try {
            const updated = await refreshCartForLocale(
              cart,
              resolveMarketId(marketCode),
              locale,
            );
            set({
              cart: updated,
              cartsByMarket: {
                ...get().cartsByMarket,
                [marketCode]: updated,
              },
            });
          } catch {
            /* keep persisted names */
          }
        }
        if (!token) return;
        setStoreToken(token);
        try {
          const me = await storeApi.me();
          set({ user: customerToUser(me.data) });
          await get().syncWishlistFromApi();
        } catch {
          setStoreToken(null);
          set({ token: null, user: null });
        }
      },
    }),
    {
      name: "kham-cairo-shop-v5",
      partialize: (s) => ({
        cart: s.cart,
        cartsByMarket: s.cartsByMarket,
        wishlist: s.wishlist,
        wishlistIds: s.wishlistIds,
        marketCode: s.marketCode,
        currency: s.currency,
        locale: s.locale,
        user: s.user,
        token: s.token,
        orders: s.orders,
        recent: s.recent,
      }),
    },
  ),
);

export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}

export function cartCount(cart: CartLine[]) {
  return cart.reduce((n, l) => n + l.qty, 0);
}

export function cartTotal(cart: CartLine[]) {
  return cart.reduce((n, l) => n + l.unitPrice * l.qty, 0);
}

export { customerToUser };
