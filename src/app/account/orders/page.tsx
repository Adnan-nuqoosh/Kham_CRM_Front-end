"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { friendlyApiError, storeApi, type StorefrontOrderSummary } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { useShop } from "@/lib/store";
import { Button } from "@/components/ui/button";

export default function AccountOrdersPage() {
  const token = useShop((s) => s.token);
  const [orders, setOrders] = useState<StorefrontOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void storeApi
      .orders()
      .then((res) => {
        if (cancelled) return;
        setOrders(res.data ?? []);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(friendlyApiError(err, "Could not load orders."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="font-display text-4xl">My orders</h1>
        <p className="mt-4 text-sm text-muted">
          Sign in to view your order history.
        </p>
        <Button
          className="mt-8"
          onClick={() => window.dispatchEvent(new Event("kham:open-signin"))}
        >
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-5xl">My orders</h1>
      {loading ? (
        <p className="mt-8 text-sm text-muted">Loading…</p>
      ) : error ? (
        <p className="mt-8 rounded-xl bg-sand/70 px-4 py-3 text-sm">{error}</p>
      ) : orders.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-muted">No orders yet.</p>
          <Link href="/shop" className="mt-6 inline-block">
            <Button>Shop the collection</Button>
          </Link>
        </div>
      ) : (
        <ul className="mt-10 divide-y divide-border border-y border-border">
          {orders.map((o) => {
            const number = o.order_number || String(o.id);
            const total = Number(o.grand_total ?? 0);
            return (
              <li key={number} className="flex items-center justify-between gap-4 py-5">
                <div>
                  <Link
                    href={`/account/orders/${encodeURIComponent(number)}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {number}
                  </Link>
                  <p className="mt-1 text-xs text-muted">
                    {[o.status, o.payment_status].filter(Boolean).join(" · ")}
                    {o.placed_at
                      ? ` · ${new Date(o.placed_at).toLocaleDateString()}`
                      : ""}
                  </p>
                </div>
                <span className="tabular-nums text-sm">
                  {Number.isFinite(total)
                    ? formatMoney(total, o.currency_code || "EGP")
                    : "—"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
