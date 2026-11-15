// For the words of the local corpus: which share gets a JLPT level or a Jiten rank, by two match directions.
// A: each list row goes through the tokenizer on install (three-step rule). B: lookup by the word's Spellings and reading.
const { readFileSync, readdirSync } = require("node:fs");
const [spike, data] = process.argv.slice(2);
const { TokenizerBuilder } = require(`${spike}/node_modules/lindera`);
const b = new TokenizerBuilder(); b.setDictionary(`${spike}/dicts/lindera-unidic202512`); b.setMode("normal");
const t = b.build();
const kata = (s) => s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
const KANAONLY = /^[ぁ-ゖァ-ヺー]+$/, JP = /[ぁ-ゖァ-ヺー一-鿿々]/;
const one = (s) => { const x = t.tokenize(s); return x.length === 1 && !x[0].isUnknown ? x[0].details : null; };
const ID = 28, LEMMA = 7, KANA = 21, ORTH = 10;
function rowLexeme(spelling, reading) {
  const r = kata(reading);
  if (spelling && spelling !== reading) {
    const k = one(spelling);
    if (k && k[KANA] === r) return k[ID];
    const h = one(reading);
    return h && (h[LEMMA].split("-")[0] === spelling || (k && k[ID] === h[ID])) ? h[ID] : null;
  }
  return one(reading)?.[ID] ?? null;
}
const lists = { JLPT: [], Jiten: [] };
for (const n of [5, 4, 3, 2, 1]) for (const l of readFileSync(`${data}/n${n}.csv`, "utf8").split("\n").slice(1).filter(Boolean)) { const [, kana, kanji] = l.split(","); lists.JLPT.push([kanji, kana]); }
for (const l of readFileSync(`${data}/jiten.csv`, "utf8").split("\n").slice(1).filter(Boolean)) { const p = l.split(","); if (p.length !== 3) continue; const [w, f] = p; lists.Jiten.push([KANAONLY.test(w) ? "" : w, KANAONLY.test(f.replace(/・/g, "")) ? f.replace(/・/g, "") : w]); }
// corpus words: lexeme id -> { n, spellings: Set of "orth\treadingKatakana", pos }
const words = new Map(); let occ = 0;
for (const f of readdirSync(`${spike}/texts`)) for (const line of readFileSync(`${spike}/texts/${f}`, "utf8").split("\n")) for (const x of t.tokenize(line)) {
  if (x.isUnknown || !JP.test(x.surface) || x.details.length <= ID) continue;
  const d = x.details, w = words.get(d[ID]) ?? words.set(d[ID], { n: 0, sp: new Set(), pos: d[0] }).get(d[ID]);
  w.n++; occ++; w.sp.add(`${d[ORTH]}\t${d[KANA]}`);
}
console.log(`Corpus: ${occ} occurrences, ${words.size} distinct words.\n\n| List | Direction | Words with a value | Occurrences with a value |\n| --- | --- | --- | --- |`);
const CONTENT = new Set(["名詞", "動詞", "形容詞", "副詞", "形状詞"]);
for (const [name, rows] of Object.entries(lists)) {
  const A = new Set(); for (const [s, r] of rows) { const id = rowLexeme(s, r); if (id) A.add(id); }
  const strict = new Set(), loose = new Set(); for (const [s, r] of rows) { strict.add(`${s || r}\t${kata(r)}`); loose.add(s || r); loose.add(r); }
  const hit = { "A: rows through the tokenizer": (id) => A.has(id), "B: Spelling plus reading": (id, w) => [...w.sp].some((k) => strict.has(k)), "B loose: Spelling text only": (id, w) => [...w.sp].some((k) => loose.has(k.split("\t")[0])), "A or B": (id, w) => A.has(id) || [...w.sp].some((k) => strict.has(k)) };
  for (const [dir, fn] of Object.entries(hit)) {
    let wn = 0, on = 0, cw = 0, cwn = 0; const miss = [];
    for (const [id, w] of words) { const ok = fn(id, w); if (ok) { wn++; on += w.n; } else miss.push([w.n, [...w.sp][0].split("\t")[0]]); if (CONTENT.has(w.pos)) { cw++; if (ok) cwn++; } }
    console.log(`| ${name} | ${dir} | ${wn} (${((100 * wn) / words.size).toFixed(1)}%), content words ${((100 * cwn) / cw).toFixed(1)}% | ${((100 * on) / occ).toFixed(1)}% |`);
    if (name === "Jiten") console.log(`<!-- top misses ${dir}: ${miss.sort((a, c) => c[0] - a[0]).slice(0, 30).map(([n, s]) => `${s}×${n}`).join(", ")} -->`);
  }
}
for (const s of ["ピンチ", "プロジェクト"]) console.log(s, t.tokenize(s).map((x) => `${x.surface}:${x.isUnknown}:${x.details.length}`).join(" "));
