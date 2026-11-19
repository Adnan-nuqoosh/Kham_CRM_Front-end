"use client";

import Link from "next/link";
import { useCatalog } from "@/lib/catalog-data";
import { t } from "@/lib/i18n";
import { useShop } from "@/lib/store";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";

export default function WishlistPage() {
  const wishlist = useShop((s) => s.wishlist);
  const locale = useShop((s) => s.locale);
  const { getProduct } = useCatalog();
  const copy = t(locale);
  const list = wishlist.map((s) => getProduct(s)).filter(Boolean);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6">
      <h1 className="font-display text-5xl">{copy.wishlist}</h1>
      {list.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-muted">Nothing saved yet.</p>
          <Link href="/shop" className="mt-6 inline-block">
            <Button>{copy.continue}</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {list.map((p) => (p ? <ProductCard key={p.slug} product={p} /> : null))}
        </div>
      )}
    </div>
  );
}
