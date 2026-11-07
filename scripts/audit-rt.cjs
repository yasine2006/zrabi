const fs = require("fs");
const s = fs.readFileSync("src/components/admin/RugsTab.tsx", "utf8");
const m = s.match(/"[^"]{3,}"/g) || [];
const out = [...new Set(m)].filter((x) => /[àâäéèêëïîôùûüçÀ-ÿ]/.test(x));
console.log(out.join("\n"));
