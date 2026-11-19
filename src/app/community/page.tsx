"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  friendlyApiError,
  mediaUrl,
  storeApi,
  type StorefrontCommunity,
} from "@/lib/api";
import { useShop } from "@/lib/store";
import { Button } from "@/components/ui/button";

export default function CommunityPage() {
  const locale = useShop((s) => s.locale);
  const [data, setData] = useState<StorefrontCommunity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void storeApi
      .community(locale === "ar" ? "ar" : "en")
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            friendlyApiError(err, "We couldn’t load the community page."),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const title = data?.title || "A more beautiful Cairo";
  const intro =
    data?.intro ||
    "Table nights, hammam mornings, a letter once a month. The community is the city, gathered.";

  return (
    <div>
      <section className="relative min-h-[46vh] overflow-hidden">
        <img
          src="/images/cairo-edit.jpg"
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-olive/50" />
        <div className="relative mx-auto flex min-h-[46vh] max-w-[1440px] flex-col justify-end px-6 py-16 text-cream">
          <p className="text-[11px] uppercase tracking-[0.24em]">Community</p>
          <h1 className="mt-3 font-display text-5xl">{title}</h1>
        </div>
      </section>
      <div className="mx-auto max-w-2xl px-6 py-16">
        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : error ? (
          <p className="text-sm text-muted">{error}</p>
        ) : (
          <>
            <p className="font-display text-3xl leading-snug">{intro}</p>
            <div className="mt-10 space-y-10">
              {(data?.sections ?? []).map((section, i) => (
                <article key={section.key || i}>
                  {section.image_url ? (
                    <img
                      src={mediaUrl(section.image_url)}
                      alt=""
                      className="mb-4 aspect-[16/9] w-full rounded-2xl object-cover"
                    />
                  ) : null}
                  <h2 className="font-display text-2xl">{section.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-ink/80">
                    {section.body}
                  </p>
                  {section.link_url ? (
                    <a
                      href={section.link_url}
                      className="mt-3 inline-block text-xs uppercase tracking-[0.16em] underline"
                    >
                      Learn more
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          </>
        )}
        <Link href="/edit" className="mt-8 inline-block">
          <Button>Read the edit</Button>
        </Link>
      </div>
    </div>
  );
}
