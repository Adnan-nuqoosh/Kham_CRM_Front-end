import fs from "fs";
import path from "path";

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(ent.name)) out.push(p);
  }
  return out;
}

const files = walk("c:/xampp/htdocs/Kham/kham-cairo-web/src");
let fixed = 0;

for (const f of files) {
  let c = fs.readFileSync(f, "utf8");
  const orig = c;

  // Broken: href={`/brands/${b.slug }  (missing closing ` before })
  c = c.replace(
    /href=\{`(\/(?:brands|product|ingredients)\/\$\{[^}]+)\s*\}/g,
    "href={`$1`}",
  );

  // Broken shop templates that lost closing backtick in nested cases — normalize common ones
  c = c.replace(
    /href=\{`\/shop\$\{brand \? `\?brand=\$\{brand\}` : ""\}`\}/g,
    'href={`/shop${brand ? `?brand=${brand}` : ""}`}',
  );

  // Instagram removed from newer lucide
  c = c.replace(/\{ Instagram, Mail \}/g, "{ Mail }");
  c = c.replace(
    /<Instagram className="size-4" strokeWidth=\{1\.4\} \/>/g,
    '<span aria-hidden className="text-xs font-semibold tracking-[0.12em]">IG</span>',
  );

  if (c !== orig) {
    fs.writeFileSync(f, c);
    fixed++;
    console.log("fixed", path.relative("c:/xampp/htdocs/Kham/kham-cairo-web", f));
  }
}

console.log("total", fixed);
