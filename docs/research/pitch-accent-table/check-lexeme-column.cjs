// Does the table need its lexeme column? Compares, per token, the token's own accent value with the table looked up by spelling and reading alone.
// Usage: node check-lexeme-column.cjs <spike dir> <accent.tsv>
const { readFileSync, readdirSync } = require("node:fs");
const [spike, tsv] = process.argv.slice(2);
const nums = (s) => [...new Set((s.match(/\d+/g) ?? []).map(Number))];
const JP = /[ぁ-ゖァ-ヺー一-鿿々]/, pct = (a, n) => `${((100 * a) / n).toFixed(1)}%`;
const table = new Map();
for (const l of readFileSync(tsv, "utf8").split("\n")) { if (!l) continue; const [o, k, , a] = l.split("\t"); const key = `${o}\t${k}`; table.set(key, [...new Set([...(table.get(key) ?? []), ...nums(a)])]); }
const { TokenizerBuilder } = require(`${spike}/node_modules/lindera`);
const b = new TokenizerBuilder(); b.setDictionary(`${spike}/dicts/lindera-unidic202512`); b.setMode("normal"); const t = b.build();
let n = 0, first = 0, sameSet = 0, inSet = 0; const bad = new Map();
for (const f of readdirSync(`${spike}/texts`)) for (const line of readFileSync(`${spike}/texts/${f}`, "utf8").split("\n")) for (const phrase of line.split(/[\s　]+/)) for (const x of phrase ? t.tokenize(phrase) : []) {
  if (x.isUnknown || !JP.test(x.surface) || x.details.length <= 28 || x.details[24] === "*") continue; const d = x.details, k = `${d[10]}\t${d[21]}`, own = nums(d[24]), tab = table.get(k) ?? []; n++;
  if (own[0] === tab[0]) first++; else { const e = `${k.replace("\t", "/")} own ${own} table ${tab}`; bad.set(e, (bad.get(e) ?? 0) + 1); }
  if (own.every((v) => tab.includes(v))) inSet++; if (own.join() === tab.join()) sameSet++; }
console.log(`Tokens with a value: ${n}. Main value equal with the table by pair alone: ${first} (${pct(first, n)}). All values of the token in the table: ${pct(inSet, n)}. Same list: ${pct(sameSet, n)}.`);
console.log(`Distinct pairs with another main value: ${bad.size}. Top: ${[...bad].sort((a, c) => c[1] - a[1]).slice(0, 30).map(([e, c]) => `${e} ×${c}`).join("; ")}`);
