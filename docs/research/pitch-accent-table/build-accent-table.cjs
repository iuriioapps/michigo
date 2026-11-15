// Builds the accent table from the UniDic lexicon: one line per dictionary-form spelling, kana reading and lexeme, with its accent values.
// Line: spelling TAB kana reading TAB lexeme id TAB accent values.
// Usage: node build-accent-table.cjs <lex.csv> <out.tsv>. Lines are sorted, so the same lexicon always gives the same file.
const { createReadStream, writeFileSync } = require("node:fs");
const readline = require("node:readline"), assert = require("node:assert"), crypto = require("node:crypto");
const split = (l) => { const o = []; let c = "", q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === "," && !q) { o.push(c); c = ""; } else c += ch; } o.push(c); return o; };
assert.deepEqual(split('a,"3,0",b'), ["a", "3,0", "b"]);
const COST = 3, ORTH = 14, KANA = 25, ATYPE = 28, LEXEME = 32;
const [lex, out] = process.argv.slice(2);
(async () => {
  const t0 = Date.now(), rows = new Map();
  for await (const l of readline.createInterface({ input: createReadStream(lex) })) {
    const f = split(l); if (f.length <= LEXEME || f[ATYPE] === "*" || !f[ATYPE]) continue;
    const k = `${f[ORTH]}\t${f[KANA]}\t${f[LEXEME]}`, cost = +f[COST], e = rows.get(k);
    // one lexeme can list a pair in several conjugation rows; the cheapest row stands for the pair
    if (!e || cost < e.cost) rows.set(k, { cost, a: f[ATYPE] });
  }
  // within one spelling and reading, the lexeme with the cheapest row comes first
  const cmp = (x, y) => (x < y ? -1 : x > y ? 1 : 0), pair = (k) => k.slice(0, k.lastIndexOf("\t"));
  const text = [...rows].sort(([a, x], [b, y]) => cmp(pair(a), pair(b)) || x.cost - y.cost || cmp(a, b)).map(([k, e]) => `${k}\t${e.a}`).join("\n") + "\n";
  writeFileSync(out, text);
  console.log(`lines ${rows.size}, bytes ${text.length === Buffer.byteLength(text) ? text.length : Buffer.byteLength(text)}, sha256 ${crypto.createHash("sha256").update(text).digest("hex")}, ${Math.round((Date.now() - t0) / 1000)} s, peak RSS ${Math.round(process.resourceUsage().maxRSS / 1024)} MB`);
})();
