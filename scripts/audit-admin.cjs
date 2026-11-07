const fs = require("fs");
const path = require("path");
function walk(d, o = []) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f, o); else if (e.name.endsWith(".tsx")) o.push(f); } return o; }
const files = walk("src/components/admin");
const i18n = fs.readFileSync("src/lib/i18n.ts", "utf8");
const block = i18n.slice(i18n.indexOf("const ARABIC_FALLBACK"), i18n.indexOf("};", i18n.indexOf("const ARABIC_FALLBACK")) + 2);
const keys = new Set();
for (const m of block.matchAll(/"((?:[^"\\]|\\.)*)"\s*:/g)) keys.add(m[1].replace(/\\"/g, '"'));
const missing = new Set();
const re = /\bt\(\s*"((?:[^"\\]|\\.)*)"\s*,/g;
for (const f of files) {
  const s = fs.readFileSync(f, "utf8");
  for (const m of s.matchAll(re)) {
    const fr = m[1].replace(/\\"/g, '"');
    if (!keys.has(fr)) missing.add(fr);
  }
}
console.log("missing:", missing.size);
for (const x of missing) console.log(JSON.stringify(x));
