import fs from "fs";
import path from "path";

const SRC = "c:/xampp/htdocs/Kham/kham-cairo-source/src";
const DEST = "c:/xampp/htdocs/Kham/kham-cairo-web/src";

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyFile(from, to) {
  ensureDir(path.dirname(to));
  fs.copyFileSync(from, to);
}

function walkFiles(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(p, out);
    else out.push(p);
  }
  return out;
}

function convertTsx(code, { isPage = false } = {}) {
  let c = code;

  // Strip tanstack import
  c = c.replace(/^import \{[^}]*\} from "@tanstack\/react-router";\r?\n/m, "");

  const needsLink = /\bLink\b/.test(code) && /from "@tanstack\/react-router"/.test(code);
  const needsRouter = /useNavigate/.test(code);
  const needsParams = /Route\.useParams/.test(code);
  const needsSearch = /Route\.useSearch/.test(code);
  const needsNotFound = /\bnotFound\(/.test(code);

  // Remove route definition
  c = c.replace(/^export const Route = createFileRoute\([\s\S]*?\);\r?\n*/m, "");

  // Hooks
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
  c = c.replace(/navigate\(\{ to: "([^"]+)" \}\)/g, 'router.push("$1")');
  c = c.replace(
    /void navigate\(\{ to: "\/search", search: \{ q \} \}\);/g,
    "router.push(`/search?q=${encodeURIComponent(q)}`);",
  );
  c = c.replace(/if \(!(\w+)\) throw notFound\(\);/g, "if (!$1) notFound();");
  c = c.replace(/if \(!(\w+)\) notFound\(\);/g, "if (!$1) notFound();");

  // Link conversions — do params forms FIRST
  c = c.replace(
    /to="\/product\/\$slug"\s+params=\{\{\s*slug:\s*([^}]+?)\s*\}\}/g,
    "href={`/product/${$1}`}",
  );
  c = c.replace(
    /to="\/brands\/\$slug"\s+params=\{\{\s*slug:\s*([^}]+?)\s*\}\}/g,
    "href={`/brands/${$1}`}",
  );
  c = c.replace(
    /to="\/ingredients\/\$slug"\s+params=\{\{\s*slug:\s*([^}]+?)\s*\}\}/g,
    "href={`/ingredients/${$1}`}",
  );

  // search object forms
  c = c.replace(
    /to="\/shop"\s+search=\{\{\s*category:\s*c\.id\s*\}\}/g,
    "href={`/shop?category=${c.id}`}",
  );
  c = c.replace(
    /to="\/shop"\s+search=\{\{\s*category:\s*product\.category\s*\}\}/g,
    "href={`/shop?category=${product.category}`}",
  );
  c = c.replace(
    /to="\/shop"\s+search=\{\{\s*brand\s*\}\}/g,
    'href={`/shop${brand ? `?brand=${brand}` : ""}`}',
  );
  c = c.replace(
    /to="\/shop"\s+search=\{\{\s*category:\s*c\.id,\s*brand\s*\}\}/g,
    'href={`/shop?category=${c.id}${brand ? `&brand=${brand}` : ""}`}',
  );
  c = c.replace(
    /to="\/shop"\s+search=\{\{\s*category:\s*category as CategoryId \| undefined,\s*brand:\s*b\.slug\s*\}\}/g,
    'href={`/shop?brand=${b.slug}${category ? `&category=${category}` : ""}`}',
  );

  // multiline variants
  c = c.replace(
    /to="\/shop"\r?\n\s*search=\{\{\s*brand\s*\}\}/g,
    'href={`/shop${brand ? `?brand=${brand}` : ""}`}',
  );
  c = c.replace(
    /to="\/shop"\r?\n\s*search=\{\{\s*category:\s*c\.id,\s*brand\s*\}\}/g,
    'href={`/shop?category=${c.id}${brand ? `&brand=${brand}` : ""}`}',
  );
  c = c.replace(
    /to="\/shop"\r?\n\s*search=\{\{\s*category:\s*category as CategoryId \| undefined,\s*brand:\s*b\.slug\s*\}\}/g,
    'href={`/shop?brand=${b.slug}${category ? `&category=${category}` : ""}`}',
  );

  // simple string paths last
  c = c.replace(/\bto=\{item\.to\}/g, "href={item.to}");
  c = c.replace(/\bto="(\/[^"$]*)"/g, 'href="$1"');

  // default export for pages
  if (isPage && !/export default/.test(c)) {
    c = c.replace(/^function ([A-Z][A-Za-z0-9]*)\(/m, "export default function $1(");
  }

  // Instagram icon removed in newer lucide
  c = c.replace(/\{ Instagram, Mail \}/g, "{ Mail }");
  c = c.replace(
    /<Instagram className="size-4" strokeWidth=\{1\.4\} \/>/g,
    '<span aria-hidden className="text-xs font-semibold tracking-[0.12em]">IG</span>',
  );

  // Build imports
  const imports = [];
  if (needsLink || /from "next\/link"/.test(c) === false && /<Link[\s>]/.test(c)) {
    imports.push('import Link from "next/link";');
  }
  const nav = [];
  if (needsRouter) nav.push("useRouter");
  if (needsParams) nav.push("useParams");
  if (needsSearch) nav.push("useSearchParams");
  if (needsNotFound) nav.push("notFound");
  if (nav.length) imports.push(`import { ${nav.join(", ")} } from "next/navigation";`);

  const isClient =
    isPage ||
    /useState|useEffect|useShop|useMemo|useRouter|useParams|useSearchParams|window\.|onClick/.test(
      c,
    );

  if (isClient && !c.trimStart().startsWith('"use client"')) {
    c = `"use client";\n\n${c}`;
  }

  if (imports.length) {
    if (c.startsWith('"use client"')) {
      c = c.replace(/^("use client";\r?\n\r?\n)/, `$1${imports.join("\n")}\n`);
    } else {
      c = `${imports.join("\n")}\n${c}`;
    }
    // dedupe Link
    c = c.replace(/(import Link from "next\/link";\n)(?:[\s\S]*?\1)+/g, "$1");
  }

  return c;
}

// 1) copy libs
for (const name of ["catalog.ts", "store.ts", "utils.ts", "i18n.ts"]) {
  copyFile(path.join(SRC, "lib", name), path.join(DEST, "lib", name));
}

// 2) copy components (skip preview)
const compRoot = path.join(SRC, "components");
for (const file of walkFiles(compRoot)) {
  if (file.includes("preview-host-bridge")) continue;
  const rel = path.relative(compRoot, file);
  const to = path.join(DEST, "components", rel);
  let code = fs.readFileSync(file, "utf8");
  code = convertTsx(code, { isPage: false });
  ensureDir(path.dirname(to));
  fs.writeFileSync(to, code);
  console.log("component", rel);
}

// 3) pages
const routeMap = [
  ["index.tsx", "page.tsx"],
  ["shop.tsx", "shop/page.tsx"],
  ["product.$slug.tsx", "product/[slug]/page.tsx"],
  ["brands.tsx", "brands/page.tsx"],
  ["brands.$slug.tsx", "brands/[slug]/page.tsx"],
  ["rituals.tsx", "rituals/page.tsx"],
  ["ritual.tsx", "ritual/page.tsx"],
  ["about.tsx", "about/page.tsx"],
  ["community.tsx", "community/page.tsx"],
  ["cart.tsx", "cart/page.tsx"],
  ["checkout.tsx", "checkout/page.tsx"],
  ["wishlist.tsx", "wishlist/page.tsx"],
  ["search.tsx", "search/page.tsx"],
  ["ingredients.tsx", "ingredients/page.tsx"],
  ["ingredients.$slug.tsx", "ingredients/[slug]/page.tsx"],
  ["for-brands.tsx", "for-brands/page.tsx"],
  ["edit.tsx", "edit/page.tsx"],
  ["$.tsx", "not-found.tsx"],
];

for (const [srcName, destRel] of routeMap) {
  const from = path.join(SRC, "routes", srcName);
  const to = path.join(DEST, "app", destRel);
  let code = fs.readFileSync(from, "utf8");
  code = convertTsx(code, { isPage: true });
  ensureDir(path.dirname(to));
  fs.writeFileSync(to, code);
  console.log("page", destRel);
}

console.log("done");
