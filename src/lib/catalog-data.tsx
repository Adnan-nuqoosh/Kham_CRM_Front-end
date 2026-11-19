"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  mapBrand,
  mapCategory,
  mapIngredient,
  mapProduct,
  mapRitual,
  friendlyApiError,
  storeApi,
  type StorefrontHomepageSection,
  type StorefrontProduct,
  type UiBrand,
  type UiCategory,
  type UiIngredient,
  type UiProduct,
  type UiRitual,
} from "@/lib/api";
import { getStoreMarketByCode, resolveMarketId } from "@/lib/markets";
import { useShop } from "@/lib/store";

type CatalogState = {
  loading: boolean;
  error: string | null;
  market: string;
  marketId: number;
  currencyCode: string;
  categories: UiCategory[];
  brands: UiBrand[];
  products: UiProduct[];
  ingredients: UiIngredient[];
  rituals: UiRitual[];
  homepageSections: StorefrontHomepageSection[];
  reload: () => void;
  getProduct: (slug: string) => UiProduct | undefined;
  getBrand: (slug: string) => UiBrand | undefined;
  getIngredient: (slug: string) => UiIngredient | undefined;
  productsByBrand: (slug: string) => UiProduct[];
  productsByCategory: (slug: string) => UiProduct[];
  relatedProducts: (product: UiProduct, n?: number) => UiProduct[];
  searchProducts: (q: string) => UiProduct[];
  fetchProduct: (slug: string) => Promise<UiProduct | null>;
};

const CatalogContext = createContext<CatalogState | null>(null);

async function enrichProductsWithBrands(
  products: StorefrontProduct[],
  brandSlugs: string[],
  market: number,
): Promise<StorefrontProduct[]> {
  const byId = new Map<number, { slug: string; name: string }>();
  await Promise.all(
    brandSlugs.map(async (slug) => {
      try {
        const res = await storeApi.brand(slug, market);
        const brand = res.data.brand;
        for (const p of res.data.products) {
          byId.set(p.id, { slug: brand.slug, name: brand.name });
        }
      } catch {
        /* brand detail optional */
      }
    }),
  );
  return products.map((p) => {
    const hit = byId.get(p.id);
    if (!hit) return p;
    return { ...p, brand_slug: hit.slug, brand_name: hit.name };
  });
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const marketCode = useShop((s) => s.marketCode);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [market, setMarket] = useState(marketCode);
  const [marketId, setMarketId] = useState(() => resolveMarketId(marketCode));
  const [currencyCode, setCurrencyCode] = useState(
    () => getStoreMarketByCode(marketCode).currencyCode,
  );
  const [categories, setCategories] = useState<UiCategory[]>([]);
  const [brands, setBrands] = useState<UiBrand[]>([]);
  const [products, setProducts] = useState<UiProduct[]>([]);
  const [ingredients, setIngredients] = useState<UiIngredient[]>([]);
  const [rituals, setRituals] = useState<UiRitual[]>([]);
  const [homepageSections, setHomepageSections] = useState<
    StorefrontHomepageSection[]
  >([]);
  const [productCache, setProductCache] = useState<Record<string, UiProduct>>(
    {},
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setProductCache({});
    const mid = resolveMarketId(marketCode);
    const meta = getStoreMarketByCode(marketCode);

    void (async () => {
      try {
        const [brandList, categoryList, productList, ingList, ritualList, homeRes] =
          await Promise.all([
            storeApi.allBrands(),
            storeApi.allCategories().catch(() => [] as never[]),
            storeApi.allProducts(mid),
            storeApi.allIngredients().catch(() => [] as never[]),
            storeApi.allRituals().catch(() => [] as never[]),
            storeApi.homepage().catch(() => ({ data: [] as never[] })),
          ]);

        if (cancelled) return;

        const enriched = await enrichProductsWithBrands(
          productList,
          brandList.map((b) => b.slug),
          mid,
        );

        setMarket(meta.code);
        setMarketId(mid);
        const firstCurrency = enriched[0]?.currency_code || meta.currencyCode;
        setCurrencyCode(firstCurrency);

        setBrands(brandList.map(mapBrand));
        setCategories(categoryList.map(mapCategory));
        const mapped = enriched.map(mapProduct);
        setProducts(mapped);
        setProductCache(() => {
          const next: Record<string, UiProduct> = {};
          for (const p of mapped) next[p.slug] = p;
          return next;
        });
        setIngredients(ingList.map(mapIngredient));
        setRituals(ritualList.map(mapRitual));
        setHomepageSections(homeRes.data ?? []);
      } catch (err) {
        if (cancelled) return;
        setError(
          friendlyApiError(
            err,
            "We couldn’t load the collection. Please refresh and try again.",
          ),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tick, marketCode]);

  const getProduct = useCallback(
    (slug: string) => productCache[slug] || products.find((p) => p.slug === slug),
    [productCache, products],
  );

  const getBrand = useCallback(
    (slug: string) => brands.find((b) => b.slug === slug),
    [brands],
  );

  const getIngredient = useCallback(
    (slug: string) => ingredients.find((i) => i.slug === slug),
    [ingredients],
  );

  const productsByBrand = useCallback(
    (slug: string) => products.filter((p) => p.brand === slug),
    [products],
  );

  const productsByCategory = useCallback(
    (slug: string) => products.filter((p) => p.category === slug),
    [products],
  );

  const relatedProducts = useCallback(
    (product: UiProduct, n = 4) => {
      const sameBrand = products.filter(
        (p) => p.slug !== product.slug && p.brand && p.brand === product.brand,
      );
      const rest = products.filter(
        (p) => p.slug !== product.slug && p.brand !== product.brand,
      );
      return [...sameBrand, ...rest].slice(0, n);
    },
    [products],
  );

  const searchProducts = useCallback(
    (q: string) => {
      const s = q.trim().toLowerCase();
      if (!s) return [];
      return products.filter((p) => {
        return (
          p.name.toLowerCase().includes(s) ||
          p.description.toLowerCase().includes(s) ||
          p.brandName.toLowerCase().includes(s) ||
          p.ingredients.some((i) => i.toLowerCase().includes(s))
        );
      });
    },
    [products],
  );

  const fetchProduct = useCallback(
    async (slug: string) => {
      const mid = resolveMarketId(marketCode);
      try {
        const res = await storeApi.productBySlug(slug, mid);
        let raw = res.data;
        if (!raw.brand_slug) {
          try {
            const brandList = await storeApi.allBrands();
            const enriched = await enrichProductsWithBrands(
              [raw],
              brandList.map((b) => b.slug),
              mid,
            );
            raw = enriched[0] ?? raw;
          } catch {
            /* optional */
          }
        }
        const mapped = mapProduct(raw);
        setProductCache((prev) => ({ ...prev, [slug]: mapped }));
        setProducts((prev) => {
          const i = prev.findIndex((p) => p.slug === slug);
          if (i < 0) return [...prev, mapped];
          const next = [...prev];
          next[i] = mapped;
          return next;
        });
        if (raw.currency_code) setCurrencyCode(raw.currency_code);
        return mapped;
      } catch {
        return null;
      }
    },
    [marketCode],
  );

  const value = useMemo<CatalogState>(
    () => ({
      loading,
      error,
      market,
      marketId,
      currencyCode,
      categories,
      brands,
      products,
      ingredients,
      rituals,
      homepageSections,
      reload: () => setTick((t) => t + 1),
      getProduct,
      getBrand,
      getIngredient,
      productsByBrand,
      productsByCategory,
      relatedProducts,
      searchProducts,
      fetchProduct,
    }),
    [
      loading,
      error,
      market,
      marketId,
      currencyCode,
      categories,
      brands,
      products,
      ingredients,
      rituals,
      homepageSections,
      getProduct,
      getBrand,
      getIngredient,
      productsByBrand,
      productsByCategory,
      relatedProducts,
      searchProducts,
      fetchProduct,
    ],
  );

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error("useCatalog must be used within CatalogProvider");
  }
  return ctx;
}
