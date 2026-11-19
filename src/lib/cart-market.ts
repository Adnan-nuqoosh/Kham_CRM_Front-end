import { storeApi, mediaUrl } from "./api";
import type { CartLine } from "./store";

export type CartMarketSyncResult = {
  kept: CartLine[];
  removed: number;
  repriced: number;
};

/**
 * Hybrid market cart sync: keep lines that remain sellable in the target
 * market (preferring the same variant), update price/qty/image, drop the rest.
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

  // One product fetch per slug.
  const bySlug = new Map<string, CartLine[]>();
  for (const line of lines) {
    const list = bySlug.get(line.slug) ?? [];
    list.push(line);
    bySlug.set(line.slug, list);
  }

  await Promise.all(
    [...bySlug.entries()].map(async ([slug, slugLines]) => {
      try {
        const res = await storeApi.productBySlug(slug, marketId);
        const product = res.data;
        const variants = product.variants ?? [];
        const image =
          mediaUrl(
            product.media?.[0]?.url ||
              product.image_url ||
              slugLines[0]?.image,
          ) || slugLines[0]?.image;

        for (const line of slugLines) {
          const same = variants.find(
            (v) =>
              v.id === line.variantId &&
              v.price != null &&
              Number(v.price) > 0 &&
              v.in_stock !== false,
          );
          const fallback = variants.find(
            (v) =>
              v.price != null &&
              Number(v.price) > 0 &&
              v.in_stock !== false,
          );
          const chosen = same ?? fallback;
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
              name: product.name || kept[existing].name,
              image: image || kept[existing].image,
              productId: product.id,
              slug: product.slug || slug,
            };
          } else {
            kept.push({
              slug: product.slug || slug,
              variantId: chosen.id,
              productId: product.id,
              name: product.name || line.name,
              image: image || line.image,
              unitPrice,
              qty,
            });
          }
        }
      } catch {
        removed += slugLines.length;
      }
    }),
  );

  return { kept, removed, repriced };
}
