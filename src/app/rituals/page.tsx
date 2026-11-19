"use client";

import Link from "next/link";
import { useCatalog } from "@/lib/catalog-data";
import { useShop } from "@/lib/store";
import { Button } from "@/components/ui/button";

export default function RitualsPage() {
  const locale = useShop((s) => s.locale);
  const { rituals, loading } = useCatalog();

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6">
      <h1 className="font-display text-5xl">Rituals</h1>
      <p className="mt-4 max-w-xl text-sm text-muted">
        Hammam mornings, evening oils, and the quiet discipline of care.
      </p>
      {loading ? (
        <p className="mt-10 text-sm text-muted">Loading…</p>
      ) : rituals.length === 0 ? (
        <p className="mt-10 text-sm text-muted">
          No rituals in the API yet. Add them via store CMS.
        </p>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {rituals.map((r) => (
            <Link
              key={r.slug}
              href={`/rituals/${r.slug}`}
              className="group overflow-hidden rounded-2xl border border-border bg-paper transition-colors hover:border-ink/30"
            >
              <img
                src={r.image}
                alt=""
                className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <div className="p-6">
                <h2 className="font-display text-3xl">
                  {locale === "ar" ? r.nameAr : r.name}
                </h2>
                <p className="mt-3 text-sm text-muted">
                  {locale === "ar" ? r.descriptionAr : r.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
      <Link href="/ritual" className="mt-12 inline-block">
        <Button>Find your ritual</Button>
      </Link>
    </div>
  );
}
