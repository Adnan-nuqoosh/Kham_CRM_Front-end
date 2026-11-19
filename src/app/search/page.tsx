"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { storeApi, mapProduct, type UiProduct } from "@/lib/api";
import { useCatalog } from "@/lib/catalog-data";
import { ProductCard } from "@/components/product-card";

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const { searchProducts } = useCatalog();
  const [remote, setRemote] = useState<UiProduct[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) {
      setRemote([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void storeApi
      .products({ search: q, per_page: 48 })
      .then((res) => {
        if (!cancelled) setRemote(res.data.map(mapProduct));
      })
      .catch(() => {
        if (!cancelled) setRemote(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q]);

  const list = remote ?? searchProducts(q);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Search</p>
      <h1 className="mt-2 font-display text-5xl">
        {q ? `Results for “${q}”` : "Search"}
      </h1>
      <p className="mt-3 text-sm text-muted">
        {loading ? "Searching…" : `${list.length} products`}
      </p>
      <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
        {list.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={<div className="px-6 py-12 text-sm text-muted">Loading…</div>}
    >
      <SearchContent />
    </Suspense>
  );
}
