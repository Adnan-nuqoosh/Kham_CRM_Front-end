"use client";

import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { FREE_SHIPPING_EGP, formatMoney } from "@/lib/money";
import { useCatalog } from "@/lib/catalog-data";
import { t } from "@/lib/i18n";
import { cartTotal, useShop } from "@/lib/store";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const cart = useShop((s) => s.cart);
  const setQty = useShop((s) => s.setQty);
  const removeFromCart = useShop((s) => s.removeFromCart);
  const locale = useShop((s) => s.locale);
  const { currencyCode } = useCatalog();
  const copy = t(locale);
  const total = cartTotal(cart);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-5xl">{copy.bag}</h1>
      {cart.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-muted">{copy.emptyBag}</p>
          <Link href="/shop" className="mt-6 inline-block">
            <Button>{copy.continue}</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_280px]">
          <ul className="divide-y divide-border">
            {cart.map((line) => (
              <li key={line.variantId} className="flex gap-4 py-5">
                <Link
                  href={`/product/${line.slug}`}
                  className="size-24 shrink-0 overflow-hidden rounded-md bg-paper"
                >
                  <img
                    src={line.image}
                    alt=""
                    className="size-full object-cover"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-3">
                    <p className="font-display text-xl">{line.name}</p>
                    <p className="tabular-nums">
                      {formatMoney(line.unitPrice * line.qty, currencyCode)}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="inline-flex items-center rounded-full border border-border">
                      <button
                        type="button"
                        className="grid size-8 place-items-center"
                        onClick={() => setQty(line.variantId, line.qty - 1)}
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="w-6 text-center text-sm">{line.qty}</span>
                      <button
                        type="button"
                        className="grid size-8 place-items-center"
                        onClick={() => setQty(line.variantId, line.qty + 1)}
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="text-xs text-muted underline"
                      onClick={() => removeFromCart(line.variantId)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <aside className="h-fit rounded-2xl border border-border bg-paper p-5">
            <div className="flex justify-between text-sm">
              <span>{copy.subtotal}</span>
              <span className="tabular-nums">
                {formatMoney(total, currencyCode)}
              </span>
            </div>
            <p className="mt-3 text-xs text-muted">
              {total >= FREE_SHIPPING_EGP
                ? "Free delivery in Egypt."
                : `${formatMoney(FREE_SHIPPING_EGP - total, currencyCode)} to free delivery.`}
            </p>
            <Link href="/checkout">
              <Button className="mt-6 w-full">{copy.checkout}</Button>
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
