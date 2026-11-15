// How the words of the local corpus find Dictionary entries, step by step. Usage: node lookup.cjs <spike dir> <jmdict dir> <jmnedict dir> <jlpt data dir>
const { readFileSync, readdirSync } = require("node:fs");
const [spike, jm, jn, jlpt] = process.argv.slice(2);
const { TokenizerBuilder } = require(`${spike}/node_modules/lindera`);
const b = new TokenizerBuilder(); b.setDictionary(`${spike}/dicts/lindera-unidic202512`); b.setMode("normal");
const t = b.build();
const kata = (s) => s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
const KANAONLY = /^[ぁ-ゖァ-ヺー]+$/, JP = /[ぁ-ゖァ-ヺー一-鿿々]/;
const ID = 28, LEMMA = 7, LFORM = 6, KANA = 21, ORTH = 10, CTYPE = 4, CFORM = 5;
const pct = (a, n) => `${((100 * a) / n).toFixed(1)}%`;
function load(dir) {
  const strict = new Map(), loose = new Map(), rows = [];
  for (const f of readdirSync(dir).filter((f) => f.startsWith("term_bank"))) for (const r of JSON.parse(readFileSync(`${dir}/${f}`, "utf8"))) {
    rows.push(r); const [term, reading, , , , , seq] = r;
    const add = (m, k) => (m.get(k) ?? m.set(k, new Set()).get(k)).add(seq);
    if (reading || KANAONLY.test(term)) add(strict, `${term}\t${kata(reading || term)}`);
    add(loose, term);
  }
  return { strict, loose, rows };
}
const D = { JMdict: load(jm), JMnedict: load(jn) };
// facts about the JMdict file
{
  const { rows } = D.JMdict; const seqKanji = new Set(), seqKana = new Set(), scores = new Map(); let emptyReading = 0;
  for (const [term, reading, , , score, , seq] of rows) { (KANAONLY.test(term) ? seqKana : seqKanji).add(seq); scores.set(score, (scores.get(score) ?? 0) + 1); if (!reading) emptyReading++; }
  const both = [...seqKanji].filter((s) => seqKana.has(s)).length, all = new Set([...seqKanji, ...seqKana]).size;
  console.log(`## JMdict file\n\nRows ${rows.length}, entries ${all}. Entries with a kanji term ${seqKanji.size}, of these also a kana term row: ${both} (${pct(both, seqKanji.size)}). Entries with kana terms only: ${all - seqKanji.size}. Rows with an empty reading: ${emptyReading}.`);
  console.log(`Rows for term かける: ${rows.filter((r) => r[0] === "かける").length}; for 掛ける: ${rows.filter((r) => r[0] === "掛ける").length}. Entry 1198180: ${[...new Set(rows.filter((r) => r[6] === 1198180).map((r) => r[0] + "/" + r[1]))].join(", ")}`);
  const sv = [...scores].sort((a, c) => c[0] - a[0]);
  console.log(`Distinct score values: ${sv.length}, from ${sv.at(-1)[0]} to ${sv[0][0]}. Rows with score > 0: ${pct(sv.filter(([s]) => s > 0).reduce((a, x) => a + x[1], 0), rows.length)}, = 0: ${pct(scores.get(0) ?? 0, rows.length)}, < 0: ${pct(sv.filter(([s]) => s < 0).reduce((a, x) => a + x[1], 0), rows.length)}.`);
  for (const w of ["人", "かける", "日", "生", "辛い"]) { const m = new Map(); for (const r of rows) if (r[0] === w) { const k = r[1] || r[0]; m.set(k, Math.max(m.get(k) ?? -1e9, r[4])); } console.log(`Scores of ${w} by reading: ${[...m].sort((a, c) => c[1] - a[1]).map(([k, s]) => `${k} ${s}`).join(", ")}`); }
  const uk = rows.filter((r) => /\buk\b/.test(r[2]) && !KANAONLY.test(r[0])); const ukSeq = new Set(uk.map((r) => r[6])); const ukKana = [...ukSeq].filter((s) => seqKana.has(s)).length;
  console.log(`Entries with a kanji term and a "usually kana" sense: ${ukSeq.size}, with a kana term row: ${ukKana} (${pct(ukKana, ukSeq.size)}).`);
}
// corpus
const words = new Map(); let occ = 0; const lines = [];
for (const f of readdirSync(`${spike}/texts`)) for (const line of readFileSync(`${spike}/texts/${f}`, "utf8").split("\n")) for (const phrase of line.split(/[\s　]+/)) {
  if (!phrase) continue; const toks = t.tokenize(phrase); lines.push(toks);
  for (const x of toks) {
    if (x.isUnknown || !JP.test(x.surface) || x.details.length <= ID) continue;
    const d = x.details, w = words.get(d[ID]) ?? words.set(d[ID], { n: 0, sp: new Map(), pos: d[0], lemma: d[LEMMA].split("-")[0], lform: d[LFORM] }).get(d[ID]);
    w.n++; occ++; w.sp.set(`${d[ORTH]}\t${d[KANA]}`, (w.sp.get(`${d[ORTH]}\t${d[KANA]}`) ?? 0) + 1);
  }
}
const CONTENT = new Set(["名詞", "動詞", "形容詞", "副詞", "形状詞"]);
function step(w, dict) {
  const sp = [...w.sp.keys()].map((k) => k.split("\t")); const get = (m, k) => m.get(k) ?? [];
  let s = new Set(sp.flatMap(([o, k]) => [...get(dict.strict, `${o}\t${k}`)])); if (s.size) return [1, s];
  s = new Set(get(dict.strict, `${w.lemma}\t${w.lform}`)); if (s.size) return [2, s];
  s = new Set(sp.filter(([o]) => KANAONLY.test(o)).flatMap(([o]) => [...get(dict.strict, `${w.lemma}\t${kata(o)}`)])); if (s.size) return [3, s];
  s = new Set(sp.flatMap(([o]) => [...get(dict.loose, o)])); if (s.size) return [4, s];
  return [0, s];
}
console.log(`\n## Corpus\n\n${occ} occurrences, ${words.size} distinct words.\n`);
for (const [name, dicts] of [["JMdict", [D.JMdict]], ["JMdict, then JMnedict", [D.JMdict, D.JMnedict]], ["JMnedict", [D.JMnedict]]]) {
  const by = [0, 0, 0, 0, 0].map(() => ({ w: 0, o: 0, cw: 0 })); let cw = 0; const miss = [], s4 = [], sizes = { 1: 0, 2: 0, "3-5": 0, "6+": 0 }, big = [];
  for (const w of words.values()) {
    let st = 0, set = new Set(); for (const d of dicts) { const [a, s] = step(w, d); if (a && (!st || a < st)) { st = a; set = s; } }
    by[st].w++; by[st].o += w.n; if (CONTENT.has(w.pos)) { cw++; by[st].cw++; }
    const first = [...w.sp.keys()][0].replace("\t", "/");
    if (!st) miss.push([w.n, first]); if (st === 4) s4.push([w.n, first]);
    if (st) { sizes[set.size === 1 ? 1 : set.size === 2 ? 2 : set.size <= 5 ? "3-5" : "6+"]++; if (set.size > 5) big.push([set.size, first]); }
  }
  console.log(`### ${name}\n\n| Step | Words | Cumulative words | Content words, cumulative | Occurrences, cumulative |\n| --- | --- | --- | --- | --- |`);
  let aw = 0, ao = 0, ac = 0; for (const i of [1, 2, 3, 4]) { aw += by[i].w; ao += by[i].o; ac += by[i].cw; console.log(`| ${i} | ${by[i].w} | ${pct(aw, words.size)} | ${pct(ac, cw)} | ${pct(ao, occ)} |`); }
  console.log(`\nNo entry: ${by[0].w} words. Top: ${miss.sort((a, c) => c[0] - a[0]).slice(0, 40).map(([n, s]) => `${s}×${n}`).join(", ")}`);
  console.log(`\nStep 4 only, top: ${s4.sort((a, c) => c[0] - a[0]).slice(0, 40).map(([n, s]) => `${s}×${n}`).join(", ")}`);
  console.log(`\nEntries per matched word: ${Object.entries(sizes).map(([k, v]) => `${k}: ${v}`).join(", ")}. Most: ${big.sort((a, c) => c[0] - a[0]).slice(0, 15).map(([n, s]) => `${s} ${n}`).join(", ")}\n`);
}
// longer entries: a run of adjacent tokens whose text (last token as written, or in its dictionary form) is a JMdict term
{
  const loose = D.JMdict.loose, by = {}, ex = {};
  for (const toks of lines) for (let i = 0; i < toks.length; i++) { let text = ""; for (let j = i; j < Math.min(toks.length, i + 8); j++) {
    const x = toks[j]; if (!JP.test(x.surface)) break; const n = j - i + 1, base = x.details[ORTH] && x.details[ORTH] !== "*" ? x.details[ORTH] : x.surface;
    if (n > 1) { const as = loose.has(text + x.surface), db = !as && loose.has(text + base); if (as || db) { const c = (by[n] ??= { as: 0, db: 0, d: new Set() }); as ? c.as++ : c.db++; c.d.add(text + (as ? x.surface : base)); } }
    text += x.surface; } }
  console.log(`## Longer entries in the corpus\n\n| Tokens | Hits as written | More hits with the last token in dictionary form | Distinct entries | Examples |\n| --- | --- | --- | --- | --- |`);
  for (const [n, c] of Object.entries(by)) console.log(`| ${n} | ${c.as} | ${c.db} | ${c.d.size} | ${[...c.d].slice(0, 12).join(", ")} |`);
  const cnt = {}; let rowsN = 0, found = 0;
  for (const n of [5, 4, 3, 2, 1]) for (const l of readFileSync(`${jlpt}/n${n}.csv`, "utf8").split("\n").slice(1).filter(Boolean)) { const [seq, kana, kanji] = l.split(","); rowsN++; const k = t.tokenize(kanji || kana).length; cnt[k] = (cnt[k] ?? 0) + 1; if (D.JMdict.rows.length && seqSet().has(+seq)) found++; }
  function seqSet() { return (seqSet.s ??= new Set(D.JMdict.rows.map((r) => r[6]))); }
  console.log(`\nJLPT rows by number of tokens: ${Object.entries(cnt).map(([k, v]) => `${k}: ${v}`).join(", ")}. Rows whose entry ID is in the JMdict file: ${found} of ${rowsN}.`);
}
// inflection: what follows a verb or adjective
{
  const combos = new Map(); let total = 0, labeled = 0;
  const label = (x, nx) => { const f = x.details[CFORM], nl = nx && nx.details[LEMMA], np = nx && nx.details[0], ct = nx && nx.details[CTYPE], out = [];
    if (f.startsWith("命令形")) out.push("imperative"); if (f.startsWith("意志推量形")) out.push("volitional");
    if (np === "助動詞" && ct === "助動詞-タ") out.push(nx.details[CFORM].startsWith("仮定形") ? "たら-form" : "past");
    if (np === "助動詞" && (ct === "助動詞-ナイ" || ct === "助動詞-ヌ")) out.push("negative"); if (np === "形容詞" && nl === "無い" && x.details[0] === "形容詞") out.push("negative");
    if (np === "助詞" && nl === "て") out.push("て-form"); if (np === "助詞" && nl === "ば") out.push("ば-form"); if (np === "助詞" && nl === "たり") out.push("たり-form");
    if (np === "助動詞" && ct === "助動詞-マス") out.push("polite"); if (np === "助動詞" && ct === "助動詞-レル") out.push("passive or potential");
    if (np === "助動詞" && nl === "せる") out.push("causative"); if (np === "助動詞" && ct === "助動詞-タイ") out.push("たい-form");
    return out; };
  for (const toks of lines) for (let i = 0; i < toks.length; i++) { const x = toks[i]; if (x.isUnknown || !["動詞", "形容詞"].includes(x.details[0])) continue; const f = x.details[CFORM];
    if (f.startsWith("終止形") || f.startsWith("連体形")) continue; total++; const nx = toks[i + 1];
    const key = `${x.details[0]} ${f} + ${nx ? `${nx.details[0]} ${nx.details[LEMMA]}` : "(end)"}`; const l = label(x, nx); if (l.length) labeled++;
    const c = combos.get(key) ?? combos.set(key, { n: 0, l: l.join(", "), ex: x.surface + (nx ? nx.surface : "") }).get(key); c.n++; }
  console.log(`\n## Inflection\n\nVerb and adjective tokens not in 終止形 or 連体形: ${total}. With a label from the table: ${labeled} (${pct(labeled, total)}).\n\n| Form + next token | Count | Example | Label |\n| --- | --- | --- | --- |`);
  for (const [k, c] of [...combos].sort((a, c) => c[1].n - a[1].n).slice(0, 45)) console.log(`| ${k} | ${c.n} | ${c.ex} | ${c.l} |`);
}
