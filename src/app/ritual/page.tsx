"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  friendlyApiError,
  storeApi,
  type StorefrontQuizQuestion,
  type UiProduct,
} from "@/lib/api";
import { useCatalog } from "@/lib/catalog-data";
import { useShop } from "@/lib/store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { cn } from "@/lib/utils";

export default function RitualQuiz() {
  const { products, marketId, getProduct, fetchProduct } = useCatalog();
  const locale = useShop((s) => s.locale);
  const addToCart = useShop((s) => s.addToCart);
  const [questions, setQuestions] = useState<StorefrontQuizQuestion[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [result, setResult] = useState<UiProduct[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void storeApi
      .ritualQuizQuestions(locale === "ar" ? "ar" : "en")
      .then((res) => {
        if (!cancelled) setQuestions(res.data ?? []);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            friendlyApiError(err, "We couldn’t load the ritual quiz."),
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const q = questions[step];

  async function finish(nextSelected: Record<number, number>) {
    setBusy(true);
    try {
      const option_ids = Object.values(nextSelected);
      const res = await storeApi.ritualQuizRecommendations({
        market_id: marketId,
        option_ids,
      });
      const mapped: UiProduct[] = [];
      for (const rec of res.data) {
        let p = getProduct(rec.slug) || products.find((x) => x.id === rec.id);
        if (!p) p = (await fetchProduct(rec.slug)) ?? undefined;
        if (p) mapped.push(p);
      }
      setResult(mapped);
      setDone(true);
    } catch (err) {
      toast.error(
        friendlyApiError(err, "We couldn’t build recommendations."),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-[70vh]">
      <img
        src="/images/ritual-woman.jpg"
        alt=""
        className="absolute inset-0 size-full object-cover opacity-30"
      />
      <div className="relative mx-auto max-w-2xl px-6 py-16">
        <p className="text-[11px] uppercase tracking-[0.24em] text-muted">
          Find your ritual
        </p>
        <h1 className="mt-2 font-display text-5xl">A few quiet questions.</h1>

        {loadError ? (
          <p className="mt-8 text-sm text-muted">{loadError}</p>
        ) : null}

        {!done && q && (
          <div className="mt-10 rounded-2xl bg-paper/95 p-8 shadow-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">
              {step + 1} / {questions.length}
            </p>
            <h2 className="mt-3 font-display text-3xl">{q.question}</h2>
            <div className="mt-6 grid gap-3">
              {q.options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    const next = { ...selected, [q.id]: o.id };
                    setSelected(next);
                    if (step + 1 >= questions.length) {
                      void finish(next);
                    } else {
                      setStep((s) => s + 1);
                    }
                  }}
                  className={cn(
                    "rounded-full border border-border px-5 py-3 text-start text-sm hover:bg-sand",
                    selected[q.id] === o.id && "border-olive bg-sand",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {!done && !q && !loadError ? (
          <p className="mt-10 text-sm text-muted">Loading quiz…</p>
        ) : null}

        {done && (
          <div className="mt-10">
            <p className="max-w-lg text-sm text-muted">
              A morning, a night, a weekly hour. These will carry it.
            </p>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {result.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
            {result.length === 0 ? (
              <p className="mt-6 text-sm text-muted">
                No market-eligible recommendations yet. Browse the shop instead.
              </p>
            ) : null}
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                onClick={() => {
                  result.forEach((p) => {
                    if (!p.variantId) return;
                    addToCart({
                      slug: p.slug,
                      variantId: p.variantId,
                      productId: p.id,
                      name: p.name,
                      image: p.image,
                      unitPrice: p.priceEgp,
                      qty: 1,
                    });
                  });
                  toast("Ritual added to bag");
                  window.dispatchEvent(new Event("kham:open-cart"));
                }}
                disabled={result.length === 0}
              >
                Add the ritual
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStep(0);
                  setSelected({});
                  setResult([]);
                  setDone(false);
                }}
              >
                Begin again
              </Button>
              <Link
                href="/shop"
                className="inline-flex items-center text-xs uppercase tracking-[0.16em]"
              >
                Browse all
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
