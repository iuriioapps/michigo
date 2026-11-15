// Why kana words miss, and what a reading-only step and an "always show other readings" rule add. Usage: node miss.cjs <spike dir> <jmdict dir>
const { readFileSync, readdirSync } = require("node:fs");
const [spike, jm] = process.argv.slice(2);
const { TokenizerBuilder } = require(`${spike}/node_modules/lindera`);
const b = new TokenizerBuilder(); b.setDictionary(`${spike}/dicts/lindera-unidic202512`); b.setMode("normal");
const t = b.build();
const kata = (s) => s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
const KANAONLY = /^[ぁ-ゖァ-ヺー]+$/, JP = /[ぁ-ゖァ-ヺー一-鿿々]/;
const ID = 28, LEMMA = 7, LFORM = 6, KANA = 21, ORTH = 10;
const pct = (a, n) => `${((100 * a) / n).toFixed(1)}%`;
const strict = new Map(), loose = new Map(), byReading = new Map();
const add = (m, k, v) => (m.get(k) ?? m.set(k, new Set()).get(k)).add(v);
for (const f of readdirSync(jm).filter((f) => f.startsWith("term_bank"))) for (const [term, reading, , , , , seq] of JSON.parse(readFileSync(`${jm}/${f}`, "utf8"))) {
  const r = kata(reading || (KANAONLY.test(term) ? term : "")); if (r) { add(strict, `${term}\t${r}`, seq); add(byReading, r, `${term}`); } add(loose, term, r || "(none)");
}
for (const s of ["だけ", "など", "おかげ", "おく", "つく", "わし", "おなか", "めでたい", "かける"]) console.log(`${s}: terms with this reading: ${[...(byReading.get(kata(s)) ?? [])].slice(0, 12).join(", ") || "none"} | tokens: ${t.tokenize(s + "だ").slice(0, 1).map((x) => `${x.details[ORTH]} lemma ${x.details[LEMMA]} lform ${x.details[LFORM]}`)}`);
const words = new Map(); let occ = 0;
for (const f of readdirSync(`${spike}/texts`)) for (const line of readFileSync(`${spike}/texts/${f}`, "utf8").split("\n")) for (const phrase of line.split(/[\s　]+/)) for (const x of phrase ? t.tokenize(phrase) : []) {
  if (x.isUnknown || !JP.test(x.surface) || x.details.length <= ID) continue;
  const d = x.details, w = words.get(d[ID]) ?? words.set(d[ID], { n: 0, sp: new Set(), lemma: d[LEMMA].split("-")[0], lform: d[LFORM] }).get(d[ID]);
  w.n++; occ++; w.sp.add(`${d[ORTH]}\t${d[KANA]}`);
}
let hit13 = 0, hit13o = 0, r5 = 0, r5o = 0, other = 0, othero = 0, kanji13 = 0, kanji13o = 0; const r5ex = [], oex = [], sizes = [];
for (const w of words.values()) {
  const sp = [...w.sp].map((k) => k.split("\t"));
  const ok = sp.some(([o, k]) => strict.has(`${o}\t${k}`)) || strict.has(`${w.lemma}\t${w.lform}`) || sp.some(([o]) => KANAONLY.test(o) && strict.has(`${w.lemma}\t${kata(o)}`));
  if (ok) { hit13++; hit13o += w.n;
    // other readings: a Spelling with kanji that has a JMdict term row under a reading that no Spelling of the word has
    const mine = new Set(sp.map(([, k]) => k).concat(w.lform)); const ksp = sp.filter(([o]) => !KANAONLY.test(o));
    if (ksp.length) { kanji13++; kanji13o += w.n; const extra = new Set(ksp.flatMap(([o]) => [...(loose.get(o) ?? [])].filter((r) => r !== "(none)" && !mine.has(r))));
      if (extra.size) { other++; othero += w.n; oex.push([w.n, `${ksp[0][0]} ${sp[0][1]} (+${[...extra].slice(0, 3).join(" ")})`]); } }
  } else if (!sp.some(([o]) => loose.has(o))) {
    const ks = sp.filter(([o]) => KANAONLY.test(o)).map(([o]) => byReading.get(kata(o))).filter(Boolean);
    if (ks.length) { r5++; r5o += w.n; const n = Math.max(...ks.map((s) => s.size)); sizes.push(n); r5ex.push([w.n, `${sp[0][0]} (${n})`]); }
  }
}
console.log(`\nWords ${words.size}, occurrences ${occ}. Steps 1 to 3: ${hit13} words.`);
console.log(`Reading-only step (a kana Spelling equals the reading of any entry), for words with no entry after step 4: ${r5} words (${pct(r5, words.size)}), ${r5o} occurrences (${pct(r5o, occ)}). Headwords per word: 1: ${sizes.filter((n) => n === 1).length}, 2-5: ${sizes.filter((n) => n > 1 && n <= 5).length}, 6+: ${sizes.filter((n) => n > 5).length}. Top: ${r5ex.sort((a, c) => c[0] - a[0]).slice(0, 40).map(([n, s]) => `${s}×${n}`).join(", ")}`);
console.log(`\nWords with a kanji Spelling matched by steps 1 to 3: ${kanji13} (${kanji13o} occurrences). Of these, JMdict has the same spelling under another reading: ${other} (${pct(other, kanji13)}), ${othero} occurrences (${pct(othero, kanji13o)}). Top: ${oex.sort((a, c) => c[0] - a[0]).slice(0, 30).map(([n, s]) => `${s}×${n}`).join(", ")}`);
