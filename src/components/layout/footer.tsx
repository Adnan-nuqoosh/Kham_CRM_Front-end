"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail } from "lucide-react";
import { useState } from "react";
import { friendlyApiError, storeApi } from "@/lib/api";
import { useCatalog } from "@/lib/catalog-data";
import { t } from "@/lib/i18n";
import { useShop } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  hasErrors,
  sanitizeEmail,
  validateNewsletter,
} from "@/lib/validation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export function Footer() {
  const pathname = usePathname();
  const locale = useShop((s) => s.locale);
  const { categories, brands } = useCatalog();
  const copy = t(locale);
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [nlError, setNlError] = useState<string | null>(null);
  const hideTopMargin = pathname === "/ritual";
  const shopLinks =
    categories.length > 0
      ? categories.slice(0, 6).map((c) => ({
          id: c.id,
          href: `/shop?category=${c.id}`,
          label: c.label,
          labelAr: c.labelAr,
        }))
      : brands.slice(0, 6).map((b) => ({
          id: b.slug,
          href: `/brands/${b.slug}`,
          label: b.name,
          labelAr: b.nameAr,
        }));

  return (
    <footer
      className={cn(
        "border-t border-border bg-olive text-cream",
        !hideTopMargin && "mt-20",
      )}
    >
      <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo light />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-cream/70">
            {locale === "ar"
              ? "سوق مختارة للجمال والعافية من مصر والمغرب والعالم."
              : "A curated marketplace of authentic beauty, wellness and lifestyle from Egypt, Morocco and around the world."}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-cream/50">{copy.shop}</p>
          <ul className="mt-4 space-y-2 text-sm text-cream/80">
            {shopLinks.map((c) => (
              <li key={c.id}>
                <Link href={c.href} className="hover:text-cream">
                  {locale === "ar" ? c.labelAr : c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-cream/50">House</p>
          <ul className="mt-4 space-y-2 text-sm text-cream/80">
            <li>
              <Link href="/about" className="hover:text-cream">
                {copy.about}
              </Link>
            </li>
            <li>
              <Link href="/rituals" className="hover:text-cream">
                {copy.rituals}
              </Link>
            </li>
            <li>
              <Link href="/edit" className="hover:text-cream">
                {copy.edit}
              </Link>
            </li>
            <li>
              <Link href="/community" className="hover:text-cream">
                {copy.community}
              </Link>
            </li>
            <li>
              <Link href="/for-brands" className="hover:text-cream">
                {copy.forBrands}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-cream/50">
            {locale === "ar" ? "رسالة خام" : "The KHAM letter"}
          </p>
          <p className="mt-4 text-sm text-cream/70">
            {locale === "ar"
              ? "طقوس، إطلاقات، وقصص البيت — مرة في الشهر."
              : "Rituals, launches and house stories — once a month."}
          </p>
          {done ? (
            <p className="mt-4 text-sm">Welcome. We'll write when it matters.</p>
          ) : (
            <form
              className="mt-4 flex gap-2"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                const next = validateNewsletter(email);
                if (hasErrors(next)) {
                  setNlError(next.email);
                  return;
                }
                setBusy(true);
                setNlError(null);
                void storeApi
                  .newsletterSubscribe(email.trim())
                  .then(() => setDone(true))
                  .catch((err) =>
                    setNlError(
                      friendlyApiError(
                        err,
                        "We couldn’t subscribe that email. Please try again.",
                      ),
                    ),
                  )
                  .finally(() => setBusy(false));
              }}
            >
              <label className="relative flex-1">
                <Mail className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-cream/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(sanitizeEmail(e.target.value));
                    if (nlError) setNlError(null);
                  }}
                  placeholder="email"
                  aria-invalid={Boolean(nlError)}
                  className={cn(
                    "h-11 w-full rounded-full border bg-olive-soft/40 ps-10 pe-4 text-sm text-cream outline-none placeholder:text-cream/40",
                    nlError ? "border-cream/60" : "border-cream/20",
                  )}
                />
              </label>
              <Button type="submit" variant="cream" size="sm" disabled={busy}>
                {busy ? "…" : "Join"}
              </Button>
            </form>
          )}
          {nlError ? <p className="mt-2 text-xs text-cream/80">{nlError}</p> : null}
          <a
            href="https://instagram.com"
            className="mt-6 inline-flex items-center gap-2 text-sm text-cream/70 hover:text-cream"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
            @khamcairo
          </a>
        </div>
      </div>
      <div className="border-t border-cream/10 px-6 py-4 text-[11px] tracking-[0.08em] text-cream/50">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2">
          <p>© 2026 KHAM Cairo. Cairo, Egypt.</p>
          <p>Always authentic. Always curated.</p>
        </div>
      </div>
    </footer>
  );
}
