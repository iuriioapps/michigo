// Lookup direction only: a word finds its list row through its Spellings, readings and lexeme form. No tokenizer on the list.
const { readFileSync, readdirSync } = require("node:fs");
const [spike, data] = process.argv.slice(2);
const { TokenizerBuilder } = require(`${spike}/node_modules/lindera`);
const b = new TokenizerBuilder(); b.setDictionary(`${spike}/dicts/lindera-unidic202512`); b.setMode("normal");
const t = b.build();
const kata = (s) => s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
const KANAONLY = /^[ぁ-ゖァ-ヺー]+$/, JP = /[ぁ-ゖァ-ヺー一-鿿々]/;
const ID = 28, LEMMA = 7, LREAD = 6, KANA = 21, ORTH = 10;
const lists = { JLPT: [], Jiten: [] };
for (const n of [5, 4, 3, 2, 1]) for (const l of readFileSync(`${data}/n${n}.csv`, "utf8").split("\n").slice(1).filter(Boolean)) { const [, kana, kanji] = l.split(","); lists.JLPT.push([kanji === kana ? "" : kanji, kana]); }
for (const l of readFileSync(`${data}/jiten.csv`, "utf8").split("\n").slice(1).filter(Boolean)) { const p = l.split(","); if (p.length !== 3) continue; const [w, f] = p; const r = f.replace(/・/g, ""); lists.Jiten.push(KANAONLY.test(w) ? ["", w] : [w, KANAONLY.test(r) ? r : ""]); }
const words = new Map(); let occ = 0, soloUnknown = new Map(); const known = new Set();
for (const f of readdirSync(`${spike}/texts`)) for (const line of readFileSync(`${spike}/texts/${f}`, "utf8").split("\n")) for (const phrase of line.split(/[\s　]+/)) { const toks = t.tokenize(phrase); for (const x of toks) {
  if (!JP.test(x.surface)) continue;
  if (x.isUnknown) { if (toks.filter((y) => JP.test(y.surface)).length === 1) soloUnknown.set(x.surface, (soloUnknown.get(x.surface) ?? 0) + 1); continue; }
  known.add(x.surface);
  const d = x.details, w = words.get(d[ID]) ?? words.set(d[ID], { n: 0, sp: new Set(), lex: d[LEMMA].split("-")[0], lread: d[LREAD] }).get(d[ID]);
  w.n++; occ++; w.sp.add(`${d[ORTH]}\t${d[KANA]}`);
} }
console.log(`Corpus: ${occ} occurrences, ${words.size} distinct words.\n\n| List | Step | Words with a value | Occurrences with a value |\n| --- | --- | --- | --- |`);
for (const [name, rows] of Object.entries(lists)) {
  const pair = new Set(), kanaRow = new Set(), kanaOfKanji = new Map();
  for (const [s, r] of rows) { if (s) { pair.add(`${s}\t${kata(r)}`); if (r) (kanaOfKanji.get(kata(r)) ?? kanaOfKanji.set(kata(r), new Set()).get(kata(r))).add(s); } else kanaRow.add(kata(r)); }
  const steps = [
    ["1 Spelling and reading equal the row", (w) => [...w.sp].some((k) => pair.has(k))],
    ["2 lexeme form and lexeme reading equal the row", (w) => pair.has(`${w.lex}\t${w.lread}`)],
    ["3 kana Spelling equals the row reading, and the row spelling is the lexeme form", (w) => [...w.sp].some((k) => { const [o] = k.split("\t"); return KANAONLY.test(o) && kanaOfKanji.get(kata(o))?.has(w.lex); })],
    ["4 kana Spelling equals a row with no kanji", (w) => [...w.sp].some((k) => { const [o] = k.split("\t"); return KANAONLY.test(o) && kanaRow.has(kata(o)); })],
  ];
  const got = new Set();
  for (const [label, fn] of steps) { let add = 0; for (const [id, w] of words) if (!got.has(id) && fn(w)) { got.add(id); add++; } let on = 0; for (const id of got) on += words.get(id).n; console.log(`| ${name} | up to step ${label} | ${got.size} (${((100 * got.size) / words.size).toFixed(1)}%), +${add} | ${((100 * on) / occ).toFixed(1)}% |`); }
  const miss = [...words].filter(([id]) => !got.has(id)).sort((a, c) => c[1].n - a[1].n).slice(0, 40).map(([, w]) => `${[...w.sp][0].split("\t")[0]}×${w.n}`);
  console.log(`<!-- ${name} most frequent words without a value: ${miss.join(", ")} -->`);
}
const solo = [...soloUnknown].filter(([s]) => known.has(s));
console.log(`\nPhrases that are one unknown token: ${[...soloUnknown.values()].reduce((a, c) => a + c, 0)} occurrences, ${soloUnknown.size} distinct. Of these, known elsewhere in the corpus in context: ${solo.length} distinct, ${solo.reduce((a, [, n]) => a + n, 0)} occurrences. Examples: ${solo.sort((a, c) => c[1] - a[1]).slice(0, 30).map(([s, n]) => `${s}×${n}`).join(", ")}`);
for (const s of ["ピンチ！", "ピンチ。", "「ピンチ」", "ピンチ"]) console.log(s, t.tokenize(s).map((x) => `${x.surface}:${x.isUnknown}`).join(" "));
