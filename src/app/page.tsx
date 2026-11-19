"use client";

import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Flower2,
  Globe,
  Heart,
  Leaf,
  Play,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useCatalog } from "@/lib/catalog-data";
import { t } from "@/lib/i18n";
import { useShop } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { LeafMark } from "@/components/logo";
import { cn } from "@/lib/utils";

export default function Home() {
  const locale = useShop((s) => s.locale);
  const copy = t(locale);
  const { products, categories, brands, loading, error } = useCatalog();
  const [filter, setFilter] = useState<string>("all");
  const pool =
    filter === "all"
      ? products
      : products.filter((p) => p.category === filter || p.brand === filter);
  const bestsellers = pool.filter((p) => p.bestseller);
  const shown = (bestsellers.length ? bestsellers : pool).slice(0, 8);

  return (
    <div>
      {error ? (
        <p className="bg-sand px-4 py-3 text-center text-sm text-ink">
          {error}
        </p>
      ) : null}
      <Hero />
      <CategoryRow />
      <PromoTrio />
      <FeaturedBrands />
      <section className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-3xl sm:text-4xl">
            {copy.bestsellers}
          </h2>
          <Link
            href="/shop"
            className="text-xs uppercase tracking-[0.16em] text-muted hover:text-ink"
          >
            {copy.viewProducts} →
          </Link>
        </div>
        <div className="mb-6 flex flex-wrap gap-2">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            {copy.all}
          </FilterChip>
          {(categories.length
            ? categories.slice(0, 6).map((c) => ({ id: c.id, label: locale === "ar" ? c.labelAr : c.label }))
            : brands.slice(0, 6).map((b) => ({ id: b.slug, label: locale === "ar" ? b.nameAr : b.name }))
          ).map((c) => (
            <FilterChip
              key={c.id}
              active={filter === c.id}
              onClick={() => setFilter(c.id)}
            >
              {c.label}
            </FilterChip>
          ))}
        </div>
        {loading ? (
          <p className="py-16 text-center text-sm text-muted">Loading products…</p>
        ) : (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {shown.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-xs uppercase tracking-[0.14em] transition-colors",
        active
          ? "border-olive bg-olive text-cream"
          : "border-border bg-paper text-muted hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function Hero() {
  const locale = useShop((s) => s.locale);
  const copy = t(locale);
  const { homepageSections } = useCatalog();
  const hero =
    homepageSections.find((s) => s.type === "hero") || homepageSections[0];
  const heroImage = hero?.image_url || "/images/hero.jpg";
  const headline =
    hero?.title ||
    (locale === "ar" ? "جمال طبيعي. طقوس خالدة." : "Natural beauty. Timeless rituals.");
  const sub =
    hero?.subtitle ||
    (locale === "ar"
      ? "سوق مختارة للجمال والعافية من مصر والمغرب والعالم."
      : "A curated marketplace of authentic beauty and wellness from Egypt, Morocco and beyond.");
  const ctaHref = hero?.link_url || "/shop";

  return (
    <section className="relative overflow-hidden bg-olive text-cream">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt=""
          className="size-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-olive via-olive/55 to-olive/20" />
      </div>
      <div className="relative mx-auto flex min-h-[72vh] max-w-[1440px] flex-col justify-end px-4 pb-16 pt-28 sm:px-6 lg:min-h-[78vh]">
        <p className="animate-fade-up text-[11px] uppercase tracking-[0.28em] text-cream/70">
          KHAM Cairo
        </p>
        <h1 className="animate-fade-up mt-4 max-w-3xl font-display text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
          {headline}
        </h1>
        <p className="animate-fade-up mt-5 max-w-md text-sm leading-relaxed text-cream/80 sm:text-base">
          {sub}
        </p>
        <div className="animate-fade-up mt-8 flex flex-wrap gap-3">
          <Link href={ctaHref.startsWith("http") ? "/shop" : ctaHref}>
            <Button variant="cream">{copy.shopCollection}</Button>
          </Link>
          <Button
            variant="invert"
            type="button"
            onClick={() => window.dispatchEvent(new Event("kham:open-story"))}
          >
            <Play className="size-4" strokeWidth={1.5} /> {copy.watchStory}
          </Button>
        </div>
      </div>
    </section>
  );
}

function CategoryRow() {
  const locale = useShop((s) => s.locale);
  const { categories } = useCatalog();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const pillars = [
    { icon: Leaf, label: "Clean formulas", labelAr: "تركيبات نظيفة" },
    { icon: Flower2, label: "Ritual-led", labelAr: "طقوس أصيلة" },
    { icon: Globe, label: "Regional & Global", labelAr: "إقليمي وعالمي" },
    { icon: Heart, label: "A More Beautiful You", labelAr: "أنتِ أجمل" },
  ];

  function updateArrows() {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
  }

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
    };
  }, [categories]);

  function scrollByDir(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    const step = Math.max(el.clientWidth * 0.7, 160);
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  return (
    <section className="border-b border-border bg-paper">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div
            ref={scrollerRef}
            className="flex gap-5 overflow-x-hidden scroll-smooth lg:gap-8"
          >
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/shop?category=${c.id}`}
                className="flex min-w-20 shrink-0 flex-col items-center gap-2"
              >
                <span className="size-[72px] overflow-hidden rounded-full bg-sand ring-1 ring-border">
                  <img src={c.image} alt="" className="size-full object-cover" />
                </span>
                <span className="text-center text-[10px] font-medium uppercase tracking-[0.14em] text-ink">
                  {locale === "ar" ? c.labelAr : c.label}
                </span>
              </Link>
            ))}
          </div>
          {(canPrev || canNext) && (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                aria-label="Previous categories"
                disabled={!canPrev}
                onClick={() => scrollByDir(-1)}
                className="grid size-7 place-items-center rounded-full border border-border text-ink transition-opacity disabled:opacity-30"
              >
                <ChevronLeft className="size-3.5" strokeWidth={1.6} />
              </button>
              <button
                type="button"
                aria-label="Next categories"
                disabled={!canNext}
                onClick={() => scrollByDir(1)}
                className="grid size-7 place-items-center rounded-full border border-border text-ink transition-opacity disabled:opacity-30"
              >
                <ChevronRight className="size-3.5" strokeWidth={1.6} />
              </button>
            </div>
          )}
        </div>
        <div className="hidden h-16 w-px bg-border lg:block" />
        <div className="grid flex-1 grid-cols-2 gap-4 lg:max-w-xl lg:grid-cols-4">
          {pillars.map(({ icon: Icon, label, labelAr }) => (
            <div key={label} className="flex flex-col items-start gap-2">
              <Icon className="size-5 text-olive" strokeWidth={1.3} />
              <p className="text-xs leading-snug text-muted">
                {locale === "ar" ? labelAr : label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PromoTrio() {
  const locale = useShop((s) => s.locale);
  const copy = t(locale);
  return (
    <section className="mx-auto grid max-w-[1440px] gap-4 px-4 py-10 sm:px-6 lg:grid-cols-3">
      <Link
        href="/ritual"
        className="group relative min-h-72 overflow-hidden rounded-2xl bg-olive text-cream"
      >
        <img
          src="/images/hammam.jpg"
          alt=""
          className="absolute inset-0 size-full object-cover opacity-50 transition-transform duration-500 group-hover:scale-105"
        />
        <div className="relative flex h-full flex-col justify-end p-6">
          <LeafMark className="mb-3 text-cream/80" />
          <h3 className="font-display text-3xl">{copy.findRitual}</h3>
          <p className="mt-2 text-sm text-cream/75">{copy.startRitual}</p>
          <span className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em]">
            Begin <ArrowRight className="size-3.5" />
          </span>
        </div>
      </Link>
      <Link
        href="/rituals"
        className="group relative min-h-72 overflow-hidden rounded-2xl bg-paper"
      >
        <img
          src="/images/ritual-woman.jpg"
          alt=""
          className="absolute inset-0 size-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
        />
        <div className="relative flex h-full flex-col justify-end bg-gradient-to-t from-cream via-cream/40 to-transparent p-6">
          <h3 className="font-display text-3xl text-ink">{copy.hammam}</h3>
          <p className="mt-2 text-sm text-muted">
            {locale === "ar"
              ? "استكشفي الطقوس التقليدية بمنتجات عصرية."
              : "Explore traditional rituals with modern products."}
          </p>
          <span className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-ink">
            {copy.learnMore} <ArrowRight className="size-3.5" />
          </span>
        </div>
      </Link>
      <Link
        href="/ingredients"
        className="group relative min-h-72 overflow-hidden rounded-2xl bg-sand"
      >
        <img
          src="/images/ingredient-argan.jpg"
          alt=""
          className="absolute inset-0 size-full object-cover opacity-70 transition-transform duration-500 group-hover:scale-105"
        />
        <div className="relative flex h-full flex-col justify-end bg-gradient-to-t from-cream via-cream/50 to-transparent p-6">
          <h3 className="font-display text-3xl">{copy.byIngredient}</h3>
          <p className="mt-2 text-sm text-muted">{copy.explore}</p>
          <span className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em]">
            {copy.explore} <ArrowRight className="size-3.5" />
          </span>
        </div>
      </Link>
    </section>
  );
}

function FeaturedBrands() {
  const locale = useShop((s) => s.locale);
  const copy = t(locale);
  const { brands } = useCatalog();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  function updateArrows() {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
  }

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
    };
  }, [brands]);

  function scrollByDir(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    const step = Math.max(el.clientWidth * 0.7, 200);
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="font-display text-3xl">{copy.featured}</h2>
        <Link
          href="/brands"
          className="text-xs uppercase tracking-[0.16em] text-muted hover:text-ink"
        >
          {copy.viewBrands} →
        </Link>
      </div>
      <div
        ref={scrollerRef}
        className="flex gap-2 overflow-x-hidden scroll-smooth border-y border-border py-6"
      >
        {brands.map((b, i) => (
          <Link
            key={b.slug}
            href={`/brands/${b.slug}`}
            className={cn(
              "flex min-w-[140px] shrink-0 items-center justify-center px-4 py-2 text-center",
              i > 0 && "border-s border-border",
            )}
          >
            <span className="font-display text-lg tracking-[0.08em] text-ink/80 hover:text-ink">
              {locale === "ar" ? b.nameAr : b.name}
            </span>
          </Link>
        ))}
      </div>
      {(canPrev || canNext) && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            aria-label="Previous brands"
            disabled={!canPrev}
            onClick={() => scrollByDir(-1)}
            className="grid size-7 place-items-center rounded-full border border-border text-ink transition-opacity disabled:opacity-30"
          >
            <ChevronLeft className="size-3.5" strokeWidth={1.6} />
          </button>
          <button
            type="button"
            aria-label="Next brands"
            disabled={!canNext}
            onClick={() => scrollByDir(1)}
            className="grid size-7 place-items-center rounded-full border border-border text-ink transition-opacity disabled:opacity-30"
          >
            <ChevronRight className="size-3.5" strokeWidth={1.6} />
          </button>
        </div>
      )}
    </section>
  );
}
