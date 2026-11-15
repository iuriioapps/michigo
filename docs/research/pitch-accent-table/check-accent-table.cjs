// Compares the accent table with the Kanjium accent file for three groups of Headwords.
// Usage: node check-accent-table.cjs <spike dir> <accent.tsv> <kanjium accents.txt> <jmdict dir>
const { readFileSync, readdirSync } = require("node:fs");
const [spike, tsv, kj, jm] = process.argv.slice(2);
const kata = (s) => s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
const nums = (s) => [...new Set((s.match(/\d+/g) ?? []).map(Number))];
const KANAONLY = /^[ぁ-ゖァ-ヺー]+$/, JP = /[ぁ-ゖァ-ヺー一-鿿々]/;
const pct = (a, n) => (n ? `${((100 * a) / n).toFixed(1)}%` : "n/a");
const table = new Map(), byLex = new Map();
for (const l of readFileSync(tsv, "utf8").split("\n")) { if (!l) continue; const [o, k, id, a] = l.split("\t"); const key = `${o}\t${k}`; table.set(key, [...new Set([...(table.get(key) ?? []), ...nums(a)])]); byLex.set(`${key}\t${id}`, nums(a)); }
const ref = new Map();
for (const l of readFileSync(kj, "utf8").split("\n")) { const [term, reading, acc] = l.split("\t"); if (term && acc) ref.set(`${term}\t${kata(reading || term)}`, nums(acc)); }
const heads = new Map();
for (const f of readdirSync(jm).filter((f) => f.startsWith("term_bank"))) for (const [term, reading, , , score] of JSON.parse(readFileSync(`${jm}/${f}`, "utf8"))) { const r = kata(reading || (KANAONLY.test(term) ? term : "")); if (r) heads.set(`${term}\t${r}`, Math.max(heads.get(`${term}\t${r}`) ?? -1e12, score)); }
const { TokenizerBuilder } = require(`${spike}/node_modules/lindera`);
const b = new TokenizerBuilder(); b.setDictionary(`${spike}/dicts/lindera-unidic202512`); b.setMode("normal"); const t = b.build();
const own = new Map(); // corpus pair -> values of the word's own lexeme first, then the rest of the pair
for (const f of readdirSync(`${spike}/texts`)) for (const line of readFileSync(`${spike}/texts/${f}`, "utf8").split("\n")) for (const phrase of line.split(/[\s　]+/)) for (const x of phrase ? t.tokenize(phrase) : []) {
  if (x.isUnknown || !JP.test(x.surface) || x.details.length <= 28) continue; const d = x.details, k = `${d[10]}\t${d[21]}`; if (own.has(k)) continue;
  own.set(k, { lex: byLex.get(`${k}\t${d[28]}`) ?? [], tok: nums(d[24] === "*" ? "" : d[24]) }); }
const byTerm = new Map(); for (const k of heads.keys()) { const [term, r] = k.split("\t"); (byTerm.get(term) ?? byTerm.set(term, []).get(term)).push(r); }
const others = new Set(); for (const k of own.keys()) { const [o, r] = k.split("\t"); if (KANAONLY.test(o)) continue; const rs = byTerm.get(o) ?? []; if (rs.includes(r)) for (const x of rs) if (x !== r) others.add(`${o}\t${x}`); }
console.log(`Table pairs ${table.size}. Kanjium keys ${ref.size}.\n\n| Group | Headwords | With a table value | Also in Kanjium | Share a value | First value equal |\n| --- | --- | --- | --- | --- | --- |`);
const row = (name, keys, val) => { let n = 0, v = 0, both = 0, share = 0, first = 0; const bad = [];
  for (const k of keys) { n++; const a = val(k); if (!a?.length) continue; v++; const r = ref.get(k); if (!r) continue; both++; if (a.some((x) => r.includes(x))) share++; else bad.push(`${k.replace("\t", "/")} ${a} vs ${r}`); if (a[0] === r[0]) first++; }
  console.log(`| ${name} | ${n} | ${v} (${pct(v, n)}) | ${both} | ${pct(share, both)} | ${pct(first, both)} |`); return bad; };
row("Corpus pairs, value of the token", own.keys(), (k) => own.get(k).tok);
row("Corpus pairs, own lexeme first, from the table", own.keys(), (k) => [...new Set([...own.get(k).lex, ...(table.get(k) ?? [])])]);
row("Corpus pairs, table by pair alone", own.keys(), (k) => table.get(k));
const bad = row("Other readings of corpus Spellings", others, (k) => table.get(k));
row("JMdict Headwords with a score above zero", [...heads].filter(([, s]) => s > 0).map(([k]) => k), (k) => table.get(k));
row("All JMdict Headwords", heads.keys(), (k) => table.get(k));
console.log(`\nOther readings with no shared value: ${bad.slice(0, 25).join("; ")}`);
let diff = 0, cnt = 0; for (const [k, e] of own) { if (!e.tok.length) continue; cnt++; if (e.tok.join() !== e.lex.join()) diff++; }
console.log(`\nCorpus pairs where the table row of the word's lexeme differs from the token's value: ${diff} of ${cnt}.`);
