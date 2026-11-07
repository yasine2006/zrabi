const fs = require("fs");
const path = require("path");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) out.push(full);
  }
  return out;
}

const files = walk("src/components").filter((f) => !f.includes("admin"));
const i18n = fs.readFileSync("src/lib/i18n.ts", "utf8");
const mapBlock = i18n.slice(i18n.indexOf("const ARABIC_FALLBACK"), i18n.indexOf("};", i18n.indexOf("const ARABIC_FALLBACK")));
const keys = new Set();
for (const m of mapBlock.matchAll(/"((?:[^"\\]|\\.)*)"\s*:/g)) keys.add(m[1].replace(/\\"/g, '"'));

const missing = new Map();
const re = /\bt\(\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*\)/g;
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  for (const m of src.matchAll(re)) {
    const fr = m[1].replace(/\\"/g, '"');
    if (!keys.has(fr)) {
      if (!missing.has(fr)) missing.set(fr, []);
      missing.get(fr).push(path.relative(".", file));
    }
  }
}

console.log("Missing AR fallback entries:", missing.size);
for (const [fr, where] of missing) console.log("  " + JSON.stringify(fr) + "  <- " + [...new Set(where)].join(", "));
