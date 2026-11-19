"use client";

import Link from "next/link";
import { Heart, Plus } from "lucide-react";
import { toast } from "sonner";
import type { UiProduct } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { useCatalog } from "@/lib/catalog-data";
import { t } from "@/lib/i18n";
import { useShop } from "@/lib/store";
import { cn } from "@/lib/utils";
import { StarRating } from "./star-rating";

export function ProductCard({
  product,
  className,
}: {
  product: UiProduct;
  className?: string;
}) {
  const { currencyCode } = useCatalog();
  const locale = useShop((s) => s.locale);
  const wishlist = useShop((s) => s.wishlist);
  const toggleWishlist = useShop((s) => s.toggleWishlist);
  const addToCart = useShop((s) => s.addToCart);
  const copy = t(locale);
  const loved = wishlist.includes(product.slug);
  const name = locale === "ar" ? product.nameAr : product.name;

  function handleAddToCart() {
    if (!product.variantId) {
      toast.error("This product isn’t available to add yet.");
      return;
    }
    if (!product.inStock) {
      toast.error("This product is out of stock.");
      return;
    }
    addToCart({
      slug: product.slug,
      variantId: product.variantId,
      productId: product.id,
      name,
      image: product.image,
      unitPrice: product.priceEgp,
      qty: 1,
    });
    toast.success(copy.added);
    window.dispatchEvent(new Event("kham:open-cart"));
  }

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="relative overflow-hidden rounded-lg bg-paper">
        <Link
          href={`/product/${product.slug}`}
          className="relative block aspect-square"
        >
          <img
            src={product.image}
            alt={name}
            className={cn(
              "size-full object-cover transition-all duration-500 ease-out group-hover:scale-[1.03]",
              product.hoverImage && "group-hover:opacity-0",
            )}
          />
          {product.hoverImage ? (
            <img
              src={product.hoverImage}
              alt=""
              className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          ) : null}
        </Link>
        {product.bestseller && (
          <span className="absolute start-3 top-3 rounded-full bg-olive px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-cream">
            Bestseller
          </span>
        )}
        {product.isNew && !product.bestseller && (
          <span className="absolute start-3 top-3 rounded-full bg-cream/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-olive">
            New
          </span>
        )}
        <div className="absolute end-3 top-3 flex flex-col gap-2">
          <button
            type="button"
            aria-label={loved ? "Remove from wishlist" : "Add to wishlist"}
            onClick={() => void toggleWishlist(product.slug, product.id)}
            className="grid size-9 place-items-center rounded-full bg-paper/80 text-ink backdrop-blur-sm transition-colors hover:bg-paper"
          >
            <Heart
              className={cn("size-4", loved && "fill-olive text-olive")}
              strokeWidth={1.4}
            />
          </button>
          <button
            type="button"
            aria-label="Add to bag"
            disabled={!product.variantId || !product.inStock}
            onClick={handleAddToCart}
            className="grid size-9 place-items-center rounded-full bg-paper/80 text-ink backdrop-blur-sm transition-colors hover:bg-paper disabled:opacity-40"
          >
            <Plus className="size-4" strokeWidth={1.4} />
          </button>
        </div>
        {!product.inStock ? (
          <span className="absolute bottom-3 start-3 rounded-full bg-paper/90 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-muted">
            Out of stock
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex flex-col gap-0.5">
        <p className="text-[11px] tracking-[0.08em] text-muted">
          {product.brandName}
        </p>
        <Link
          href={`/product/${product.slug}`}
          className="font-display text-lg leading-snug text-ink hover:opacity-70"
        >
          {name}
        </Link>
        <p className="text-sm tabular-nums">
          {formatMoney(product.priceEgp, currencyCode)}
          {product.compareAtEgp ? (
            <span className="ms-2 text-muted line-through">
              {formatMoney(product.compareAtEgp, currencyCode)}
            </span>
          ) : null}
        </p>
        {product.rating > 0 ? (
          <StarRating
            rating={product.rating}
            count={product.reviews}
            className="mt-1"
          />
        ) : null}
      </div>
    </article>
  );
}
