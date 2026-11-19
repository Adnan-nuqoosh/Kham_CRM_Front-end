"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Heart, Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/money";
import {
  friendlyApiError,
  storeApi,
  type StorefrontReviewSummary,
} from "@/lib/api";
import { useCatalog } from "@/lib/catalog-data";
import { t } from "@/lib/i18n";
import { useShop } from "@/lib/store";
import {
  hasErrors,
  inputClass,
  sanitizeDigits,
  validateReview,
  type FieldErrors,
} from "@/lib/validation";
import { FieldError } from "@/components/field-error";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { StarRating } from "@/components/star-rating";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function ProductPage() {
  const params = useParams();
  const slug = String(params.slug ?? "");
  const {
    getProduct,
    getBrand,
    relatedProducts,
    fetchProduct,
    currencyCode,
    marketId,
    loading,
  } = useCatalog();
  const [product, setProduct] = useState(() => getProduct(slug));
  const [ready, setReady] = useState(Boolean(getProduct(slug)));
  const [reviews, setReviews] = useState<StorefrontReviewSummary | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [variantId, setVariantId] = useState<number | null>(null);
  const addToCart = useShop((s) => s.addToCart);
  const toggleWishlist = useShop((s) => s.toggleWishlist);
  const wishlist = useShop((s) => s.wishlist);
  const locale = useShop((s) => s.locale);
  const marketCode = useShop((s) => s.marketCode);
  const token = useShop((s) => s.token);
  const viewProduct = useShop((s) => s.viewProduct);
  const copy = t(locale);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"story" | "use" | "in">("story");
  const [reviewOrderItemId, setReviewOrderItemId] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);
  const [reviewErrors, setReviewErrors] = useState<FieldErrors>({});

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setActiveImage(0);
    const cached = getProduct(slug);
    if (cached) {
      setProduct(cached);
      setVariantId(cached.variantId);
      setReady(true);
    }
    void fetchProduct(slug).then((p) => {
      if (cancelled) return;
      setProduct(p ?? undefined);
      setVariantId(p?.variantId ?? null);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [slug, marketCode, marketId, getProduct, fetchProduct]);

  useEffect(() => {
    if (product) viewProduct(product.slug);
  }, [product, viewProduct]);

  useEffect(() => {
    if (!product?.id && !product?.slug) return;
    let cancelled = false;
    void storeApi
      .productReviews(product.slug || product.id)
      .then((res) => {
        if (!cancelled) setReviews(res.data);
      })
      .catch(() => {
        if (!cancelled) setReviews(null);
      });
    return () => {
      cancelled = true;
    };
  }, [product?.id, product?.slug]);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    setReviewMsg(null);
    const nextErrors = validateReview({
      orderItemId: reviewOrderItemId,
      rating: reviewRating,
      title: reviewTitle,
      body: reviewBody,
    });
    setReviewErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      setReviewMsg("Please fix the highlighted fields.");
      return;
    }
    setReviewBusy(true);
    try {
      await storeApi.submitReview(product.slug || product.id, {
        order_item_id: Number(reviewOrderItemId),
        rating: reviewRating,
        title: reviewTitle.trim() || null,
        body: reviewBody.trim() || null,
      });
      setReviewMsg("Review submitted for moderation. Thank you.");
      setReviewTitle("");
      setReviewBody("");
      setReviewOrderItemId("");
      setReviewErrors({});
    } catch (err) {
      setReviewMsg(
        friendlyApiError(
          err,
          "Could not submit review. You need a delivered purchase item id.",
        ),
      );
    } finally {
      setReviewBusy(false);
    }
  }

  const selectedVariant = useMemo(() => {
    if (!product) return null;
    return (
      product.variants.find((v) => v.id === variantId) ??
      product.variants[0] ??
      null
    );
  }, [product, variantId]);

  if (!ready || loading) {
    return (
      <p className="px-6 py-20 text-center text-sm text-muted">Loading product…</p>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="font-display text-4xl">Product not found</h1>
        <Link href="/shop" className="mt-6 inline-block">
          <Button>Back to shop</Button>
        </Link>
      </div>
    );
  }

  const brand = getBrand(product.brand);
  const name = locale === "ar" ? product.nameAr : product.name;
  const loved = wishlist.includes(product.slug);
  const related = relatedProducts(product);
  const gallery = product.gallery.length
    ? product.gallery
    : [{ url: product.image, alt: name }];
  const price = selectedVariant?.price ?? product.priceEgp;
  const compareAt = selectedVariant?.compareAt ?? product.compareAtEgp;
  const inStock = selectedVariant?.inStock ?? product.inStock;
  const canAdd = Boolean(selectedVariant?.id) && inStock;

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>{" "}
        /{" "}
        <Link
          href={`/shop?category=${product.category}`}
          className="hover:text-ink"
        >
          {product.categoryName || product.category}
        </Link>{" "}
        / {name}
      </p>
      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl bg-paper">
            <img
              src={gallery[activeImage]?.url || product.image}
              alt={gallery[activeImage]?.alt || name}
              className="aspect-square w-full object-cover"
            />
          </div>
          {gallery.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto">
              {gallery.map((img, i) => (
                <button
                  key={`${img.url}-${i}`}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "size-16 shrink-0 overflow-hidden rounded-lg border",
                    i === activeImage ? "border-ink" : "border-border",
                  )}
                >
                  <img
                    src={img.url}
                    alt={img.alt || `${name} ${i + 1}`}
                    className="size-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          {brand && (
            <Link
              href={`/brands/${brand.slug}`}
              className="text-xs uppercase tracking-[0.18em] text-muted hover:text-ink"
            >
              {locale === "ar" ? brand.nameAr : brand.name}
            </Link>
          )}
          <h1 className="mt-2 font-display text-4xl sm:text-5xl">{name}</h1>
          <div className="mt-3 flex items-center gap-3">
            {reviews?.average_rating ? (
              <StarRating
                rating={reviews.average_rating}
                count={reviews.review_count}
              />
            ) : product.rating > 0 ? (
              <StarRating rating={product.rating} count={product.reviews} />
            ) : null}
            {!inStock ? (
              <span className="text-xs uppercase tracking-[0.14em] text-muted">
                Out of stock
              </span>
            ) : null}
          </div>
          <p className="mt-4 font-display text-2xl tabular-nums">
            {formatMoney(price, currencyCode)}
            {compareAt ? (
              <span className="ms-3 text-lg text-muted line-through">
                {formatMoney(compareAt, currencyCode)}
              </span>
            ) : null}
          </p>
          {product.shortDescription ? (
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink/80">
              {product.shortDescription}
            </p>
          ) : (
            <p className="mt-6 max-w-lg text-sm leading-relaxed text-ink/80">
              {locale === "ar" ? product.descriptionAr : product.description}
            </p>
          )}

          {product.variants.length > 1 ? (
            <div className="mt-6 max-w-xs">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
                Size / variant
              </p>
              <Select
                label="Variant"
                fullWidth
                className="mt-2"
                value={String(selectedVariant?.id ?? "")}
                onChange={(v) => setVariantId(Number(v))}
                options={product.variants.map((v) => ({
                  value: String(v.id),
                  label: `${v.title || `Variant ${v.id}`}${
                    v.inStock ? "" : " — out of stock"
                  }`,
                }))}
              />
            </div>
          ) : product.size ? (
            <p className="mt-4 text-xs text-muted">{product.size}</p>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-full border border-border">
              <button
                type="button"
                className="grid size-11 place-items-center"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                <Minus className="size-3.5" />
              </button>
              <span className="w-8 text-center tabular-nums">{qty}</span>
              <button
                type="button"
                className="grid size-11 place-items-center"
                onClick={() => setQty((q) => q + 1)}
              >
                <Plus className="size-3.5" />
              </button>
            </div>
            <Button
              disabled={!canAdd}
              onClick={() => {
                if (!selectedVariant?.id) {
                  toast.error("This product has no sellable variant yet.");
                  return;
                }
                if (!selectedVariant.inStock) {
                  toast.error("This variant is out of stock.");
                  return;
                }
                addToCart({
                  slug: product.slug,
                  variantId: selectedVariant.id,
                  productId: product.id,
                  name: selectedVariant.title
                    ? `${name} — ${selectedVariant.title}`
                    : name,
                  image: product.image,
                  unitPrice: selectedVariant.price,
                  qty,
                });
                toast.success(copy.added);
                window.dispatchEvent(new Event("kham:open-cart"));
              }}
            >
              {!selectedVariant
                ? "Unavailable"
                : !inStock
                  ? "Out of stock"
                  : copy.add}
            </Button>
            <button
              type="button"
              aria-label="Wishlist"
              onClick={() => void toggleWishlist(product.slug, product.id)}
              className={cn(
                "grid size-11 place-items-center rounded-full border border-border",
                loved && "bg-olive text-cream",
              )}
            >
              <Heart className={cn("size-4", loved && "fill-current")} strokeWidth={1.4} />
            </button>
          </div>
          <div className="mt-10 border-t border-border pt-6">
            <div className="flex gap-4 text-xs uppercase tracking-[0.16em]">
              {(
                [
                  ["story", "Story"],
                  ["use", "How to use"],
                  ["in", "Ingredients"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={cn(
                    tab === key ? "text-ink" : "text-muted hover:text-ink",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-4 text-sm leading-relaxed text-ink/80">
              {tab === "story" &&
                (locale === "ar" ? product.descriptionAr : product.description)}
              {tab === "use" && (product.howTo || "—")}
              {tab === "in" &&
                (product.linkedIngredients.length > 0 ? (
                  <ul className="space-y-3">
                    {product.linkedIngredients.map((ing) => (
                      <li key={ing.id}>
                        <Link
                          href={`/ingredients/${ing.slug}`}
                          className="font-medium text-ink underline-offset-2 hover:underline"
                        >
                          {ing.name}
                        </Link>
                        {ing.description ? (
                          <p className="mt-1 text-ink/70">{ing.description}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : product.ingredients.length ? (
                  product.ingredients.join(", ")
                ) : (
                  "—"
                ))}
            </div>
          </div>
        </div>
      </div>
      <section className="mt-16 max-w-2xl">
        <h2 className="font-display text-3xl">Reviews</h2>
        {reviews && reviews.reviews.length > 0 ? (
          <ul className="mt-6 space-y-5">
            {reviews.reviews.map((r) => (
              <li key={r.id} className="border-b border-border pb-5">
                <div className="flex items-center gap-3">
                  <StarRating rating={r.rating} />
                  <span className="text-xs text-muted">
                    {r.reviewer_name}
                    {r.verified_purchase ? " · Verified" : ""}
                  </span>
                </div>
                {r.title ? (
                  <p className="mt-2 text-sm font-medium">{r.title}</p>
                ) : null}
                {r.body ? (
                  <p className="mt-1 text-sm text-ink/80">{r.body}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">No reviews yet.</p>
        )}

        {token ? (
          <form
            onSubmit={submitReview}
            noValidate
            className="mt-10 space-y-3 border-t border-border pt-8"
          >
            <h3 className="font-display text-2xl">Write a review</h3>
            <p className="text-xs text-muted">
              Requires a delivered order item id from your purchase of this
              product.
            </p>
            <label className="block text-xs uppercase tracking-[0.16em] text-muted">
              Order item id
              <input
                type="number"
                min={1}
                value={reviewOrderItemId}
                onChange={(e) => {
                  setReviewOrderItemId(sanitizeDigits(e.target.value));
                  setReviewErrors((prev) => {
                    const next = { ...prev };
                    delete next.orderItemId;
                    return next;
                  });
                }}
                inputMode="numeric"
                aria-invalid={Boolean(reviewErrors.orderItemId)}
                className={inputClass(
                  Boolean(reviewErrors.orderItemId),
                  "mt-2 h-11 w-full rounded-full border border-border bg-paper px-4 text-sm outline-none",
                )}
              />
              <FieldError message={reviewErrors.orderItemId} />
            </label>
            <label className="block text-xs uppercase tracking-[0.16em] text-muted">
              Rating
              <Select
                label="Rating"
                fullWidth
                className="mt-2"
                value={String(reviewRating)}
                onChange={(v) => {
                  setReviewRating(Number(v));
                  setReviewErrors((prev) => {
                    const next = { ...prev };
                    delete next.rating;
                    return next;
                  });
                }}
                options={[5, 4, 3, 2, 1].map((n) => ({
                  value: String(n),
                  label: `${n} stars`,
                }))}
              />
              <FieldError message={reviewErrors.rating} />
            </label>
            <label className="block text-xs uppercase tracking-[0.16em] text-muted">
              Title
              <input
                value={reviewTitle}
                onChange={(e) => {
                  setReviewTitle(e.target.value);
                  setReviewErrors((prev) => {
                    const next = { ...prev };
                    delete next.title;
                    return next;
                  });
                }}
                maxLength={150}
                aria-invalid={Boolean(reviewErrors.title)}
                className={inputClass(
                  Boolean(reviewErrors.title),
                  "mt-2 h-11 w-full rounded-full border border-border bg-paper px-4 text-sm outline-none",
                )}
              />
              <FieldError message={reviewErrors.title} />
            </label>
            <label className="block text-xs uppercase tracking-[0.16em] text-muted">
              Review
              <textarea
                value={reviewBody}
                onChange={(e) => {
                  setReviewBody(e.target.value);
                  setReviewErrors((prev) => {
                    const next = { ...prev };
                    delete next.body;
                    return next;
                  });
                }}
                rows={4}
                maxLength={3000}
                aria-invalid={Boolean(reviewErrors.body)}
                className={inputClass(
                  Boolean(reviewErrors.body),
                  "mt-2 w-full rounded-2xl border border-border bg-paper px-4 py-3 text-sm outline-none",
                )}
              />
              <FieldError message={reviewErrors.body} />
            </label>
            {reviewMsg ? (
              <p className="rounded-xl bg-sand/70 px-4 py-3 text-sm">{reviewMsg}</p>
            ) : null}
            <Button type="submit" disabled={reviewBusy}>
              {reviewBusy ? "Submitting…" : "Submit review"}
            </Button>
          </form>
        ) : (
          <p className="mt-8 text-sm text-muted">
            <button
              type="button"
              className="underline underline-offset-4"
              onClick={() =>
                window.dispatchEvent(new Event("kham:open-signin"))
              }
            >
              Sign in
            </button>{" "}
            to review a delivered purchase.
          </p>
        )}
      </section>
      {related.length > 0 ? (
        <section className="mt-16">
          <h2 className="font-display text-3xl">You may also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
