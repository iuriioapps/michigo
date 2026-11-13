const { buildDictionary, Metadata } = require("../node_modules/lindera");
const [src, out] = process.argv.slice(2);
const t0 = Date.now();
buildDictionary(src, out, Metadata.fromJsonFile(__dirname + "/metadata-2023.json"));
console.log("built", out, Math.round((Date.now() - t0) / 1000), "s", "peak RSS MB", Math.round(process.resourceUsage().maxRSS / 1024));
