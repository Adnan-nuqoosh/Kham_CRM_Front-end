import { ApiClientError, getStoreLocale, storeApi, mediaUrl } from "./api";
import type { CartLine } from "./store";
import type { StorefrontProduct, StorefrontVariant } from "./api/types";
import type { Locale } from "./money";

function localizedProductName(
  product: StorefrontProduct,
  locale: Locale,
): string {
  if (locale === "ar") {
    return (product.name_ar || product.name || "").trim();
  }
  return (product.name || "").trim();
}

export type CartMarketSyncResult = {
  kept: CartLine[];
  removed: number;
  repriced: number;
};

function isSellable(v: StorefrontVariant): boolean {
  if (v.price == null || Number(v.price) <= 0) return false;
  if (v.in_stock === false) return false;
  if (v.available_qty != null && Number(v.available_qty) <= 0) return false;
  return true;
}

function pickVariant(
  variants: StorefrontVariant[],
  preferredId: number,
): StorefrontVariant | undefined {
  const same = variants.find((v) => v.id === preferredId && isSellable(v));
  if (same) return same;
  return variants.find(isSellable);
}

/**
 * Reprice the active bag for a target market. Keep lines that remain sellable
 * (preferring the same variant), update price/qty/image, drop only true
 * unavailability. Transient fetch failures keep the original lines.
 */
export async function syncCartForMarket(
  lines: CartLine[],
  marketId: number,
): Promise<CartMarketSyncResult> {
  if (!lines.length) {
    return { kept: [], removed: 0, repriced: 0 };
  }

  const kept: CartLine[] = [];
  let removed = 0;
  let repriced = 0;

  const bySlug = new Map<string, CartLine[]>();
  for (const line of lines) {
    const list = bySlug.get(line.slug) ?? [];
    list.push(line);
    bySlug.set(line.slug, list);
  }

  // Sequential per slug — avoids races on `kept` and is easier to reason about.
  for (const [slug, slugLines] of bySlug.entries()) {
    let product;
    try {
      const res = await storeApi.productBySlug(slug, marketId);
      product = res.data;
    } catch (err) {
      const status = err instanceof ApiClientError ? err.status : 0;
      // Hard miss (404) → remove. Network/5xx → keep original lines so a
      // flaky request does not empty the bag on market change.
      if (status === 404) {
        removed += slugLines.length;
      } else {
        for (const line of slugLines) kept.push({ ...line });
      }
      continue;
    }

    const variants = product.variants ?? [];
    const image =
      mediaUrl(
        product.media?.[0]?.url || product.image_url || slugLines[0]?.image,
      ) || slugLines[0]?.image;

    for (const line of slugLines) {
      const chosen = pickVariant(variants, line.variantId);
      if (!chosen || chosen.price == null) {
        removed += 1;
        continue;
      }

      const unitPrice = Number(chosen.price);
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        removed += 1;
        continue;
      }

      const available =
        chosen.available_qty != null
          ? Math.max(0, Number(chosen.available_qty))
          : null;
      if (available === 0) {
        removed += 1;
        continue;
      }

      const qty =
        available != null ? Math.min(line.qty, available) : line.qty;
      if (qty <= 0) {
        removed += 1;
        continue;
      }

      if (
        chosen.id !== line.variantId ||
        unitPrice !== line.unitPrice ||
        qty !== line.qty
      ) {
        repriced += 1;
      }

      const existing = kept.findIndex((k) => k.variantId === chosen.id);
      if (existing >= 0) {
        kept[existing] = {
          ...kept[existing],
          qty: kept[existing].qty + qty,
          unitPrice,
          name:
            localizedProductName(product, getStoreLocale()) ||
            product.name ||
            kept[existing].name,
          image: image || kept[existing].image,
          productId: product.id,
          slug: product.slug || slug,
        };
      } else {
        kept.push({
          slug: product.slug || slug,
          variantId: chosen.id,
          productId: product.id,
          name:
            localizedProductName(product, getStoreLocale()) ||
            product.name ||
            line.name,
          image: image || line.image,
          unitPrice,
          qty,
        });
      }
    }
  }

  return { kept, removed, repriced };
}

/**
 * Refresh cart line display names for the active locale without changing qty/price.
 */
export async function refreshCartForLocale(
  lines: CartLine[],
  marketId: number,
  locale: Locale,
): Promise<CartLine[]> {
  if (!lines.length) return [];

  const bySlug = new Map<string, CartLine[]>();
  for (const line of lines) {
    const list = bySlug.get(line.slug) ?? [];
    list.push(line);
    bySlug.set(line.slug, list);
  }

  const next: CartLine[] = [];

  for (const [slug, slugLines] of bySlug.entries()) {
    try {
      const res = await storeApi.productBySlug(slug, marketId);
      const product = res.data;
      const name =
        localizedProductName(product, locale) ||
        product.name ||
        slugLines[0]?.name;
      for (const line of slugLines) {
        next.push({
          ...line,
          name: name || line.name,
          productId: product.id || line.productId,
          slug: product.slug || slug,
        });
      }
    } catch {
      for (const line of slugLines) next.push({ ...line });
    }
  }

  // Preserve original cart order.
  const byVariant = new Map(next.map((l) => [l.variantId, l]));
  return lines.map((l) => byVariant.get(l.variantId) ?? l);
}
