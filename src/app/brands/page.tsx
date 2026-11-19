"use client";

import Link from "next/link";
import { useCatalog } from "@/lib/catalog-data";
import { useShop } from "@/lib/store";

export default function BrandsPage() {
  const locale = useShop((s) => s.locale);
  const { brands, productsByBrand, loading } = useCatalog();

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">House</p>
      <h1 className="mt-2 font-display text-5xl">Brands</h1>
      {loading ? (
        <p className="mt-10 text-sm text-muted">Loading…</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((b) => {
            const n = productsByBrand(b.slug).length;
            return (
              <Link
                key={b.slug}
                href={`/brands/${b.slug}`}
                className="rounded-2xl border border-border bg-paper p-6 transition-colors hover:bg-sand/40"
              >
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                  {locale === "ar" ? b.originAr : b.origin}
                </p>
                <h2 className="mt-2 font-display text-3xl">
                  {locale === "ar" ? b.nameAr : b.name}
                </h2>
                <p className="mt-2 text-sm text-muted">
                  {locale === "ar" ? b.taglineAr : b.tagline}
                </p>
                <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-ink/75">
                  {b.story}
                </p>
                <p className="mt-6 text-xs uppercase tracking-[0.16em] text-olive">
                  {n} products →
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
