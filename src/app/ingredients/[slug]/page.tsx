"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCatalog } from "@/lib/catalog-data";
import { useShop } from "@/lib/store";
import { ProductCard } from "@/components/product-card";

export default function IngredientPage() {
  const params = useParams();
  const slug = String(params.slug ?? "");
  const { getIngredient, products } = useCatalog();
  const locale = useShop((s) => s.locale);
  const ing = getIngredient(slug);
  // API does not link products↔ingredients yet — show all as soft fallback empty
  const list = products.filter((p) => p.ingredientSlugs.includes(slug));

  if (!ing) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="font-display text-4xl">Ingredient not found</h1>
        <Link href="/ingredients" className="mt-6 inline-block underline">
          All ingredients
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
        <Link href="/ingredients" className="hover:text-ink">
          Ingredients
        </Link>
      </p>
      <h1 className="mt-2 font-display text-5xl">
        {locale === "ar" ? ing.nameAr : ing.name}
      </h1>
      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ink/80">
        {locale === "ar" ? ing.blurbAr : ing.blurb}
      </p>
      {list.length === 0 ? (
        <p className="mt-10 text-sm text-muted">
          No products linked to this ingredient in the API yet.
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-4">
          {list.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
