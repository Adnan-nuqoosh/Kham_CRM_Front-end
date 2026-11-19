"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useCatalog } from "@/lib/catalog-data";
import { useShop } from "@/lib/store";
import { ProductCard } from "@/components/product-card";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const FILTER_PREVIEW = 10;
const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;
const DEFAULT_PAGE_SIZE = 12;

function shopHref(opts: {
  category?: string;
  brand?: string;
  q?: string;
  page?: number;
  perPage?: number;
}) {
  const params = new URLSearchParams();
  if (opts.category) params.set("category", opts.category);
  if (opts.brand) params.set("brand", opts.brand);
  if (opts.q?.trim()) params.set("q", opts.q.trim());
  if (opts.perPage && opts.perPage !== DEFAULT_PAGE_SIZE) {
    params.set("per_page", String(opts.perPage));
  }
  if (opts.page && opts.page > 1) params.set("page", String(opts.page));
  const query = params.toString();
  return query ? `/shop?${query}` : "/shop";
}

function pageWindow(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((n) => pages.add(n));
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((n) => pages.add(n));
  return [...pages].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
}

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get("category") ?? undefined;
  const brand = searchParams.get("brand") ?? undefined;
  const qParam = searchParams.get("q") ?? "";
  const sortQ = searchParams.get("sort") ?? undefined;
  const pageQ = Number(searchParams.get("page") ?? "1");
  const page = Number.isFinite(pageQ) && pageQ > 0 ? Math.floor(pageQ) : 1;
  const perPageQ = Number(searchParams.get("per_page") ?? DEFAULT_PAGE_SIZE);
  const pageSize = (PAGE_SIZE_OPTIONS as readonly number[]).includes(perPageQ)
    ? perPageQ
    : DEFAULT_PAGE_SIZE;
  const locale = useShop((s) => s.locale);
  const { categories, brands, products, loading, error } = useCatalog();
  const [sort, setSort] = useState(sortQ ?? "featured");
  const [query, setQuery] = useState(qParam);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);

  useEffect(() => {
    setQuery(qParam);
  }, [qParam]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === qParam.trim()) return;
    const t = window.setTimeout(() => {
      router.replace(
        shopHref({
          category,
          brand,
          q: trimmed || undefined,
          perPage: pageSize,
          page: 1,
        }),
      );
    }, 250);
    return () => window.clearTimeout(t);
  }, [query, qParam, category, brand, pageSize, router]);

  const list = useMemo(() => {
    let next = [...products];
    if (category) next = next.filter((p) => p.category === category);
    if (brand) next = next.filter((p) => p.brand === brand);
    const term = query.trim().toLowerCase();
    if (term) {
      next = next.filter((p) => {
        return (
          p.name.toLowerCase().includes(term) ||
          p.nameAr.toLowerCase().includes(term) ||
          p.brandName.toLowerCase().includes(term) ||
          p.categoryName.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term)
        );
      });
    }
    if (sort === "price-asc") next.sort((a, b) => a.priceEgp - b.priceEgp);
    else if (sort === "price-desc") next.sort((a, b) => b.priceEgp - a.priceEgp);
    else if (sort === "name") next.sort((a, b) => a.name.localeCompare(b.name));
    return next;
  }, [category, brand, sort, products, query]);

  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [list, currentPage, pageSize]);

  const filterKey = `${category ?? ""}|${brand ?? ""}|${sort}|${pageSize}|${query.trim()}`;
  const prevFilterKey = useRef(filterKey);

  useEffect(() => {
    if (prevFilterKey.current === filterKey) return;
    prevFilterKey.current = filterKey;
    if (page !== 1) {
      router.replace(
        shopHref({
          category,
          brand,
          q: query.trim() || undefined,
          perPage: pageSize,
          page: 1,
        }),
      );
    }
  }, [filterKey, page, category, brand, pageSize, query, router]);

  useEffect(() => {
    if (page !== currentPage) {
      router.replace(
        shopHref({
          category,
          brand,
          q: qParam || undefined,
          perPage: pageSize,
          page: currentPage,
        }),
      );
    }
  }, [page, currentPage, category, brand, pageSize, qParam, router]);

  const cat = categories.find((c) => c.id === category);
  const br = brands.find((b) => b.slug === brand);
  const title = cat
    ? locale === "ar"
      ? cat.labelAr
      : cat.label
    : br
      ? locale === "ar"
        ? br.nameAr
        : br.name
      : "Shop";

  const visibleCategories = showAllCategories
    ? categories
    : categories.slice(0, FILTER_PREVIEW);
  const visibleBrands = showAllBrands
    ? brands
    : brands.slice(0, FILTER_PREVIEW);

  const from = list.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, list.length);

  function setPageSize(next: string) {
    const size = Number(next);
    router.replace(
      shopHref({
        category,
        brand,
        q: qParam || undefined,
        perPage: size,
        page: 1,
      }),
    );
  }
  const pages = pageWindow(currentPage, totalPages);
  const hrefBase = {
    category,
    brand,
    q: qParam || undefined,
    perPage: pageSize,
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6">
      {error ? (
        <p className="mb-4 rounded-xl bg-sand px-4 py-3 text-sm text-ink">
          {error}
        </p>
      ) : null}
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>{" "}
        / {title}
      </p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl sm:text-5xl">{title}</h1>
        <p className="text-sm text-muted">
          {loading
            ? "…"
            : list.length === 0
              ? "0 products"
              : `Showing ${from}–${to} of ${list.length}`}
        </p>
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-end gap-x-5 gap-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.14em] text-muted">
            Show
          </span>
          <Select
            label="Per page"
            value={String(pageSize)}
            onChange={setPageSize}
            options={PAGE_SIZE_OPTIONS.map((n) => ({
              value: String(n),
              label: String(n),
            }))}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.14em] text-muted">
            Sort
          </span>
          <Select
            label="Sort"
            value={sort}
            onChange={setSort}
            options={[
              { value: "featured", label: "Featured" },
              { value: "name", label: "Name" },
              { value: "price-asc", label: "Price · Low" },
              { value: "price-desc", label: "Price · High" },
            ]}
          />
        </div>
      </div>
      <div className="mt-6 grid items-start gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="scrollbar-theme overflow-x-hidden lg:sticky lg:top-28 lg:self-start lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto">
          <div className="min-w-0 overflow-x-hidden">
            <label className="relative mb-2 block">
              <span className="sr-only">Search products</span>
              <Search
                className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                strokeWidth={1.5}
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  locale === "ar" ? "ابحث عن منتجات…" : "Search products…"
                }
                className="h-10 w-full rounded-full border border-border bg-paper pe-9 ps-9 text-sm text-ink outline-none placeholder:text-muted focus:border-olive/40"
              />
              {query ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                  className="absolute end-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-sand hover:text-ink"
                >
                  <X className="size-3.5" strokeWidth={1.6} />
                </button>
              ) : null}
            </label>
            <div>
              <button
                type="button"
                aria-expanded={categoryOpen}
                onClick={() => setCategoryOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-3 py-4 text-start"
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-olive">
                  Category
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-olive transition-transform duration-300 ease-out",
                    categoryOpen && "rotate-180",
                  )}
                  strokeWidth={1.6}
                />
              </button>
              <div
                className={cn(
                  "grid min-w-0 transition-[grid-template-rows] duration-300 ease-out",
                  categoryOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <div className="min-w-0 overflow-hidden">
                  <div className="pb-5 pe-1">
                    <ul className="space-y-1">
                      <li>
                        <Link
                          href={shopHref({ ...hrefBase, category: undefined })}
                          className={cn(
                            "block truncate text-sm",
                            !category
                              ? "font-medium text-ink"
                              : "text-muted hover:text-ink",
                          )}
                        >
                          All
                        </Link>
                      </li>
                      {visibleCategories.map((c) => (
                        <li key={c.id}>
                          <Link
                            href={shopHref({ ...hrefBase, category: c.id })}
                            className={cn(
                              "block truncate text-sm",
                              category === c.id
                                ? "font-medium text-ink"
                                : "text-muted hover:text-ink",
                            )}
                          >
                            {locale === "ar" ? c.labelAr : c.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {categories.length > FILTER_PREVIEW ? (
                      <button
                        type="button"
                        onClick={() => setShowAllCategories((v) => !v)}
                        className="mt-3 text-[11px] font-medium uppercase tracking-[0.16em] text-olive hover:text-olive-soft"
                      >
                        {showAllCategories
                          ? "Show less"
                          : `More (+${categories.length - FILTER_PREVIEW})`}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-border">
              <button
                type="button"
                aria-expanded={brandOpen}
                onClick={() => setBrandOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-3 py-4 text-start"
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-olive">
                  Brand
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-olive transition-transform duration-300 ease-out",
                    brandOpen && "rotate-180",
                  )}
                  strokeWidth={1.6}
                />
              </button>
              <div
                className={cn(
                  "grid min-w-0 transition-[grid-template-rows] duration-300 ease-out",
                  brandOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <div className="min-w-0 overflow-hidden">
                  <div className="pb-5 pe-1">
                    <ul className="space-y-1">
                      {visibleBrands.map((b) => (
                        <li key={b.slug}>
                          <Link
                            href={shopHref({ ...hrefBase, brand: b.slug })}
                            className={cn(
                              "block truncate text-sm",
                              brand === b.slug
                                ? "font-medium text-ink"
                                : "text-muted hover:text-ink",
                            )}
                          >
                            {locale === "ar" ? b.nameAr : b.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {brands.length > FILTER_PREVIEW ? (
                      <button
                        type="button"
                        onClick={() => setShowAllBrands((v) => !v)}
                        className="mt-3 text-[11px] font-medium uppercase tracking-[0.16em] text-olive hover:text-olive-soft"
                      >
                        {showAllBrands
                          ? "Show less"
                          : `More (+${brands.length - FILTER_PREVIEW})`}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
        <div>
          {loading ? (
            <p className="py-20 text-center text-muted">Loading…</p>
          ) : list.length === 0 ? (
            <p className="py-20 text-center text-muted">
              No products in this selection.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
                {pageItems.map((p) => (
                  <ProductCard key={p.slug} product={p} />
                ))}
              </div>
              {totalPages > 1 ? (
                <nav
                  className="mt-10 flex flex-wrap items-center justify-center gap-2"
                  aria-label="Product pages"
                >
                  <Link
                    href={shopHref({
                      ...hrefBase,
                      page: Math.max(1, currentPage - 1),
                    })}
                    aria-disabled={currentPage <= 1}
                    className={cn(
                      "grid size-9 place-items-center rounded-full border border-border text-ink transition-colors",
                      currentPage <= 1
                        ? "pointer-events-none opacity-30"
                        : "hover:bg-sand",
                    )}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="size-4" strokeWidth={1.6} />
                  </Link>
                  {pages.map((n, i) => {
                    const prev = pages[i - 1];
                    const showGap = prev != null && n - prev > 1;
                    return (
                      <span key={n} className="contents">
                        {showGap ? (
                          <span className="px-1 text-sm text-muted">…</span>
                        ) : null}
                        <Link
                          href={shopHref({ ...hrefBase, page: n })}
                          aria-current={n === currentPage ? "page" : undefined}
                          className={cn(
                            "grid size-9 place-items-center rounded-full text-xs tabular-nums transition-colors",
                            n === currentPage
                              ? "bg-olive text-cream"
                              : "border border-border text-ink hover:bg-sand",
                          )}
                        >
                          {n}
                        </Link>
                      </span>
                    );
                  })}
                  <Link
                    href={shopHref({
                      ...hrefBase,
                      page: Math.min(totalPages, currentPage + 1),
                    })}
                    aria-disabled={currentPage >= totalPages}
                    className={cn(
                      "grid size-9 place-items-center rounded-full border border-border text-ink transition-colors",
                      currentPage >= totalPages
                        ? "pointer-events-none opacity-30"
                        : "hover:bg-sand",
                    )}
                    aria-label="Next page"
                  >
                    <ChevronRight className="size-4" strokeWidth={1.6} />
                  </Link>
                </nav>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={<div className="px-6 py-12 text-sm text-muted">Loading…</div>}
    >
      <ShopContent />
    </Suspense>
  );
}
