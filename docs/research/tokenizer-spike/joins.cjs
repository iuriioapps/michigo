// Which joins change what on UniDic 2025.12 (native binding). Usage: node joins.cjs > results-joins-202512.md
const { readFileSync, readdirSync } = require("node:fs");
const assert = require("node:assert");
const { TokenizerBuilder } = require("lindera");
const mk = (f) => { const b = new TokenizerBuilder(); b.setDictionary(`${__dirname}/dicts/lindera-unidic202512`); b.setMode("normal"); f?.(b); return b.build(); };
const NOUN_TAGS = ["名詞,普通名詞,一般,*", "名詞,普通名詞,サ変可能,*", "名詞,固有名詞,地名,国", "名詞,固有名詞,地名,一般", "接尾辞,名詞的,一般,*"];
const plain = mk();
const compound = mk((b) => b.appendTokenFilter("japanese_compound_word", { tags: NOUN_TAGS, new_tag: "名詞,普通名詞,一般,*" }));
const toks = (t, s) => t.tokenize(s).map((x) => ({ s: x.surface, b: x.byteStart, e: x.byteEnd, oov: x.isUnknown, pos: x.details.slice(0, 4).join(",") }));

// Narrow katakana join: adjacent katakana tokens join when one piece is unknown or at most two characters long
const KATA = /^[ァ-ヺー]+$/;
function joinKatakana(ts) {
  const out = [];
  for (const t of ts) {
    const p = out.at(-1);
    if (p && p.e === t.b && KATA.test(p.s) && KATA.test(t.s) && (p.oov || t.oov || p.narrow || [...t.s].length <= 2 || [...p.last].length <= 2))
      out[out.length - 1] = { ...p, s: p.s + t.s, e: t.e, parts: [...(p.parts ?? [p.s]), t.s], narrow: true, last: t.s };
    else out.push({ ...t, last: t.s });
  }
  return out;
}
assert.deepEqual(joinKatakana([{ s: "フリー", b: 0, e: 9 }, { s: "レン", b: 9, e: 15 }]).map((t) => t.s), ["フリーレン"]);
assert.deepEqual(joinKatakana([{ s: "ランク", b: 0, e: 9 }, { s: "アップ", b: 9, e: 18 }]).map((t) => t.s), ["ランク", "アップ"]);

const cases = ["魔法使いフリーレンは冒険者だ。", "日本人の大学生が自転車に乗る。", "封魔鉱を採掘する。", "服役者と悪魔族", "ランクアップしたフェルン", "東京都知事選挙の結果", "2025年に15人が来た。"];
console.log("# Joins on UniDic 2025.12\n\n## Fixed cases\n\n| Text | Plain | Compound filter | Katakana join |\n| --- | --- | --- | --- |");
const show = (ts) => ts.map((t) => t.s).join("·");
for (const c of cases) console.log(`| ${c} | ${show(toks(plain, c))} | ${show(toks(compound, c))} | ${show(joinKatakana(toks(plain, c)))} |`);

const lines = readdirSync(`${__dirname}/texts`).flatMap((f) => readFileSync(`${__dirname}/texts/${f}`, "utf8").split("\n").filter(Boolean));
const tally = (m, k) => m.set(k, (m.get(k) ?? 0) + 1);
const kata = new Map(), comp = new Map();
let kataLines = 0, compLines = 0, tokens = 0, compTokens = 0;
for (const line of lines) {
  const p = toks(plain, line);
  tokens += p.length;
  const k = joinKatakana(p).filter((t) => t.parts);
  if (k.length) kataLines++;
  for (const t of k) tally(kata, `${t.s} (${t.parts.join("·")})`);
  const starts = new Map(p.map((t, i) => [t.b, i]));
  const c = toks(compound, line);
  compTokens += c.length;
  let hit = false;
  for (const t of c) {
    const i = starts.get(t.b);
    if (p[i].e === t.e) continue;
    hit = true;
    let j = i; const parts = [];
    while (p[j] && p[j].e <= t.e) parts.push(p[j++].s);
    tally(comp, `${t.s} (${parts.join("·")})`);
  }
  if (hit) compLines++;
}
const top = (m, n) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `- ${v}: ${k}`).join("\n");
// seeded sample over distinct joins, so the rare ones show too
function sample(m, n) { let x = 42; const ks = [...m.keys()]; const out = []; while (out.length < n && ks.length) { x = (x * 1103515245 + 12345) % 2147483648; out.push(ks.splice(x % ks.length, 1)[0]); } return out.map((k) => `- ${k}`).join("\n"); }
const sum = (m) => [...m.values()].reduce((a, b) => a + b, 0);
console.log(`\n## Corpus\n\n${lines.length} lines, ${tokens} plain tokens.\n`);
console.log(`## Narrow katakana join\n\nChanges ${kataLines} lines, ${sum(kata)} joins, ${kata.size} distinct.\n\n### Most frequent\n\n${top(kata, 30)}\n\n### Seeded sample of distinct joins\n\n${sample(kata, 30)}\n`);
console.log(`## Compound filter\n\nTags: ${NOUN_TAGS.map((t) => "`" + t + "`").join(", ")}.\n\nChanges ${compLines} lines, ${sum(comp)} joins, ${comp.size} distinct. Tokens fall from ${tokens} to ${compTokens}.\n\n### Most frequent\n\n${top(comp, 40)}\n\n### Seeded sample of distinct joins\n\n${sample(comp, 60)}`);
