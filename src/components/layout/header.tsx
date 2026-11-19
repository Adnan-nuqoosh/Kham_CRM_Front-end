"use client";

import Link from "next/link";
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
  Mic,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useCatalog } from "@/lib/catalog-data";
import { marketSelectOptions } from "@/lib/markets";
import { t } from "@/lib/i18n";
import { cartCount, useHydrated, useShop } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { Select } from "@/components/ui/select";

const NAV = [
  { to: "/shop" as const, key: "shop" as const },
  { to: "/brands" as const, key: "brands" as const },
  { to: "/rituals" as const, key: "rituals" as const },
  { to: "/about" as const, key: "about" as const },
  { to: "/edit" as const, key: "edit" as const },
  { to: "/for-brands" as const, key: "forBrands" as const },
];

export function AnnouncementBar() {
  const locale = useShop((s) => s.locale);
  const copy = t(locale);
  // categories loaded via CatalogProvider for shop mega-menu elsewhere
  const items =
    locale === "ar"
      ? ["توصيل مجاني في مصر فوق ١٠٠٠ جنيه", "علامات أصيلة", "مكوّنات طبيعية", "أنتِ أجمل"]
      : [
          "Free delivery in Egypt over EGP 1,000",
          "Authentic Brands",
          "Natural Ingredients",
          "A More Beautiful You",
        ];
  return (
    <div className="bg-olive text-cream">
      <div className="mx-auto hidden max-w-[1440px] items-center justify-between px-6 py-2 text-[11px] tracking-[0.08em] lg:flex">
        <p className="flex flex-wrap gap-x-3">
          {items.map((item, i) => (
            <span key={item} className="inline">
              {i > 0 ? " | " : ""}
              {item}
            </span>
          ))}
        </p>
        <TopUtils />
      </div>
      <div className="overflow-hidden py-2 lg:hidden">
        <div className="marquee-track flex w-max gap-10 whitespace-nowrap px-6 text-[11px] tracking-[0.08em]">
          {[...items, ...items, ...items].map((item, i) => (
            <span key={i}>{item}</span>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 px-4 pb-2 text-[11px] lg:hidden">
        <TopUtils compact />
      </div>
    </div>
  );
}

function displayName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

function AccountButton({
  light = false,
  className,
}: {
  light?: boolean;
  className?: string;
}) {
  const user = useShop((s) => s.user);
  const locale = useShop((s) => s.locale);
  const copy = t(locale);
  const hydrated = useHydrated();
  const openSignIn = useShopOpen().openSignIn;
  const label =
    hydrated && user ? displayName(user.name) : copy.signIn;

  return (
    <button
      type="button"
      onClick={openSignIn}
      className={cn(
        "max-w-[9rem] truncate tracking-[0.04em]",
        light ? "text-cream" : "text-ink",
        className,
      )}
      aria-label={hydrated && user ? `Account: ${user.name}` : copy.signIn}
    >
      {label}
    </button>
  );
}

function TopUtils({ compact = false }: { compact?: boolean }) {
  const marketCode = useShop((s) => s.marketCode);
  const setMarketCode = useShop((s) => s.setMarketCode);
  const marketSwitching = useShop((s) => s.marketSwitching);
  const locale = useShop((s) => s.locale);
  const setLocale = useShop((s) => s.setLocale);
  const copy = t(locale);

  return (
    <div className={cn("flex items-center gap-4 text-cream", compact && "gap-3")}>
      <Select
        label="Market"
        tone="light"
        value={marketCode}
        disabled={marketSwitching}
        onChange={(v) => {
          void setMarketCode(v);
        }}
        options={marketSelectOptions()}
      />
      <button
        type="button"
        onClick={() => {
          void setLocale(locale === "en" ? "ar" : "en");
        }}
        className="tracking-[0.04em]"
      >
        {locale === "en" ? "العربية" : "English"}
      </button>
      <AccountButton light />
      <Link href="/wishlist" aria-label={copy.wishlist} className="hidden sm:block">
        <Heart className="size-4" strokeWidth={1.4} />
      </Link>
      <BagButton light />
    </div>
  );
}

function useShopOpen() {
  return {
    openCart: () => window.dispatchEvent(new Event("kham:open-cart")),
    openSearch: () => window.dispatchEvent(new Event("kham:open-search")),
    openSignIn: () => window.dispatchEvent(new Event("kham:open-signin")),
    openMenu: () => window.dispatchEvent(new Event("kham:open-menu")),
  };
}

export function BagButton({ light = false }: { light?: boolean }) {
  const cart = useShop((s) => s.cart);
  const hydrated = useHydrated();
  const n = hydrated ? cartCount(cart) : 0;
  const openCart = useShopOpen().openCart;
  return (
    <button
      type="button"
      onClick={openCart}
      className={cn("relative", light ? "text-cream" : "text-ink")}
      aria-label="Open bag"
    >
      <ShoppingBag className="size-5" strokeWidth={1.4} />
      <span className="absolute -end-2 -top-1.5 min-w-4 text-center text-[10px] tabular-nums">
        {n}
      </span>
    </button>
  );
}

export function Header() {
  const locale = useShop((s) => s.locale);
  const copy = t(locale);
  const { categories } = useCatalog();
  const { openSearch, openMenu } = useShopOpen();
  const [shopOpen, setShopOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-cream/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 py-4 sm:px-6">
        <button
          type="button"
          className="grid size-11 place-items-center lg:hidden"
          onClick={openMenu}
          aria-label="Open menu"
        >
          <Menu className="size-5" strokeWidth={1.4} />
        </button>
        <Logo />
        <nav className="ms-6 hidden items-center gap-5 xl:gap-7 lg:flex">
          {NAV.map((item) =>
            item.key === "shop" ? (
              <div
                key={item.to}
                className="relative"
                onMouseEnter={() => setShopOpen(true)}
                onMouseLeave={() => setShopOpen(false)}
              >
                <Link
                  href={item.to}
                  className="text-[12px] font-medium uppercase tracking-[0.18em] text-ink/80 hover:text-ink"
                >
                  {copy[item.key]}
                </Link>
                {shopOpen && (
                  <div className="absolute start-0 top-full z-50 pt-4">
                    <div className="w-[540px] rounded-xl border border-border bg-paper p-5 shadow-[0_20px_50px_-24px_rgb(28_25_22_/_0.4)]">
                      <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted">
                        Categories
                      </p>
                      <div className="grid grid-cols-2 gap-1">
                        {categories.map((c) => (
                          <Link
                            key={c.id}
                            href={`/shop?category=${c.id}`}
                            className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sand"
                            onClick={() => setShopOpen(false)}
                          >
                            <img
                              src={c.image}
                              alt=""
                              className="size-10 rounded-full object-cover"
                            />
                            <span className="text-sm">
                              {locale === "ar" ? c.labelAr : c.label}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.to}
                href={item.to}
                className="text-[12px] font-medium uppercase tracking-[0.18em] text-ink/80 hover:text-ink"
              >
                {copy[item.key]}
              </Link>
            ),
          )}
        </nav>
        <div className="ms-auto flex flex-1 items-center justify-end gap-3">
          <button
            type="button"
            onClick={openSearch}
            className="hidden h-11 max-w-md flex-1 items-center gap-2 rounded-full border border-border bg-paper px-4 text-start text-sm text-muted md:flex lg:max-w-sm xl:max-w-md"
          >
            <Search className="size-4" strokeWidth={1.5} />
            <span className="flex-1 truncate">{copy.search}</span>
            <Mic className="size-4 opacity-50" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={openSearch}
            className="grid size-11 place-items-center md:hidden"
            aria-label="Search"
          >
            <Search className="size-5" strokeWidth={1.4} />
          </button>
          <nav className="hidden items-center gap-5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink/70 2xl:flex">
            <Link href="/shop" className="hover:text-ink">
              {copy.beauty}
            </Link>
            <Link href="/rituals" className="hover:text-ink">
              {copy.rituals}
            </Link>
            <Link href="/community" className="hover:text-ink">
              {copy.community}
            </Link>
          </nav>
          <div className="hidden items-center gap-3 lg:flex xl:hidden">
            <Link href="/wishlist" aria-label={copy.wishlist}>
              <Heart className="size-5" strokeWidth={1.4} />
            </Link>
            <BagButton />
          </div>
        </div>
      </div>
    </header>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const locale = useShop((s) => s.locale);
  const user = useShop((s) => s.user);
  const copy = t(locale);
  const { categories } = useCatalog();
  const { openSignIn } = useShopOpen();
  const hydrated = useHydrated();

  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener("kham:open-menu", on);
    return () => window.removeEventListener("kham:open-menu", on);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-cream lg:hidden">
      <div className="flex items-center justify-between px-4 py-4">
        <Logo />
        <button
          type="button"
          className="grid size-11 place-items-center"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <X className="size-5" />
        </button>
      </div>
      <nav className="flex flex-col gap-1 px-6 py-4">
        {NAV.map((item) => (
          <Link
            key={item.to}
            href={item.to}
            onClick={() => setOpen(false)}
            className="border-b border-border py-3 font-display text-2xl"
          >
            {copy[item.key]}
          </Link>
        ))}
        <Link href="/community" onClick={() => setOpen(false)} className="py-3 font-display text-2xl">
          {copy.community}
        </Link>
        <Link href="/wishlist" onClick={() => setOpen(false)} className="py-3 text-sm uppercase tracking-[0.16em]">
          {copy.wishlist}
        </Link>
        <button
          type="button"
          className="mt-4 flex items-center gap-2 text-sm uppercase tracking-[0.16em]"
          onClick={() => {
            setOpen(false);
            openSignIn();
          }}
        >
          <User className="size-4" />{" "}
          {hydrated && user ? displayName(user.name) : copy.signIn}
        </button>
      </nav>
      <div className="mt-6 grid grid-cols-4 gap-3 px-6">
        {categories.slice(0, 8).map((c) => (
          <Link
            key={c.id}
            href={`/shop?category=${c.id}`}
            onClick={() => setOpen(false)}
            className="flex flex-col items-center gap-2"
          >
            <img src={c.image} alt="" className="size-14 rounded-full object-cover" />
            <span className="text-center text-[10px] uppercase tracking-[0.12em]">
              {locale === "ar" ? c.labelAr : c.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export { useShopOpen };
