const fs = require("fs");
const s = fs.readFileSync("src/components/admin/CustomOrdersTab.tsx", "utf8");
const m = s.match(/"[^"]{3,}"/g) || [];
console.log([...new Set(m)].join("\n"));
