"use client";

import Link from "next/link";
import { useCatalog } from "@/lib/catalog-data";
import { ProductCard } from "@/components/product-card";

const STORIES = [
  {
    title: "A More Beautiful Cairo",
    dek: "Evenings in courtyards, brass, palm, and the long table.",
    image: "/images/cairo-edit.jpg",
    slug: "cairo",
  },
  {
    title: "The hammam hour",
    dek: "Steam, soap, glove, clay, oil — in that order, without hurry.",
    image: "/images/hammam.jpg",
    slug: "hammam",
  },
  {
    title: "Oil of the argan tree",
    dek: "Pressed by cooperatives in the Souss, bottled without theatre.",
    image: "/images/ingredient-argan.jpg",
    slug: "argan",
  },
];

export default function EditPage() {
  const { products } = useCatalog();
  const picks = products.slice(0, 4);
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6">
      <p className="text-[11px] uppercase tracking-[0.24em] text-muted">KHAM Edit</p>
      <h1 className="mt-2 font-display text-5xl">Beauty · Culture · Community</h1>
      <p className="mt-4 max-w-xl text-sm text-muted">
        A journal of the city and the materials we love — not a blog, a dispatch.
      </p>
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {STORIES.map((s) => (
          <article key={s.slug} className="overflow-hidden rounded-xl bg-paper">
            <img src={s.image} alt="" className="aspect-[4/5] w-full object-cover" />
            <div className="p-6">
              <h2 className="font-display text-3xl">{s.title}</h2>
              <p className="mt-2 text-sm text-muted">{s.dek}</p>
            </div>
          </article>
        ))}
      </div>
      <section className="mt-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-3xl">From the edit</h2>
          <Link href="/shop" className="text-xs uppercase tracking-[0.16em] text-muted">
            Shop →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {picks.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
