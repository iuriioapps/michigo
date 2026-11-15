// Measures how list rows (spelling, reading) find a UniDic lexeme. Usage: node match.cjs <spike dir> jlpt|jiten <data dir>
const { readFileSync } = require("node:fs");
const [spike, mode, data] = process.argv.slice(2);
const { TokenizerBuilder } = require(`${spike}/node_modules/lindera`);
const b = new TokenizerBuilder(); b.setDictionary(`${spike}/dicts/lindera-unidic202512`); b.setMode("normal");
const t = b.build();
const kata = (s) => s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
const one = (s) => { const x = t.tokenize(s); return x.length === 1 && !x[0].isUnknown ? x[0].details : null; };
const ID = 28, LEMMA = 7, KANA = 21;
// rule: 1 spelling gives one token with the row reading; 2 reading gives one token whose lexeme is written as the spelling; 3 kana-only row gives one token
function match(spelling, reading) {
  const r = kata(reading);
  if (spelling && spelling !== reading) {
    const k = one(spelling);
    if (k && k[KANA] === r) return ["1 spelling+reading", k[ID]];
    const h = one(reading);
    if (h && (h[LEMMA].split("-")[0] === spelling || (k && k[ID] === h[ID]))) return ["2 reading, lexeme agrees", h[ID]];
    if (k) return ["x one token, reading differs", null, k];
    return [t.tokenize(spelling).some((x) => x.isUnknown) ? "x unknown to UniDic" : "x several tokens", null];
  }
  const h = one(reading);
  if (h) return ["3 kana only", h[ID]];
  return [t.tokenize(reading).some((x) => x.isUnknown) ? "x unknown to UniDic" : "x several tokens", null];
}
let rows = [];
if (mode === "jlpt") for (const n of [5, 4, 3, 2, 1]) for (const l of readFileSync(`${data}/n${n}.csv`, "utf8").split("\n").slice(1).filter(Boolean)) { const [, kana, kanji] = l.split(","); rows.push({ g: `N${n}`, spelling: kanji, reading: kana }); }
else { const ls = readFileSync(`${data}/jiten.csv`, "utf8").split("\n").slice(1).filter(Boolean); for (const l of ls) { const [w, f, rank] = l.split(","); const r = +rank; rows.push({ g: r <= 5000 ? "rank 1-5,000" : r <= 20000 ? "rank 5,001-20,000" : r <= 50000 ? "rank 20,001-50,000" : "rank above 50,000", spelling: /^[ぁ-ゖァ-ヺー]+$/.test(w) ? "" : w, reading: /^[ぁ-ゖァ-ヺー・]+$/.test(f) ? f.replace(/・/g, "") : w, word: w }); } }
const by = {}, lex = new Map(), samples = {};
for (const row of rows) {
  const [kind, id, k] = match(row.spelling, row.reading);
  ((by[row.g] ??= {})[kind] ??= 0); by[row.g][kind]++;
  if (id) (lex.get(id) ?? lex.set(id, []).get(id)).push(row);
  else if ((samples[kind] ??= []).length < 25) samples[kind].push(`${row.spelling || row.reading}(${row.reading})${k ? "→" + k[KANA] : ""}`);
}
const kinds = [...new Set(Object.values(by).flatMap(Object.keys))].sort();
console.log(`| Group | Rows | ${kinds.join(" | ")} | Matched |\n|${" --- |".repeat(kinds.length + 3)}`);
const tot = {};
for (const [g, c] of Object.entries(by)) { const n = Object.values(c).reduce((a, x) => a + x, 0); const m = kinds.filter((k) => !k.startsWith("x")).reduce((a, k) => a + (c[k] ?? 0), 0); console.log(`| ${g} | ${n} | ${kinds.map((k) => c[k] ?? 0).join(" | ")} | ${((100 * m) / n).toFixed(1)}% |`); for (const k of kinds) tot[k] = (tot[k] ?? 0) + (c[k] ?? 0); }
const N = rows.length, M = kinds.filter((k) => !k.startsWith("x")).reduce((a, k) => a + tot[k], 0);
console.log(`| All | ${N} | ${kinds.map((k) => tot[k]).join(" | ")} | ${((100 * M) / N).toFixed(1)}% |`);
const multi = [...lex.values()].filter((v) => v.length > 1);
console.log(`\nLexemes reached: ${lex.size}. Reached by more than one row: ${multi.length}.`);
if (mode === "jlpt") { const diff = multi.filter((v) => new Set(v.map((r) => r.g)).size > 1); console.log(`Reached by rows of different levels: ${diff.length}. Examples: ${diff.slice(0, 15).map((v) => v.map((r) => `${r.spelling || r.reading}/${r.reading} ${r.g}`).join(" + ")).join("; ")}`); }
for (const [k, v] of Object.entries(samples)) console.log(`\n${k}: ${v.join(", ")}`);
