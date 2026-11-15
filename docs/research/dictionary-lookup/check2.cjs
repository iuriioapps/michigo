// The reading-only step per Dictionary and per text, the inflection label table with chains, and a sample of words with other readings to judge.
// Usage: node check2.cjs <spike dir> <jmdict dir> <jmnedict dir>
const { readFileSync, readdirSync } = require("node:fs");
const [spike, jm, jn] = process.argv.slice(2);
const { TokenizerBuilder } = require(`${spike}/node_modules/lindera`);
const b = new TokenizerBuilder(); b.setDictionary(`${spike}/dicts/lindera-unidic202512`); b.setMode("normal");
const t = b.build();
const kata = (s) => s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
const KANAONLY = /^[ぁ-ゖァ-ヺー]+$/, JP = /[ぁ-ゖァ-ヺー一-鿿々]/;
const ID = 28, LEMMA = 7, LFORM = 6, KANA = 21, SKANA = 20, ORTH = 10, CTYPE = 4, CFORM = 5;
const pct = (a, n) => `${((100 * a) / n).toFixed(1)}%`;
const add = (m, k, v) => (m.get(k) ?? m.set(k, new Set()).get(k)).add(v);
function load(dir) {
  const d = { strict: new Map(), loose: new Map(), byReading: new Map() };
  for (const f of readdirSync(dir).filter((f) => f.startsWith("term_bank"))) for (const [term, reading] of JSON.parse(readFileSync(`${dir}/${f}`, "utf8"))) {
    const r = kata(reading || (KANAONLY.test(term) ? term : "")); if (r) { add(d.strict, `${term}\t${r}`, 1); add(d.byReading, r, term); } add(d.loose, term, r || "");
  }
  return d;
}
const JM = load(jm), JN = load(jn);
const texts = readdirSync(`${spike}/texts`), words = new Map(), lines = []; let occ = 0;
for (const f of texts) for (const line of readFileSync(`${spike}/texts/${f}`, "utf8").split("\n")) for (const phrase of line.split(/[\s　]+/)) {
  if (!phrase) continue; const toks = t.tokenize(phrase); lines.push({ f, line, toks, phrase });
  for (const x of toks) { if (x.isUnknown || !JP.test(x.surface) || x.details.length <= ID) continue;
    const d = x.details, w = words.get(d[ID]) ?? words.set(d[ID], { n: 0, by: {}, sp: new Set(), lemma: d[LEMMA].split("-")[0], lform: d[LFORM] }).get(d[ID]);
    w.n++; occ++; w.by[f] = (w.by[f] ?? 0) + 1; w.sp.add(`${d[ORTH]}\t${d[KANA]}`); }
}
function step(w, d) {
  const sp = [...w.sp].map((k) => k.split("\t"));
  if (sp.some(([o, k]) => d.strict.has(`${o}\t${k}`))) return 1;
  if (d.strict.has(`${w.lemma}\t${w.lform}`)) return 2;
  if (sp.some(([o]) => KANAONLY.test(o) && d.strict.has(`${w.lemma}\t${kata(o)}`))) return 3;
  if (sp.some(([o]) => d.loose.has(o))) return 4;
  const hs = sp.filter(([o]) => KANAONLY.test(o)).map(([o]) => d.byReading.get(kata(o))?.size ?? 0); const n = Math.max(0, ...hs);
  return n ? [5, n] : 0;
}
console.log(`## The fifth step, by Dictionary\n\nCorpus: ${occ} occurrences, ${words.size} words.\n\n| Dictionaries | Words after steps 1 to 4 | Step 5 adds | Words after step 5 | Occurrences after step 5 | Step 5: one headword | 2 to 5 | 6 or more | Still no entry |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |`);
const final = new Map();
for (const [name, ds] of [["JMdict", [JM]], ["JMnedict", [JN]], ["JMdict, then JMnedict", [JM, JN]]]) {
  let w14 = 0, w5 = 0, o = 0, a = 0, m = 0, z = 0, none = 0; const ex = [], left = [];
  for (const [id, w] of words) { const rs = ds.map((d) => step(w, d)); const best = rs.some((r) => r && !Array.isArray(r)) ? 1 : rs.some(Array.isArray) ? 5 : 0;
    if (name.includes("then")) final.set(id, best);
    if (best === 1) { w14++; o += w.n; } else if (best === 5) { w5++; o += w.n; const n = rs.filter(Array.isArray).reduce((s, r) => s + r[1], 0); n === 1 ? a++ : n <= 5 ? m++ : z++; ex.push([w.n, `${[...w.sp][0].split("\t")[0]} (${n})`]); } else { none++; left.push([w.n, [...w.sp][0].split("\t")[0]]); } }
  console.log(`| ${name} | ${w14} (${pct(w14, words.size)}) | ${w5} | ${pct(w14 + w5, words.size)} | ${pct(o, occ)} | ${a} | ${m} | ${z} | ${none} |`);
  console.log(`<!-- ${name} step 5 top: ${ex.sort((x, y) => y[0] - x[0]).slice(0, 25).map(([n, s]) => `${s}×${n}`).join(", ")} | left: ${left.sort((x, y) => y[0] - x[0]).slice(0, 30).map(([n, s]) => `${s}×${n}`).join(", ")} -->`);
}
console.log(`\n## By text, JMdict then JMnedict\n\n| Text | Occurrences | Entry after steps 1 to 4 | Step 5 adds | No entry |\n| --- | --- | --- | --- | --- |`);
for (const f of texts) { let n = 0, a = 0, c = 0; for (const [id, w] of words) { const k = w.by[f] ?? 0; n += k; if (final.get(id) === 1) a += k; else if (final.get(id) === 5) c += k; } console.log(`| ${f} | ${n} | ${pct(a, n)} | ${pct(c, n)} | ${pct(n - a - c, n)} |`); }
// inflection labels with chains
const one = (x, nx, nn) => { const f = x.details[CFORM], np = nx?.details[0], nl = nx?.details[LEMMA], ct = nx?.details[CTYPE];
  if (np === "助動詞" && ct === "助動詞-タ") return [nx.details[CFORM].startsWith("仮定形") ? "たら-form" : "past", 1];
  if (np === "助動詞" && (ct === "助動詞-ナイ" || ct === "助動詞-ヌ")) return ["negative", 1];
  if (np === "形容詞" && nl === "無い" && x.details[0] === "形容詞") return ["negative", 1];
  if (np === "助動詞" && nl === "てる") return ["progressive", 1];
  if (np === "助詞" && nl === "て") return nn && nn.details[LEMMA] === "居る" ? ["progressive", 2] : ["て-form", 1];
  if (np === "助詞" && nl === "ば" && f.startsWith("仮定形")) return ["ば-form", 1];
  if (np === "助詞" && nl === "たり") return ["たり-form", 1];
  if (np === "助動詞" && ct === "助動詞-マス") return ["polite", 1];
  if (np === "助動詞" && ct === "助動詞-レル") return ["passive or potential", 1];
  if (np === "助動詞" && (nl === "せる" || nl === "させる")) return ["causative", 1];
  if (np === "助動詞" && ct === "助動詞-タイ") return ["たい-form", 1];
  return null; };
const labels = (toks, i) => { const out = []; let j = i; for (;;) { const x = toks[j], f = x.details[CFORM] ?? ""; const r = one(x, toks[j + 1], toks[j + 2]);
    if (!r) { if (f.startsWith("命令形")) out.push("imperative"); else if (f.startsWith("意志推量形")) out.push("volitional"); break; } out.push(r[0]); j += r[1]; if (out.length > 6) break; }
  return out; };
const tot = {}, chains = new Map(), gaps = new Map();
for (const { f, toks } of lines) for (let i = 0; i < toks.length; i++) { const x = toks[i]; if (x.isUnknown || !["動詞", "形容詞"].includes(x.details[0])) continue; const cf = x.details[CFORM];
  if (cf.startsWith("終止形") || cf.startsWith("連体形")) continue; const c = (tot[f] ??= { n: 0, base: 0, stem: 0, ku: 0 }); c.n++; const l = labels(toks, i);
  if (l.length) { c.base++; const k = l.join(", "); const e = chains.get(k) ?? chains.set(k, { n: 0, ex: "" }).get(k); e.n++; e.ex ||= toks.slice(i, i + l.length + 2).map((y) => y.surface).join(""); }
  else if (x.details[0] === "動詞" && cf.startsWith("連用形")) c.stem++; else if (x.details[0] === "形容詞" && cf.startsWith("連用形")) c.ku++;
  else { const nx = toks[i + 1]; const k = `${x.details[0]} ${cf} + ${nx ? `${nx.details[0]} ${nx.details[LEMMA]}` : "(end)"}`; const e = gaps.get(k) ?? gaps.set(k, { n: 0, ex: x.surface + (nx?.surface ?? "") }).get(k); e.n++; } }
console.log(`\n## Inflection labels\n\n| Text | Conjugated verbs and adjectives | Label from the table | Plus "stem" for a bare verb 連用形 | Plus a label for an adjective in 連用形 |\n| --- | --- | --- | --- | --- |`);
const sum = { n: 0, base: 0, stem: 0, ku: 0 };
for (const [f, c] of [...Object.entries(tot), ["All", sum]]) { if (f !== "All") for (const k in sum) sum[k] += c[k]; console.log(`| ${f} | ${c.n} | ${pct(c.base, c.n)} | ${pct(c.base + c.stem, c.n)} | ${pct(c.base + c.stem + c.ku, c.n)} |`); }
console.log(`\nMost frequent label chains: ${[...chains].sort((x, y) => y[1].n - x[1].n).slice(0, 30).map(([k, e]) => `${k} (${e.ex}) ${e.n}`).join("; ")}`);
console.log(`\nStill without a label: ${[...gaps].sort((x, y) => y[1].n - x[1].n).slice(0, 15).map(([k, e]) => `${k} (${e.ex}) ${e.n}`).join("; ")}`);
// sample to judge: occurrences of a kanji Spelling that JMdict also lists under another reading
let seed = 20261115; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const pool = []; let withOther = 0, kanjiOcc = 0;
for (const { line, toks, phrase } of lines) for (const x of toks) { if (x.isUnknown || x.details.length <= ID) continue; const o = x.details[ORTH]; if (KANAONLY.test(o) || !JP.test(o) || !/[一-鿿]/.test(x.surface)) continue; kanjiOcc++;
  const rs = [...(JM.loose.get(o) ?? [])].filter(Boolean); if (!rs.includes(x.details[KANA]) || rs.length < 2) continue; withOther++; pool.push(`${x.surface} → ${x.details[SKANA]} (others: ${rs.filter((r) => r !== x.details[KANA]).slice(0, 4).join(" ")}) | ${(() => { const bf = Buffer.from(phrase); const pre = bf.subarray(0, x.byteStart).toString(), post = bf.subarray(x.byteEnd).toString(); return pre.slice(-30) + '【' + x.surface + '】' + post.slice(0, 20); })()}`); }
console.log(`\n## Sample\n\nOccurrences written with kanji: ${kanjiOcc}. With another reading in JMdict for the same spelling: ${withOther} (${pct(withOther, kanjiOcc)}).\n`);
const pick = new Set(); while (pick.size < 150) pick.add(Math.floor(rnd() * pool.length)); let k = 0; for (const i of pick) console.log(`${++k}. ${pool[i]}`);
