"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  friendlyApiError,
  storeApi,
  type StorefrontOrderDetail,
} from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { useShop } from "@/lib/store";
import { rememberPendingPayment } from "@/lib/pending-payment";
import { Button } from "@/components/ui/button";

export default function AccountOrderDetailPage() {
  const params = useParams();
  const orderNumber = String(params.orderNumber ?? "");
  const token = useShop((s) => s.token);
  const [order, setOrder] = useState<StorefrontOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !orderNumber) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void storeApi
      .order(orderNumber)
      .then((res) => {
        if (cancelled) return;
        setOrder(res.data);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(friendlyApiError(err, "Could not load this order."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, orderNumber]);

  if (!token) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="font-display text-4xl">Order</h1>
        <p className="mt-4 text-sm text-muted">Sign in to view this order.</p>
        <Button
          className="mt-8"
          onClick={() => window.dispatchEvent(new Event("kham:open-signin"))}
        >
          Sign in
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <p className="px-6 py-20 text-center text-sm text-muted">Loading order…</p>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <p className="text-sm text-muted">{error || "Order not found."}</p>
        <Link href="/account/orders" className="mt-6 inline-block">
          <Button variant="outline">Back to orders</Button>
        </Link>
      </div>
    );
  }

  const currency = order.currency_code || "EGP";
  const items = Array.isArray(order.items) ? order.items : [];
  const recovery = order.payment_recovery;
  const paymentUrl =
    recovery?.can_resume_payment && recovery.payment_url
      ? recovery.payment_url
      : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/account/orders"
        className="text-xs uppercase tracking-[0.16em] text-muted"
      >
        ← Orders
      </Link>
      <h1 className="mt-4 font-display text-5xl">{order.order_number}</h1>
      <p className="mt-2 text-sm text-muted">
        {[order.status, order.payment_status, order.fulfillment_status]
          .filter(Boolean)
          .join(" · ")}
      </p>

      {paymentUrl ? (
        <div className="mt-6 rounded-2xl border border-border bg-sand/40 px-5 py-4">
          <p className="text-sm text-ink">
            Payment is still pending. Continue on MyFatoorah to complete this
            order.
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              rememberPendingPayment(order.order_number, paymentUrl);
              window.location.assign(paymentUrl);
            }}
          >
            Complete payment
          </Button>
        </div>
      ) : recovery?.requires_reconciliation ? (
        <p className="mt-6 text-sm text-muted">
          Payment initiation needs reconciliation. Contact support before
          starting another payment for this order.
        </p>
      ) : null}

      <div className="mt-10 space-y-3 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-muted">Subtotal</span>
          <span className="tabular-nums">
            {formatMoney(Number(order.subtotal ?? 0), currency)}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted">Shipping</span>
          <span className="tabular-nums">
            {formatMoney(Number(order.shipping_total ?? 0), currency)}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted">Tax</span>
          <span className="tabular-nums">
            {formatMoney(Number(order.tax_total ?? 0), currency)}
          </span>
        </div>
        <div className="flex justify-between gap-3 border-t border-border pt-3 font-medium">
          <span>Total</span>
          <span className="tabular-nums">
            {formatMoney(Number(order.grand_total ?? 0), currency)}
          </span>
        </div>
      </div>

      {items.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-display text-2xl">Items</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {items.map((raw, i) => {
              const item = raw as Record<string, unknown>;
              return (
                <li key={String(item.id ?? i)} className="flex justify-between gap-3">
                  <span>
                    {String(item.product_name ?? item.name ?? "Item")}
                    {item.quantity != null ? ` × ${item.quantity}` : ""}
                  </span>
                  <span className="tabular-nums text-muted">
                    {item.id != null ? `Item #${item.id}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-xs text-muted">
            To leave a review, use the product page with a delivered order item
            id.
          </p>
        </section>
      ) : null}

      {order.shipments && order.shipments.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-display text-2xl">Shipments</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {order.shipments.map((s, i) => (
              <li key={i} className="rounded-xl border border-border px-4 py-3">
                <p>
                  {[s.carrier, s.tracking_number, s.status]
                    .filter(Boolean)
                    .join(" · ") || "Shipment"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
