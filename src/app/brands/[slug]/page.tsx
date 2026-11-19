"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCatalog } from "@/lib/catalog-data";
import { useShop } from "@/lib/store";
import { ProductCard } from "@/components/product-card";

export default function BrandPage() {
  const params = useParams();
  const slug = String(params.slug ?? "");
  const { getBrand, productsByBrand, loading } = useCatalog();
  const brand = getBrand(slug);
  const locale = useShop((s) => s.locale);
  const list = productsByBrand(slug);

  if (loading && !brand) {
    return <p className="px-6 py-20 text-center text-sm text-muted">Loading…</p>;
  }

  if (!brand) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="font-display text-4xl">Brand not found</h1>
        <Link href="/brands" className="mt-6 inline-block text-sm underline">
          All brands
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
        <Link href="/brands" className="hover:text-ink">
          Brands
        </Link>
      </p>
      <h1 className="mt-2 font-display text-5xl">
        {locale === "ar" ? brand.nameAr : brand.name}
      </h1>
      <p className="mt-3 text-sm text-muted">
        {locale === "ar" ? brand.originAr : brand.origin}
      </p>
      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ink/80">
        {brand.story}
      </p>
      <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
        {list.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </div>
  );
}
