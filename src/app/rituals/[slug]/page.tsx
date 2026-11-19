"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { mediaUrl, storeApi, type StorefrontRitual } from "@/lib/api";
import { useCatalog } from "@/lib/catalog-data";
import { useShop } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";

export default function RitualDetailPage() {
  const params = useParams();
  const slug = String(params.slug ?? "");
  const locale = useShop((s) => s.locale);
  const { getProduct, products } = useCatalog();
  const [ritual, setRitual] = useState<StorefrontRitual | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void storeApi
      .ritual(slug)
      .then((res) => {
        if (!cancelled) setRitual(res.data);
      })
      .catch(() => {
        if (!cancelled) {
          setRitual(null);
          setError("Ritual not found.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <p className="px-6 py-20 text-center text-sm text-muted">Loading ritual…</p>
    );
  }

  if (!ritual) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="font-display text-4xl">{error || "Ritual not found"}</h1>
        <Link href="/rituals" className="mt-6 inline-block">
          <Button>Back to rituals</Button>
        </Link>
      </div>
    );
  }

  const title = ritual.title;
  const description = ritual.description || "";
  const image = mediaUrl(ritual.image_url) || "/images/ritual-woman.jpg";
  const steps = Array.isArray(ritual.steps) ? ritual.steps : [];
  const related = (ritual.products ?? [])
    .map((p) => getProduct(p.slug) || products.find((x) => x.id === p.id))
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
        <Link href="/rituals" className="hover:text-ink">
          Rituals
        </Link>{" "}
        / {title}
      </p>
      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl bg-paper">
          <img src={image} alt="" className="aspect-[4/5] w-full object-cover" />
        </div>
        <div>
          <h1 className="font-display text-5xl">{title}</h1>
          {description ? (
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink/80">
              {description}
            </p>
          ) : null}
          {steps.length > 0 ? (
            <ol className="mt-10 space-y-6">
              {steps
                .slice()
                .sort(
                  (a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0),
                )
                .map((step, i) => (
                  <li key={step.id ?? i} className="border-t border-border pt-5">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
                      Step {i + 1}
                    </p>
                    <h2 className="mt-1 font-display text-2xl">{step.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-ink/80">
                      {step.instructions}
                    </p>
                  </li>
                ))}
            </ol>
          ) : null}
        </div>
      </div>
      {related.length > 0 ? (
        <section className="mt-16">
          <h2 className="font-display text-3xl">
            {locale === "ar" ? "المنتجات" : "For this ritual"}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-4">
            {related.map((p) =>
              p ? <ProductCard key={p.slug} product={p} /> : null,
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
