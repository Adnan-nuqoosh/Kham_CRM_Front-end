"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div>
      <section className="relative min-h-[48vh] overflow-hidden">
        <img src="/images/hero.jpg" alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-olive/45" />
        <div className="relative mx-auto flex min-h-[48vh] max-w-[1440px] flex-col justify-end px-6 py-16 text-cream">
          <p className="text-[11px] uppercase tracking-[0.24em]">The house</p>
          <h1 className="mt-3 font-display text-5xl sm:text-6xl">Always authentic. Always curated.</h1>
        </div>
      </section>
      <article className="mx-auto max-w-2xl px-6 py-16 text-sm leading-relaxed text-ink/80">
        <p className="font-display text-3xl leading-snug text-ink">
          KHAM Cairo is a marketplace, not a factory. We exist so that a bottle pressed in the
          Souss, a hydrosol distilled in Fayoum, an attar composed in Dubai can share a single
          shelf — and a single standard.
        </p>
        <p className="mt-6">
          The name is from the Arabic for “raw”: kham. We look for formulas that have not been
          talked into something they are not. Clean does not mean scentless. Natural does not
          mean naïve. Regional does not mean folkloric. We buy from ateliers we have visited, or
          from people who have.
        </p>
        <p className="mt-6">
          The house line carries our name. Everything else is someone else's life's work, placed
          with care. Free delivery in Egypt over EGP 1,000. We ship to the Gulf. The ritual is
          older than any of us.
        </p>
        <p className="mt-6">Garden City, Cairo.</p>
        <Link href="/shop" className="mt-10 inline-block">
          <Button>Shop the collection</Button>
        </Link>
      </article>
    </div>
  );
}
