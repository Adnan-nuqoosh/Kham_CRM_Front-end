"use client";

import Link from "next/link";
import { useCatalog } from "@/lib/catalog-data";
import { useShop } from "@/lib/store";

export default function IngredientsPage() {
  const locale = useShop((s) => s.locale);
  const { ingredients, loading } = useCatalog();

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6">
      <h1 className="font-display text-5xl">Ingredients</h1>
      {loading ? (
        <p className="mt-10 text-sm text-muted">Loading…</p>
      ) : ingredients.length === 0 ? (
        <p className="mt-10 text-sm text-muted">
          No ingredients in the API yet. Add them via store CMS.
        </p>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ingredients.map((ing) => (
            <Link
              key={ing.slug}
              href={`/ingredients/${ing.slug}`}
              className="overflow-hidden rounded-2xl border border-border bg-paper"
            >
              <img
                src={ing.image}
                alt=""
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="p-5">
                <h2 className="font-display text-2xl">
                  {locale === "ar" ? ing.nameAr : ing.name}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm text-muted">
                  {locale === "ar" ? ing.blurbAr : ing.blurb}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
