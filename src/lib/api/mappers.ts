import { mediaUrl } from "./client";
import type {
  StorefrontBrand,
  StorefrontIngredient,
  StorefrontProduct,
  StorefrontRitual,
} from "./types";

export type UiProductVariant = {
  id: number;
  title: string;
  price: number;
  compareAt?: number;
  inStock: boolean;
};

export type UiProductMedia = {
  url: string;
  alt: string;
};

export type UiLinkedIngredient = {
  id: number;
  slug: string;
  name: string;
  description: string;
};

/** UI product shape used across the storefront. */
export type UiProduct = {
  id: number;
  slug: string;
  name: string;
  nameAr: string;
  brand: string;
  brandName: string;
  category: string;
  categoryName: string;
  priceEgp: number;
  compareAtEgp?: number;
  rating: number;
  reviews: number;
  image: string;
  hoverImage?: string;
  gallery: UiProductMedia[];
  bestseller?: boolean;
  isNew?: boolean;
  size: string;
  shortDescription: string;
  description: string;
  descriptionAr: string;
  howTo: string;
  ingredients: string[];
  ingredientSlugs: string[];
  linkedIngredients: UiLinkedIngredient[];
  ritual: string[];
  inStock: boolean;
  variantId: number | null;
  variantSku: string | null;
  variants: UiProductVariant[];
};

export type UiBrand = {
  id: number;
  slug: string;
  name: string;
  nameAr: string;
  origin: string;
  originAr: string;
  tagline: string;
  taglineAr: string;
  story: string;
  founded: string;
  logo?: string | null;
};

export type UiCategory = {
  id: string;
  label: string;
  labelAr: string;
  image: string;
  slug: string;
};

export type UiIngredient = {
  slug: string;
  name: string;
  nameAr: string;
  origin: string;
  blurb: string;
  blurbAr: string;
  image: string;
};

export type UiRitual = {
  slug: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  image: string;
};

function num(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function mapProduct(p: StorefrontProduct): UiProduct {
  const variant = p.variants?.[0] ?? null;
  const badges = p.badges ?? [];
  const linked = p.linked_ingredients ?? [];
  const ingredientText = String(p.ingredients ?? "").trim();
  const ingredients = ingredientText
    ? ingredientText
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : linked.map((i) => i.name);

  const media = Array.isArray(p.media) ? p.media : [];
  const gallery: UiProductMedia[] = media
    .map((m) => ({
      url: mediaUrl(m.url),
      alt: String(m.alt_text ?? p.name ?? ""),
    }))
    .filter((m) => Boolean(m.url));
  const primaryImage =
    gallery[0]?.url ||
    mediaUrl(media[0]?.url || p.image_url || "/images/products/serum.jpg");
  const hoverImage = gallery[1]?.url || undefined;
  const meta =
    p && typeof p === "object" && "metadata" in p
      ? ((p as { metadata?: Record<string, unknown> }).metadata ?? null)
      : null;
  const ritualTags = Array.isArray(meta?.ritual)
    ? (meta.ritual as unknown[]).map(String)
    : [];
  const variants: UiProductVariant[] = (p.variants ?? []).map((v) => ({
    id: v.id,
    title: String(v.title ?? v.sku ?? ""),
    price: num(v.price),
    compareAt:
      v.compare_at_price != null ? num(v.compare_at_price) : undefined,
    inStock: Boolean(
      v.in_stock ?? (v.available_qty != null && Number(v.available_qty) > 0),
    ),
  }));

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    nameAr: p.name_ar || p.name,
    brand: p.brand_slug ?? "",
    brandName: p.brand_name ?? "",
    category: p.category_slug ?? "",
    categoryName: p.category_name ?? "",
    priceEgp: num(variant?.price),
    compareAtEgp: variant?.compare_at_price != null
      ? num(variant.compare_at_price)
      : undefined,
    rating: num(p.average_rating ?? meta?.rating, 0),
    reviews: num(p.review_count ?? meta?.reviews, 0),
    image: primaryImage,
    hoverImage,
    gallery:
      gallery.length > 0
        ? gallery
        : [{ url: primaryImage, alt: p.name }],
    bestseller: badges.includes("BESTSELLER") || Boolean(meta?.bestseller),
    isNew: badges.includes("NEW") || Boolean(meta?.is_new),
    size: String(variant?.title || meta?.size || ""),
    shortDescription: p.short_description || "",
    description: p.description || p.short_description || "",
    descriptionAr: p.description_ar || p.description || p.short_description || "",
    howTo: p.usage_instructions || "",
    ingredients,
    ingredientSlugs: linked.map((i) => i.slug),
    linkedIngredients: linked.map((i) => ({
      id: i.id,
      slug: i.slug,
      name: i.name,
      description: i.description || "",
    })),
    ritual: ritualTags,
    inStock: Boolean(variant?.in_stock ?? variant),
    variantId: variant?.id ?? null,
    variantSku: variant?.sku ?? variant?.title ?? null,
    variants,
  };
}

export function mapBrand(b: StorefrontBrand): UiBrand {
  return {
    id: b.id,
    slug: b.slug,
    name: b.name,
    nameAr: b.name,
    origin: b.origin_country || "",
    originAr: b.origin_country || "",
    tagline: "",
    taglineAr: "",
    story: b.description || "",
    founded: "",
    logo: b.logo_url ? mediaUrl(b.logo_url) : null,
  };
}

export function mapIngredient(i: StorefrontIngredient): UiIngredient {
  return {
    slug: i.slug,
    name: i.name,
    nameAr: i.name,
    origin: "",
    blurb: i.description || "",
    blurbAr: i.description || "",
    image: "/images/ingredient-argan.jpg",
  };
}

export function mapRitual(r: StorefrontRitual): UiRitual {
  return {
    slug: r.slug,
    name: r.title,
    nameAr: r.title,
    description: r.description || "",
    descriptionAr: r.description || "",
    image: mediaUrl(r.image_url) || "/images/ritual-woman.jpg",
  };
}

export function mapCategory(c: {
  slug: string;
  name: string;
  name_ar?: string | null;
  image_url?: string | null;
}): UiCategory {
  return {
    id: c.slug,
    slug: c.slug,
    label: c.name,
    labelAr: c.name_ar || c.name,
    image: mediaUrl(c.image_url) || "/images/products/night-cream.jpg",
  };
}
