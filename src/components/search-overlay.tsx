"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCatalog } from "@/lib/catalog-data";
import { t } from "@/lib/i18n";
import { useShop } from "@/lib/store";

export function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const locale = useShop((s) => s.locale);
  const copy = t(locale);
  const router = useRouter();
  const { brands, searchProducts } = useCatalog();

  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener("kham:open-search", on);
    return () => window.removeEventListener("kham:open-search", on);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const results = useMemo(() => searchProducts(q).slice(0, 8), [q, searchProducts]);
  const brandHits = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return brands
      .filter(
        (b) =>
          b.name.toLowerCase().includes(s) || b.nameAr.toLowerCase().includes(s),
      )
      .slice(0, 4);
  }, [q, brands]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-ink/40" onClick={() => setOpen(false)}>
      <div
        className="mx-auto mt-0 max-w-2xl bg-paper shadow-2xl sm:mt-16 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <form
          className="flex items-center gap-3 border-b border-border px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            setOpen(false);
            router.push(`/search?q=${encodeURIComponent(q)}`);
          }}
        >
          <Search className="size-5 text-muted" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={copy.search}
            className="h-11 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
          />
          <button
            type="button"
            className="grid size-11 place-items-center"
            onClick={() => setOpen(false)}
            aria-label="Close search"
          >
            <X className="size-5" />
          </button>
        </form>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {q.trim() === "" ? (
            <p className="py-8 text-center text-sm text-muted">
              Try “argan”, “hammam”, or a brand name.
            </p>
          ) : (
            <>
              {brandHits.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-muted">
                    Brands
                  </p>
                  {brandHits.map((b) => (
                    <Link
                      key={b.slug}
                      href={`/brands/${b.slug}`}
                      onClick={() => setOpen(false)}
                      className="block py-2 hover:text-olive"
                    >
                      {locale === "ar" ? b.nameAr : b.name}
                    </Link>
                  ))}
                </div>
              )}
              {results.length === 0 && brandHits.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">No matches.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {results.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/product/${p.slug}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 py-3 hover:bg-cream"
                      >
                        <img
                          src={p.image}
                          alt=""
                          className="size-14 rounded-md object-cover"
                        />
                        <div>
                          <p className="font-display text-lg">
                            {locale === "ar" ? p.nameAr : p.name}
                          </p>
                          <p className="text-xs text-muted">{p.size}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
