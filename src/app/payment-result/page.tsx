"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  friendlyApiError,
  storeApi,
  type StorefrontOrderDetail,
} from "@/lib/api";
import {
  clearPendingPayment,
  readPendingPaymentOrder,
} from "@/lib/pending-payment";
import { formatMoney } from "@/lib/money";
import { useShop } from "@/lib/store";
import { Button } from "@/components/ui/button";

function statusLabel(status?: string | null) {
  if (!status) return "unknown";
  return status.replaceAll("_", " ");
}

export default function PaymentResultPage() {
  const token = useShop((s) => s.token);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [order, setOrder] = useState<StorefrontOrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [polls, setPolls] = useState(0);

  useEffect(() => {
    setOrderNumber(readPendingPaymentOrder());
  }, []);

  useEffect(() => {
    if (!token || !orderNumber) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 8;
    let timer: number | undefined;

    async function tick() {
      attempts += 1;
      setPolls(attempts);
      setLoading(true);
      try {
        const res = await storeApi.order(orderNumber!);
        if (cancelled) return;
        setOrder(res.data);
        setError(null);
        const paid =
          String(res.data.payment_status ?? "").toLowerCase() === "paid";
        if (paid) {
          clearPendingPayment();
          setLoading(false);
          return;
        }
      } catch (err) {
        if (cancelled) return;
        setError(friendlyApiError(err, "Could not refresh payment status."));
      } finally {
        if (!cancelled) setLoading(false);
      }

      if (!cancelled && attempts < maxAttempts) {
        timer = window.setTimeout(() => {
          void tick();
        }, 2500);
      }
    }

    void tick();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [token, orderNumber]);

  const paid = useMemo(
    () => String(order?.payment_status ?? "").toLowerCase() === "paid",
    [order],
  );

  if (!token) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
          Payment result
        </p>
        <h1 className="mt-3 font-display text-5xl">Sign in to confirm</h1>
        <p className="mt-4 text-sm text-muted">
          After MyFatoorah redirects back, sign in to see whether your order was
          paid.
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

  if (!orderNumber) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
          Payment result
        </p>
        <h1 className="mt-3 font-display text-5xl">No pending payment</h1>
        <p className="mt-4 text-sm text-muted">
          Start checkout again, or open your orders to review recent payments.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/account/orders">
            <Button variant="outline">View orders</Button>
          </Link>
          <Link href="/checkout">
            <Button>Checkout</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-20 text-center">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
        Payment result
      </p>
      <h1 className="mt-3 font-display text-5xl">
        {paid ? "Payment received" : loading ? "Confirming…" : "Payment pending"}
      </h1>
      <p className="mt-4 text-sm text-muted">
        Order{" "}
        <span className="tabular-nums text-ink">{orderNumber}</span>
        {order?.payment_status
          ? ` · ${statusLabel(order.payment_status)}`
          : null}
      </p>
      {order?.grand_total != null ? (
        <p className="mt-2 text-sm tabular-nums text-muted">
          {formatMoney(
            Number(order.grand_total),
            order.currency_code || "EGP",
          )}
        </p>
      ) : null}
      {error ? (
        <p className="mt-6 rounded-xl bg-sand/70 px-4 py-3 text-sm text-ink">
          {error}
        </p>
      ) : null}
      {!paid && !error ? (
        <p className="mt-6 text-xs text-muted">
          Status updates when MyFatoorah’s webhook settles the order
          {polls > 1 ? ` (checked ${polls}×)` : ""}. This page is not proof of
          payment by itself.
        </p>
      ) : null}
      <div className="mt-8 flex justify-center gap-4">
        <Link href={`/account/orders/${encodeURIComponent(orderNumber)}`}>
          <Button variant="outline">View order</Button>
        </Link>
        <Link href="/">
          <Button>Back to the house</Button>
        </Link>
      </div>
    </div>
  );
}
