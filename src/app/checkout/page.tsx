"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { friendlyApiError, storeApi } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import {
  defaultCityForMarket,
  getStoreMarketByCode,
  resolveMarketId,
} from "@/lib/markets";
import {
  SERVICE_COUNTRIES,
  citiesForCountry,
} from "@/lib/shipping-regions";
import { useCatalog } from "@/lib/catalog-data";
import { cartTotal, useShop } from "@/lib/store";
import {
  hasErrors,
  inputClass,
  sanitizeEmail,
  sanitizePersonName,
  sanitizePhone,
  validateCheckout,
  type FieldErrors,
} from "@/lib/validation";
import { FieldError } from "@/components/field-error";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

const fieldInput =
  "mt-2 h-11 w-full rounded-full border border-border bg-paper px-4 text-sm outline-none";

const envTestCheckout =
  process.env.NEXT_PUBLIC_STOREFRONT_TEST_CHECKOUT === "true";

export default function CheckoutPage() {
  const cart = useShop((s) => s.cart);
  const user = useShop((s) => s.user);
  const token = useShop((s) => s.token);
  const clearCart = useShop((s) => s.clearCart);
  const marketCode = useShop((s) => s.marketCode);
  const checkoutReady = useShop((s) => s.checkoutReady);
  const localMockCheckout = useShop((s) => s.localMockCheckout);
  const { currencyCode, marketId } = useCatalog();

  const testCheckoutEnabled = envTestCheckout || localMockCheckout;
  const canProductionCheckout = Boolean(token && checkoutReady);

  const [countryCode, setCountryCode] = useState(marketCode);
  const [cityOptions, setCityOptions] = useState<string[]>(() => [
    ...citiesForCountry(marketCode),
  ]);
  const [otherCitiesSupported, setOtherCitiesSupported] = useState(false);
  const [city, setCity] = useState<string>(
    () => defaultCityForMarket(marketCode),
  );
  const [customCity, setCustomCity] = useState("");
  const [name, setName] = useState(user?.name ?? "");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [paymentMethod, setPaymentMethod] = useState<
    "CARD" | "APPLE_PAY" | "GOOGLE_PAY" | "KNET"
  >("CARD");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [placed, setPlaced] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [quotedSubtotal, setQuotedSubtotal] = useState<number | null>(null);
  const [quotedShipping, setQuotedShipping] = useState<number | null>(null);
  const [quotedTax, setQuotedTax] = useState<number | null>(null);
  const [quotedTaxStatus, setQuotedTaxStatus] = useState<string | null>(null);
  const [quotedTotalBeforeTax, setQuotedTotalBeforeTax] = useState<number | null>(
    null,
  );
  const [quotedCurrency, setQuotedCurrency] = useState<string | null>(null);
  const [quoteNote, setQuoteNote] = useState<string | null>(null);
  const [quoteOk, setQuoteOk] = useState(false);

  function clearQuoteBreakdown() {
    setQuotedSubtotal(null);
    setQuotedShipping(null);
    setQuotedTax(null);
    setQuotedTaxStatus(null);
    setQuotedTotalBeforeTax(null);
    setQuotedCurrency(null);
    setQuoteOk(false);
    setQuoteNote(null);
  }

  async function loadDestinationsForCountry(code: string) {
    const upper = code.toUpperCase();
    const mid =
      getStoreMarketByCode(upper).id ?? resolveMarketId(upper) ?? marketId;
    try {
      const res = await storeApi.destinations(mid);
      const cities = res.data.cities?.length
        ? res.data.cities
        : [...citiesForCountry(upper)];
      setCityOptions(cities);
      setOtherCitiesSupported(Boolean(res.data.other_cities_supported));
      setCountryCode((res.data.country_code || upper).toUpperCase());
      setCity(cities[0] ?? "");
      setCustomCity("");
    } catch {
      const fallback = [...citiesForCountry(upper)];
      setCityOptions(fallback);
      setOtherCitiesSupported(false);
      setCountryCode(upper);
      setCity(fallback[0] ?? defaultCityForMarket(upper));
      setCustomCity("");
    }
  }

  useEffect(() => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setPhone(user?.phone ?? "");
  }, [user]);

  // Sync shipping country when the header market changes — do not clear cart here.
  useEffect(() => {
    clearQuoteBreakdown();
    setError(null);
    let cancelled = false;
    void loadDestinationsForCountry(marketCode).then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when shop market changes
  }, [marketCode, marketId]);

  const localTotal = cartTotal(cart);
  const items = useMemo(
    () =>
      cart.map((l) => ({
        variant_id: l.variantId,
        quantity: l.qty,
      })),
    [cart],
  );

  // Quote against the shipping country's market; keep cart market separate so
  // changing country does not wipe the bag (header market switch still clears).
  const quoteMarketId =
    getStoreMarketByCode(countryCode).id ??
    resolveMarketId(countryCode) ??
    marketId;
  const resolvedCity = otherCitiesSupported && customCity.trim()
    ? customCity.trim()
    : city;
  const countryDiffersFromShop =
    countryCode.toUpperCase() !== marketCode.toUpperCase();

  function onCountryChange(next: string) {
    setCountryCode(next);
    clearQuoteBreakdown();
    setError(null);
    void loadDestinationsForCountry(next);
  }

  function onCityChange(next: string) {
    setCity(next);
    setCustomCity("");
    clearQuoteBreakdown();
    setError(null);
  }

  async function refreshQuote() {
    if (!items.length) return null;
    try {
      const res = await storeApi.quote({
        market_id: quoteMarketId,
        items,
        shipping_address: {
          country_code: countryCode,
          city: resolvedCity,
        },
      });
      const q = res.data;
      const subtotal = Number(q.net_subtotal ?? q.subtotal);
      const shipping = Number(q.shipping?.shipping_total ?? 0);
      const beforeTax = Number(q.total_before_tax ?? subtotal + shipping);
      const taxRaw = q.tax_total;
      const tax =
        taxRaw === null || taxRaw === undefined || taxRaw === ""
          ? null
          : Number(taxRaw);

      setQuotedSubtotal(Number.isFinite(subtotal) ? subtotal : null);
      setQuotedShipping(Number.isFinite(shipping) ? shipping : null);
      setQuotedTax(tax !== null && Number.isFinite(tax) ? tax : null);
      setQuotedTaxStatus(q.tax_status ?? null);
      setQuotedTotalBeforeTax(Number.isFinite(beforeTax) ? beforeTax : null);
      setQuotedCurrency(q.currency_code || null);
      setQuoteOk(true);
      setQuoteNote(
        q.is_final_payable_total
          ? null
          : "This is a provisional quote. Final payable total unlocks when tax/shipping readiness gates pass.",
      );
      setError(null);
      return q;
    } catch (err) {
      clearQuoteBreakdown();
      setError(
        friendlyApiError(
          err,
          "We couldn’t update your order total. Please try again.",
        ),
      );
      return null;
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPaymentUrl(null);
    const nextErrors = validateCheckout({
      name,
      phone,
      email,
      requireEmail: !token,
      address,
      countryCode,
      city: resolvedCity,
    });
    setFieldErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      setError("Please fix the highlighted fields.");
      return;
    }
    setBusy(true);
    try {
      const quote = await refreshQuote();
      if (!quote) return;

      const [first, ...rest] = name.trim().split(/\s+/);
      const idempotency_key = `web-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      const shipping_address = {
        first_name: first || name,
        last_name: rest.join(" ") || null,
        phone,
        line1: address,
        city: resolvedCity,
        country_code: countryCode,
      };

      if (canProductionCheckout) {
        const res = await storeApi.checkout({
          idempotency_key,
          market_id: quoteMarketId,
          payment_method: paymentMethod,
          items,
          shipping_address,
        });
        const data = res.data;
        setPlaced(data.order_number || "OK");
        if (data.payment_url) setPaymentUrl(data.payment_url);
        clearCart();
        return;
      }

      if (!testCheckoutEnabled) {
        setError(
          token
            ? "Production checkout isn’t ready for this market yet (tax/shipping gates). You can still get a quote."
            : "Sign in to use production checkout when ready, or enable local test checkout for QA.",
        );
        return;
      }

      const res = await storeApi.testCheckout({
        idempotency_key,
        market_id: quoteMarketId,
        items,
        customer: {
          first_name: first || name,
          last_name: rest.join(" ") || null,
          email: email || "guest@example.com",
          phone,
        },
        shipping_address,
      });
      const order = res.data as { order_number?: string; id?: number };
      setPlaced(order.order_number || String(order.id || "OK"));
      clearCart();
    } catch (err) {
      setError(
        friendlyApiError(
          err,
          "We couldn’t place your order. Please try again.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  if (cart.length === 0 && !placed) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="font-display text-4xl">Your bag is empty</h1>
        <Link href="/shop" className="mt-6 inline-block">
          <Button>Shop the collection</Button>
        </Link>
      </div>
    );
  }

  if (placed) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
          Order received
        </p>
        <h1 className="mt-3 font-display text-5xl">Thank you.</h1>
        <p className="mt-4 text-sm text-muted">
          Reference{" "}
          <span className="tabular-nums text-ink">{placed}</span>.
        </p>
        {paymentUrl ? (
          <a href={paymentUrl} className="mt-6 inline-block">
            <Button>Complete payment</Button>
          </a>
        ) : null}
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/account/orders">
            <Button variant="outline">View orders</Button>
          </Link>
          <Link href="/">
            <Button>Back to the house</Button>
          </Link>
        </div>
      </div>
    );
  }

  const displayCurrency = quotedCurrency || currencyCode;
  const hasQuote = quotedTotalBeforeTax !== null;
  const estimatedTotal =
    hasQuote && quotedTax !== null
      ? quotedTotalBeforeTax + quotedTax
      : quotedTotalBeforeTax ?? localTotal;

  const countryOptions = SERVICE_COUNTRIES.map((c) => ({
    value: c.code,
    label: c.name,
  }));

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="mx-auto grid max-w-4xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2"
    >
      <div className="space-y-4">
        <h1 className="font-display text-5xl">Checkout</h1>
        {countryDiffersFromShop ? (
          <p className="rounded-xl bg-sand/70 px-4 py-3 text-sm">
            Bag prices are from {marketCode}, but shipping is set to{" "}
            {countryCode}. Totals may differ for that destination. Use the
            header market switcher to reprice the bag for another market.
          </p>
        ) : null}
        {!token ? (
          <p className="rounded-xl bg-sand/70 px-4 py-3 text-sm">
            Sign in for production checkout and order history.{" "}
            <button
              type="button"
              className="underline underline-offset-4"
              onClick={() =>
                window.dispatchEvent(new Event("kham:open-signin"))
              }
            >
              Open account
            </button>
          </p>
        ) : null}
        <label className="block text-xs uppercase tracking-[0.16em] text-muted">
          Full name
          <input
            value={name}
            onChange={(e) => {
              setName(sanitizePersonName(e.target.value));
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.name;
                return next;
              });
            }}
            autoComplete="name"
            aria-invalid={Boolean(fieldErrors.name)}
            className={inputClass(Boolean(fieldErrors.name), fieldInput)}
          />
          <FieldError message={fieldErrors.name} />
        </label>
        <label className="block text-xs uppercase tracking-[0.16em] text-muted">
          Phone
          <input
            value={phone}
            onChange={(e) => {
              setPhone(sanitizePhone(e.target.value));
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.phone;
                return next;
              });
            }}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+20 100 000 0000"
            aria-invalid={Boolean(fieldErrors.phone)}
            className={inputClass(Boolean(fieldErrors.phone), fieldInput)}
          />
          <FieldError message={fieldErrors.phone} />
        </label>
        {!token ? (
          <label className="block text-xs uppercase tracking-[0.16em] text-muted">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(sanitizeEmail(e.target.value));
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.email;
                  return next;
                });
              }}
              autoComplete="email"
              aria-invalid={Boolean(fieldErrors.email)}
              className={inputClass(Boolean(fieldErrors.email), fieldInput)}
            />
            <FieldError message={fieldErrors.email} />
          </label>
        ) : null}
        <label className="block text-xs uppercase tracking-[0.16em] text-muted">
          Address
          <input
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.address;
                return next;
              });
            }}
            autoComplete="street-address"
            aria-invalid={Boolean(fieldErrors.address)}
            className={inputClass(Boolean(fieldErrors.address), fieldInput)}
          />
          <FieldError message={fieldErrors.address} />
        </label>
        <label className="block text-xs uppercase tracking-[0.16em] text-muted">
          Country
          <Select
            label="Country"
            fullWidth
            className="mt-2"
            value={countryCode}
            onChange={(v) => {
              onCountryChange(v);
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.countryCode;
                return next;
              });
            }}
            options={countryOptions}
          />
          <FieldError message={fieldErrors.countryCode} />
        </label>
        <label className="block text-xs uppercase tracking-[0.16em] text-muted">
          City
          <Select
            label="City"
            fullWidth
            className="mt-2"
            value={city}
            onChange={(v) => {
              onCityChange(v);
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.city;
                return next;
              });
            }}
            options={cityOptions.map((c) => ({ value: c, label: c }))}
          />
          <FieldError message={fieldErrors.city} />
        </label>
        {otherCitiesSupported ? (
          <label className="block text-xs uppercase tracking-[0.16em] text-muted">
            Other city (optional)
            <input
              value={customCity}
              onChange={(e) => {
                setCustomCity(e.target.value);
                clearQuoteBreakdown();
              }}
              placeholder="If your city isn’t listed"
              className="mt-2 h-11 w-full rounded-full border border-border bg-paper px-4 text-sm outline-none"
            />
          </label>
        ) : null}
        {canProductionCheckout ? (
          <label className="block text-xs uppercase tracking-[0.16em] text-muted">
            Payment method
            <Select
              label="Payment"
              fullWidth
              className="mt-2"
              value={paymentMethod}
              onChange={(v) =>
                setPaymentMethod(
                  v as "CARD" | "APPLE_PAY" | "GOOGLE_PAY" | "KNET",
                )
              }
              options={[
                { value: "CARD", label: "Card" },
                { value: "APPLE_PAY", label: "Apple Pay" },
                { value: "GOOGLE_PAY", label: "Google Pay" },
                { value: "KNET", label: "KNET" },
              ]}
            />
          </label>
        ) : null}
        <Button
          type="button"
          variant="outline"
          onClick={() => void refreshQuote()}
        >
          Update quote
        </Button>
        {quoteNote ? (
          <p className="text-xs text-muted">{quoteNote}</p>
        ) : null}
        {!canProductionCheckout && !testCheckoutEnabled ? (
          <p className="text-xs text-muted">
            Final payable checkout unlocks when the selected market is ready
            (approved tax + shipping) and you are signed in.
          </p>
        ) : null}
        {error ? (
          <p className="rounded-xl bg-sand/70 px-4 py-3 text-sm text-ink">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          disabled={
            busy ||
            ((canProductionCheckout || testCheckoutEnabled) &&
              !quoteOk &&
              items.length > 0)
          }
        >
          {busy
            ? "Placing…"
            : canProductionCheckout
              ? "Pay & place order"
              : testCheckoutEnabled
                ? "Place test order"
                : "Get quote / continue"}
        </Button>
      </div>
      <aside className="h-fit rounded-2xl border border-border bg-paper p-6">
        <h2 className="font-display text-2xl">Bag</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {cart.map((l) => (
            <li key={l.variantId} className="flex justify-between gap-3">
              <span>
                {l.name} × {l.qty}
              </span>
              <span className="tabular-nums">
                {formatMoney(l.unitPrice * l.qty, currencyCode)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
          {hasQuote ? (
            <>
              <div className="flex justify-between gap-3">
                <span className="text-muted">Subtotal</span>
                <span className="tabular-nums">
                  {formatMoney(quotedSubtotal ?? 0, displayCurrency)}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted">Shipping</span>
                <span className="tabular-nums">
                  {formatMoney(quotedShipping ?? 0, displayCurrency)}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted">
                  Tax
                  {quotedTaxStatus && quotedTaxStatus !== "approved_not_enabled"
                    ? ` (${quotedTaxStatus.replaceAll("_", " ")})`
                    : quotedTax !== null
                      ? " (preview)"
                      : ""}
                </span>
                <span className="tabular-nums">
                  {quotedTax !== null
                    ? formatMoney(quotedTax, displayCurrency)
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between gap-3 border-t border-border pt-2 font-medium">
                <span>
                  {quotedTax !== null ? "Estimated total" : "Total before tax"}
                </span>
                <span className="tabular-nums">
                  {formatMoney(estimatedTotal, displayCurrency)}
                </span>
              </div>
            </>
          ) : (
            <div className="flex justify-between gap-3">
              <span>Bag subtotal</span>
              <span className="tabular-nums">
                {formatMoney(localTotal, displayCurrency)}
              </span>
            </div>
          )}
        </div>
      </aside>
    </form>
  );
}
