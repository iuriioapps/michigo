// Measures how often the UniDic 2025.12 accent value agrees with a pitch dictionary.
// Usage: node measure.cjs <tokenizer-spike-dir> <kanjium accents.txt> <wadoku_pitchdb.csv> [--examples]
// The spike dir must hold node_modules/lindera, unidic-new/202512-out and texts/*.txt.
// Prints JSON. Nothing is written. Reference files are parsed as text only.
const fs = require("node:fs");
const assert = require("node:assert");

const hira = (s) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
const nums = (s) => (s.match(/\d+/g) ?? []).map(Number);
const moras = (kana) => [...kana].filter((c) => !"ゃゅょぁぃぅぇぉゎ".includes(c)).length;

// Kanjium line: term TAB reading (empty for a kana term) TAB accents, with optional tags such as "(名)0,(副)1".
const parseKanjium = (line) => {
  const [term, reading, acc] = line.split("\t");
  return term && acc ? [[term, hira(reading || term), nums(acc)]] : [];
};
// Wadoku line: spellings (joined by U+241F) U+241E hiragana reading U+241E marked reading U+241E positions U+241E pattern.
const parseWadoku = (line) => {
  const f = line.split("␞");
  if (f.length < 4) return [];
  // "人買(い)" means that the kana in brackets may be written or left out.
  const spellings = f[0].split("␟").flatMap((s) => [s.replace(/[()]/g, ""), s.replace(/\(.*?\)/g, "")]);
  return [...new Set(spellings)].map((s) => [s, hira(f[1]), nums(f[3])]);
};

assert.equal(hira("ガッコウ"), "がっこう");
assert.equal(hira("ラーメン"), "らーめん");
assert.equal(moras("きょう"), 2);
assert.deepEqual(parseKanjium("今\tいま\t(名)1,(副)0"), [["今", "いま", [1, 0]]]);
assert.deepEqual(parseKanjium("リュック\t\t1"), [["リュック", "りゅっく", [1]]]);
assert.deepEqual(parseWadoku("人買(い)␟人買␞ひとかい␞ひと･かい␞0,3␞LHHHH"), [
  ["人買い", "ひとかい", [0, 3]],
  ["人買", "ひとかい", [0, 3]],
]);

const [spike, kanjiumPath, wadokuPath] = process.argv.slice(2);
const withExamples = process.argv.includes("--examples");
if (!spike || !kanjiumPath || !wadokuPath) throw new Error("usage: node measure.cjs <spike-dir> <accents.txt> <wadoku_pitchdb.csv>");

const load = (path, parse) => {
  const map = new Map();
  for (const line of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    for (const [term, reading, acc] of parse(line)) {
      if (!acc.length) continue;
      const key = `${term}\t${reading}`;
      map.set(key, [...new Set([...(map.get(key) ?? []), ...acc])]);
    }
  }
  return map;
};
const refs = { kanjium: load(kanjiumPath, parseKanjium), wadoku: load(wadokuPath, parseWadoku) };
// "either" answers: does any of the two references list this value?
refs.either = new Map(refs.kanjium);
for (const [k, v] of refs.wadoku) refs.either.set(k, [...new Set([...(refs.either.get(k) ?? []), ...v])]);

const { TokenizerBuilder } = require(`${spike}/node_modules/lindera`);
const builder = new TokenizerBuilder();
builder.setDictionary(`${spike}/unidic-new/202512-out`);
builder.setMode("normal");
const tokenizer = builder.build();

// One entry per Spelling plus reading. The accent is the one seen most often for the pair.
const pairs = new Map();
let tokens = 0;
let unknown = 0;
for (const file of fs.readdirSync(`${spike}/texts`).filter((f) => f.endsWith(".txt"))) {
  for (const line of fs.readFileSync(`${spike}/texts/${file}`, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    for (const t of tokenizer.tokenize(line)) {
      const d = t.details;
      const pos = d[0];
      if (pos === "補助記号" || pos === "空白") continue;
      tokens++;
      if (d.length < 25 || d[10] === "*" || d[21] === "*") {
        unknown++;
        continue;
      }
      const key = `${d[10]}\t${hira(d[21])}`;
      const p = pairs.get(key) ?? { pos, n: 0, accents: new Map() };
      p.n++;
      p.accents.set(d[24], (p.accents.get(d[24]) ?? 0) + 1);
      pairs.set(key, p);
    }
  }
}

const pct = (a, b) => (b ? Math.round((1000 * a) / b) / 10 : null);
const kindOf = (u, r, m) => {
  if (u[0] === 0 && r.every((x) => x === m)) return "UniDic heiban, reference odaka";
  if (r.every((x) => x === 0) && u[0] === m) return "UniDic odaka, reference heiban";
  if (u[0] === 0) return "UniDic heiban, reference accented";
  if (r.every((x) => x === 0)) return "UniDic accented, reference heiban";
  if (r.some((x) => Math.abs(x - u[0]) === 1)) return "both accented, one mora apart";
  return "both accented, further apart";
};

const measure = (ref, other) => {
  const blank = () => ({ pairs: 0, tokens: 0, noAccentPairs: 0, noAccentTokens: 0, refPairs: 0, refTokens: 0, bothPairs: 0, bothTokens: 0, anyPairs: 0, anyTokens: 0, firstPairs: 0, firstTokens: 0 });
  const total = blank();
  const byPos = {};
  const kinds = {};
  // Pairs that this reference contradicts and the other reference also lists: whose side does the other one take?
  const secondOpinion = { pairs: 0, tokens: 0, sidesWithUnidicPairs: 0, sidesWithUnidicTokens: 0 };
  const noAccent = [];
  let mixedAccentPairs = 0;
  let minorityAccentTokens = 0;
  for (const [key, p] of pairs) {
    const rows = [total, (byPos[p.pos] ??= blank())];
    const accent = [...p.accents].sort((a, b) => b[1] - a[1])[0][0];
    if (p.accents.size > 1) (mixedAccentPairs++, (minorityAccentTokens += p.n - Math.max(...p.accents.values())));
    const u = accent === "*" ? [] : nums(accent);
    const r = ref.get(key);
    if (!u.length && !["助詞", "助動詞", "接尾辞", "接頭辞"].includes(p.pos)) noAccent.push([p.n, `${key.replace("\t", " ")} ${p.pos}`]);
    for (const row of rows) {
      row.pairs++;
      row.tokens += p.n;
      if (!u.length) (row.noAccentPairs++, (row.noAccentTokens += p.n));
      if (r) (row.refPairs++, (row.refTokens += p.n));
      if (!u.length || !r) continue;
      row.bothPairs++;
      row.bothTokens += p.n;
      if (u.some((x) => r.includes(x))) (row.anyPairs++, (row.anyTokens += p.n));
      if (u[0] === r[0]) (row.firstPairs++, (row.firstTokens += p.n));
    }
    if (u.length && r && !u.some((x) => r.includes(x))) {
      const k = (kinds[kindOf(u, r, moras(key.split("\t")[1]))] ??= { pairs: 0, tokens: 0, examples: [] });
      k.pairs++;
      k.tokens += p.n;
      const o = other?.get(key);
      if (o) {
        const sides = u.some((x) => o.includes(x));
        secondOpinion.pairs++;
        secondOpinion.tokens += p.n;
        if (sides) (secondOpinion.sidesWithUnidicPairs++, (secondOpinion.sidesWithUnidicTokens += p.n));
      }
      k.examples.push([p.n, `${key.replace("\t", " ")} ${p.pos} UniDic ${u} reference ${r}`]);
    }
  }
  const finish = (row) => ({
    ...row,
    noAccentTokenPct: pct(row.noAccentTokens, row.tokens),
    refPairPct: pct(row.refPairs, row.pairs),
    refTokenPct: pct(row.refTokens, row.tokens),
    anyPairPct: pct(row.anyPairs, row.bothPairs),
    anyTokenPct: pct(row.anyTokens, row.bothTokens),
    firstPairPct: pct(row.firstPairs, row.bothPairs),
    firstTokenPct: pct(row.firstTokens, row.bothTokens),
  });
  for (const k of Object.values(kinds)) {
    // Single words only, most frequent first. Left out unless asked for, so the default output holds no corpus words.
    k.examples = withExamples ? k.examples.sort((a, b) => b[0] - a[0]).slice(0, 12).map((e) => `${e[1]} (${e[0]} tokens)`) : undefined;
  }
  return { total: finish(total), byPos: Object.fromEntries(Object.entries(byPos).map(([k, v]) => [k, finish(v)])), kinds, secondOpinion, mixedAccentPairs, minorityAccentTokens, noAccentExamples: withExamples ? noAccent.sort((a, b) => b[0] - a[0]).slice(0, 15).map((e) => `${e[1]} (${e[0]} tokens)`) : undefined };
};

console.log(
  JSON.stringify(
    {
      tokens,
      tokensWithoutSpellingOrReading: unknown,
      referenceEntries: { kanjium: refs.kanjium.size, wadoku: refs.wadoku.size },
      kanjium: measure(refs.kanjium, refs.wadoku),
      wadoku: measure(refs.wadoku, refs.kanjium),
      either: measure(refs.either),
    },
    null,
    1,
  ),
);
