"use client";

import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { FREE_SHIPPING_EGP, formatMoney } from "@/lib/money";
import { useCatalog } from "@/lib/catalog-data";
import { t } from "@/lib/i18n";
import { cartCount, cartTotal, useShop } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ANIM_MS = 320;

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const [present, setPresent] = useState(false);
  const [entered, setEntered] = useState(false);
  const cart = useShop((s) => s.cart);
  const setQty = useShop((s) => s.setQty);
  const removeFromCart = useShop((s) => s.removeFromCart);
  const locale = useShop((s) => s.locale);
  const { currencyCode } = useCatalog();
  const copy = t(locale);

  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener("kham:open-cart", on);
    return () => window.removeEventListener("kham:open-cart", on);
  }, []);

  useEffect(() => {
    if (open) {
      setPresent(true);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
      return () => cancelAnimationFrame(id);
    }
    setEntered(false);
    const t = window.setTimeout(() => setPresent(false), ANIM_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = present ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [present]);

  const total = cartTotal(cart);
  const remain = Math.max(0, FREE_SHIPPING_EGP - total);
  const progress = Math.min(100, (total / FREE_SHIPPING_EGP) * 100);

  if (!present) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-ink/40 transition-opacity duration-300 ease-out",
          entered ? "opacity-100" : "opacity-0",
        )}
        aria-label="Close bag"
        onClick={() => setOpen(false)}
      />
      <aside
        className={cn(
          "absolute end-0 top-0 flex h-full w-full max-w-md flex-col bg-paper shadow-2xl transition-transform duration-300 ease-out will-change-transform",
          entered
            ? "translate-x-0"
            : "ltr:translate-x-full rtl:-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-2xl">
            {copy.bag}{" "}
            <span className="text-base text-muted">({cartCount(cart)})</span>
          </h2>
          <button
            type="button"
            className="grid size-11 place-items-center"
            onClick={() => setOpen(false)}
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="border-b border-border px-5 py-3">
          <p className="text-xs text-muted">
            {remain === 0
              ? copy.freeShip
              : `${formatMoney(remain, currencyCode)} to free delivery in Egypt`}
          </p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-sand">
            <div
              className="h-full bg-olive transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted">{copy.emptyBag}</p>
              <Button className="mt-6" onClick={() => setOpen(false)}>
                {copy.continue}
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {cart.map((line) => (
                <li key={line.variantId} className="flex gap-3">
                  <Link
                    href={`/product/${line.slug}`}
                    onClick={() => setOpen(false)}
                    className="size-20 shrink-0 overflow-hidden rounded-md bg-cream"
                  >
                    <img
                      src={line.image}
                      alt=""
                      className="size-full object-cover"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-display text-lg leading-tight">
                          {line.name}
                        </p>
                      </div>
                      <p className="text-sm tabular-nums">
                        {formatMoney(line.unitPrice * line.qty, currencyCode)}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="inline-flex items-center rounded-full border border-border">
                        <button
                          type="button"
                          className="grid size-8 place-items-center"
                          onClick={() => setQty(line.variantId, line.qty - 1)}
                          aria-label="Decrease"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-6 text-center text-sm tabular-nums">
                          {line.qty}
                        </span>
                        <button
                          type="button"
                          className="grid size-8 place-items-center"
                          onClick={() => setQty(line.variantId, line.qty + 1)}
                          aria-label="Increase"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="text-xs text-muted underline-offset-2 hover:underline"
                        onClick={() => removeFromCart(line.variantId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {cart.length > 0 && (
          <div className="border-t border-border px-5 py-4">
            <div className="mb-3 flex justify-between text-sm">
              <span>{copy.subtotal}</span>
              <span className="tabular-nums">
                {formatMoney(total, currencyCode)}
              </span>
            </div>
            <Link href="/checkout" onClick={() => setOpen(false)}>
              <Button className="w-full">{copy.checkout}</Button>
            </Link>
            <Link
              href="/cart"
              onClick={() => setOpen(false)}
              className="mt-3 block text-center text-xs uppercase tracking-[0.16em] text-muted hover:text-ink"
            >
              View bag
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
