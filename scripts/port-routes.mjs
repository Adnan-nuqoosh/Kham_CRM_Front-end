import fs from "fs";
import path from "path";

const srcRoot = "c:/xampp/htdocs/Kham/kham-cairo-source/src/routes";
const destRoot = "c:/xampp/htdocs/Kham/kham-cairo-web/src/app";

const map = [
  ["about.tsx", "about/page.tsx"],
  ["cart.tsx", "cart/page.tsx"],
  ["checkout.tsx", "checkout/page.tsx"],
  ["community.tsx", "community/page.tsx"],
  ["edit.tsx", "edit/page.tsx"],
  ["for-brands.tsx", "for-brands/page.tsx"],
  ["ingredients.tsx", "ingredients/page.tsx"],
  ["ingredients.$slug.tsx", "ingredients/[slug]/page.tsx"],
  ["ritual.tsx", "ritual/page.tsx"],
  ["rituals.tsx", "rituals/page.tsx"],
  ["search.tsx", "search/page.tsx"],
  ["wishlist.tsx", "wishlist/page.tsx"],
  ["$.tsx", "not-found.tsx"],
  ["shop.tsx", "shop/page.tsx"],
  ["brands.tsx", "brands/page.tsx"],
  ["brands.$slug.tsx", "brands/[slug]/page.tsx"],
  ["product.$slug.tsx", "product/[slug]/page.tsx"],
  ["index.tsx", "page.tsx"],
];

function convert(code) {
  let c = code;
  const original = code;

  c = c.replace(/^import \{[^}]*\} from "@tanstack\/react-router";\r?\n/m, "");

  if (!c.startsWith('"use client"')) {
    c = `"use client";\n\n${c}`;
  }

  const needsLink = /<Link[\s>]/.test(original) || /Link /.test(original);
  const needsRouter = /useNavigate|navigate\(/.test(original);
  const needsParams = /Route\.useParams/.test(original);
  const needsSearch = /Route\.useSearch/.test(original);
  const needsNotFound = /\bnotFound\(/.test(original);

  const navBits = [];
  if (needsRouter) navBits.push("useRouter");
  if (needsParams) navBits.push("useParams");
  if (needsSearch) navBits.push("useSearchParams");
  if (needsNotFound) navBits.push("notFound");

  const imports = [];
  if (needsLink) imports.push('import Link from "next/link";');
  if (navBits.length) {
    imports.push(
      `import { ${[...new Set(navBits)].join(", ")} } from "next/navigation";`,
    );
  }

  c = c.replace(/^export const Route = createFileRoute\([\s\S]*?\);\r?\n?/m, "");

  c = c.replace(
    /const \{ slug \} = Route\.useParams\(\);/g,
    'const params = useParams();\n  const slug = String(params.slug ?? "");',
  );
  c = c.replace(
    /const \{ q = "" \} = Route\.useSearch\(\);/g,
    'const searchParams = useSearchParams();\n  const q = searchParams.get("q") ?? "";',
  );
  c = c.replace(
    /const \{ category, brand, sort: sortQ \} = Route\.useSearch\(\);/g,
    `const searchParams = useSearchParams();
  const category = searchParams.get("category") ?? undefined;
  const brand = searchParams.get("brand") ?? undefined;
  const sortQ = searchParams.get("sort") ?? undefined;`,
  );

  c = c.replace(/const navigate = useNavigate\(\);/g, "const router = useRouter();");
  c = c.replace(
    /navigate\(\{ to: "([^"]+)" \}\)/g,
    'router.push("$1")',
  );
  c = c.replace(
    /void navigate\(\{ to: "\/search", search: \{ q \} \}\);/g,
    "router.push(`/search?q=${encodeURIComponent(q)}`);",
  );

  c = c.replace(/to="(\/[^"$]+)"/g, 'href="$1"');
  c = c.replace(
    /to="\/product\/\$slug"\s+params=\{\{\s*slug:\s*([^}]+)\}\}/g,
    "href={`/product/${$1}}",
  );
  c = c.replace(
    /to="\/brands\/\$slug"\s+params=\{\{\s*slug:\s*([^}]+)\}\}/g,
    "href={`/brands/${$1}}",
  );
  c = c.replace(
    /to="\/ingredients\/\$slug"\s+params=\{\{\s*slug:\s*([^}]+)\}\}/g,
    "href={`/ingredients/${$1}}",
  );

  c = c.replace(
    /to="\/shop"\s+search=\{\{\s*category:\s*([^,}]+)\s*\}\}/g,
    "href={`/shop?category=${$1}}",
  );
  c = c.replace(
    /to="\/shop"\s+search=\{\{\s*category:\s*([^,}]+),\s*brand\s*\}\}/g,
    'href={`/shop?category=${$1}${brand ? `&brand=${brand}` : ""}`}',
  );
  c = c.replace(
    /to="\/shop"\s+search=\{\{\s*brand\s*\}\}/g,
    'href={`/shop${brand ? `?brand=${brand}` : ""}`}',
  );
  c = c.replace(
    /to="\/shop"\s+search=\{\{\s*category:\s*category as CategoryId \| undefined,\s*brand:\s*b\.slug\s*\}\}/g,
    'href={`/shop?brand=${b.slug}${category ? `&category=${category}` : ""}`}',
  );

  // multiline Link search patterns common in shop
  c = c.replace(
    /to="\/shop"\r?\n(\s*)search=\{\{\s*brand\s*\}\}/g,
    'href={`/shop${brand ? `?brand=${brand}` : ""}`}',
  );
  c = c.replace(
    /to="\/shop"\r?\n(\s*)search=\{\{\s*category:\s*c\.id,\s*brand\s*\}\}/g,
    'href={`/shop?category=${c.id}${brand ? `&brand=${brand}` : ""}`}',
  );
  c = c.replace(
    /to="\/shop"\r?\n(\s*)search=\{\{\s*category:\s*category as CategoryId \| undefined,\s*brand:\s*b\.slug\s*\}\}/g,
    'href={`/shop?brand=${b.slug}${category ? `&category=${category}` : ""}`}',
  );

  if (!/export default/.test(c)) {
    c = c.replace(/^function ([A-Z][A-Za-z0-9]*)\(/m, "export default function $1(");
  }

  if (imports.length) {
    c = c.replace(
      /^("use client";\r?\n\r?\n)/,
      `$1${imports.join("\n")}\n`,
    );
    c = c.replace(
      /(import Link from "next\/link";\n)([\s\S]*?)\1/g,
      "$1$2",
    );
  }

  return c;
}

for (const [src, dest] of map) {
  const from = path.join(srcRoot, src);
  const to = path.join(destRoot, dest);
  if (!fs.existsSync(from)) {
    console.log("skip missing", src);
    continue;
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  const out = convert(fs.readFileSync(from, "utf8"));
  fs.writeFileSync(to, out);
  console.log("wrote", dest);
}
