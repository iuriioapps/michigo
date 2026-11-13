// Edge-case fixes measured on lindera-wasm + UniDic. Usage: node --expose-gc fixes.mjs  -> results-fixes.md
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import assert from "node:assert";
import init, * as L from "lindera-wasm";

await init({ module_or_path: readFileSync("node_modules/lindera-wasm/lindera_wasm_bg.wasm") });
const f = (n) => readFileSync(`dicts/lindera-unidic/${n}`);
const loadDict = () => L.loadDictionaryFromBytes(f("metadata.json"), f("dict.trie"), f("dict.valsidx"), f("dict.vals"), f("dict.wordsidx"), f("dict.words"), f("matrix.mtx"), f("char_def.bin"), f("unk.bin"));

function build(userCsv) {
  const dict = loadDict();
  const user = userCsv && L.loadUserDictionaryFromBytes(Buffer.from(userCsv), dict.metadata);
  const b = new L.TokenizerBuilder();
  b.setDictionaryInstance(dict);
  if (user) b.setUserDictionaryInstance(user);
  return b.build();
}
const utf16 = (line, byte) => Buffer.from(line).subarray(0, byte).toString().length;
const conv = (line) => (t) => {
  const d = t.details;
  const user = d[7] === "*" && !t.isUnknown; // simple-format user entry: only pos and reading are set
  return { s: t.surface, b: utf16(line, t.byteStart), e: utf16(line, t.byteEnd), oov: t.isUnknown, user, pos: d[0], key: d[7] && d[7] !== "*" ? `${d[7]}(${d[6]})` : t.surface };
};
const tokenizeWith = (tok) => (line) => tok.tokenize(line).map(conv(line));

const SKIP_POS = new Set(["助詞", "助動詞", "記号", "補助記号", "空白"]);
const contentPos = (t) => !SKIP_POS.has(t.pos) && t.s.trim() !== "";
// Fix: a word needs at least one letter or digit, whatever the dictionary says about its part of speech
const contentStrict = (t) => contentPos(t) && /[\p{L}\p{N}]/u.test(t.s);

// Fix: normalize only half-width katakana (and its sound marks), keep an index table back to the original
function normalizeHalfWidth(line, full = false) {
  let norm = "";
  const start = [], end = [];
  for (const m of line.matchAll(/.[\p{M}ﾞﾟ]*/gsu)) {
    const n = full || /[｡-ﾟ]/.test(m[0]) ? m[0].normalize("NFKC") : m[0];
    for (let i = 0; i < n.length; i++) start.push(m.index), end.push(m.index + m[0].length);
    norm += n;
  }
  return { norm, toOriginal: (t) => ({ ...t, b: start[t.b], e: end[t.e - 1] }) };
}

// Fix: UniDic cuts Latin words and numbers into single characters; join adjacent runs again
const RUN = [/^[A-Za-zＡ-Ｚａ-ｚ]+$/, /^[0-9０-９]+$/];
function mergeRuns(toks) {
  const out = [];
  for (const t of toks) {
    const p = out.at(-1);
    const cls = RUN.findIndex((r) => r.test(t.s));
    if (p && cls >= 0 && p.e === t.b && p.cls === cls) {
      p.s += t.s; p.e = t.e; p.key = p.s.normalize("NFKC").toLowerCase(); p.oov = false; p.merged = true;
    } else out.push({ ...t, cls });
  }
  return out;
}
{
  const m = mergeRuns([{ s: "Y", b: 0, e: 1 }, { s: "e", b: 1, e: 2 }, { s: "s", b: 2, e: 3 }, { s: "2", b: 4, e: 5 }, { s: "5", b: 5, e: 6 }, { s: "人", b: 6, e: 7 }]);
  assert.deepEqual(m.map((t) => t.s), ["Yes", "2", "5", "人"].slice(0, 1).concat(["25", "人"]));
  const { norm, toOriginal } = normalizeHalfWidth("ﾊﾞｶ！ＡＢ");
  assert.equal(norm, "バカ！ＡＢ");
  assert.deepEqual(toOriginal({ b: 0, e: 2 }), { b: 0, e: 3 });
}

const texts = Object.fromEntries(readdirSync("texts").filter((n) => /^(subs-|transcript|lyrics|prose|wiki-)/.test(n) && n.endsWith(".txt") && n !== "subtitles.txt").map((n) => [n.slice(0, -4), readFileSync(`texts/${n}`, "utf8").split("\n").filter(Boolean)]));
const md = [];
const table = (head, rows) => md.push("", `| ${head.join(" | ")} |`, `| ${head.map(() => "---").join(" | ")} |`, ...rows.map((r) => `| ${r.join(" | ")} |`), "");
const pct = (a, b) => `${a} (${((100 * a) / b).toFixed(1)}%)`;
const top = (list, n = 20) => { const m = new Map(); for (const s of list) m.set(s, (m.get(s) ?? 0) + 1); return [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([s, k]) => `${s}×${k}`).join(", "); };

md.push("# Edge-case fixes measured on Lindera WASM with UniDic 2.1.2", "", "Every fix is a pass over the text before the tokenizer or over its tokens after. The dictionary is not changed.");
const base = tokenizeWith(build());

// 1 + 2 + 3: filter, normalization, run merging
md.push("", "## Unknown content tokens after each fix", "", "Columns add one fix at a time: part of speech only, then the letter-or-digit filter, then half-width katakana normalization, then joined Latin and digit runs. The last column is full NFKC instead of the targeted normalization.");
const rows = [], leftover = [];
let mergedEx = [];
for (const [name, lines] of Object.entries(texts)) {
  const c = { pos: 0, posOov: 0, strict: 0, strictOov: 0, hwOov: 0, hw: 0, runs: 0, runsOov: 0, nfkcOov: 0, nfkc: 0, tokensBefore: 0, tokensAfter: 0 };
  for (const line of lines) {
    const raw = base(line);
    c.pos += raw.filter(contentPos).length; c.posOov += raw.filter((t) => contentPos(t) && t.oov).length;
    c.strict += raw.filter(contentStrict).length; c.strictOov += raw.filter((t) => contentStrict(t) && t.oov).length;
    const hw = normalizeHalfWidth(line);
    const hwToks = base(hw.norm).map(hw.toOriginal);
    assert(hwToks.every((t) => t.b < t.e && t.e <= line.length));
    c.hw += hwToks.filter(contentStrict).length; c.hwOov += hwToks.filter((t) => contentStrict(t) && t.oov).length;
    const merged = mergeRuns(hwToks);
    c.tokensBefore += hwToks.length; c.tokensAfter += merged.length;
    c.runs += merged.filter(contentStrict).length; c.runsOov += merged.filter((t) => contentStrict(t) && t.oov).length;
    leftover.push(...merged.filter((t) => contentStrict(t) && t.oov).map((t) => t.s));
    mergedEx.push(...merged.filter((t) => t.merged).map((t) => t.s));
    const fk = normalizeHalfWidth(line, true);
    const fkToks = base(fk.norm).map(fk.toOriginal);
    c.nfkc += fkToks.filter(contentStrict).length; c.nfkcOov += fkToks.filter((t) => contentStrict(t) && t.oov).length;
  }
  rows.push([name, lines.length, pct(c.posOov, c.pos), pct(c.strictOov, c.strict), pct(c.hwOov, c.hw), pct(c.runsOov, c.runs), c.tokensBefore - c.tokensAfter, pct(c.nfkcOov, c.nfkc)]);
}
table(["Text", "Lines", "Part of speech only", "+ letter or digit", "+ half-width katakana", "+ joined runs", "Tokens removed by joining", "Full NFKC, no joining"], rows);
md.push("### What is still unknown after all fixes", "", top(leftover, 60), "", "### Most frequent joined runs", "", top(mergedEx, 40));

// 4: user dictionary at scale
md.push("", "## User dictionary at 10,000 entries");
{
  const real = [...new Set(leftover.filter((s) => /^[\p{sc=Katakana}ー・]{3,}$|^[\p{sc=Han}]{2,}$/u.test(s)))];
  const kata = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワ";
  const synthetic = Array.from({ length: 10000 - Math.min(real.length, 10000) }, (_, i) => "ヴ" + [...String(i)].map((d) => kata[+d * 4 + (i % 4)]).join("") + "ヌス");
  const csv = [...real.slice(0, 10000), ...synthetic].map((s) => `${s},名詞,*`).join("\n") + "\n";
  const d0 = loadDict();
  const t0 = performance.now();
  L.loadUserDictionaryFromBytes(Buffer.from(csv), d0.metadata);
  const ms = Math.round(performance.now() - t0);
  const withUser = tokenizeWith(build(csv));
  let changed = 0, total = 0, oovBefore = 0, oovAfter = 0, userHits = 0;
  const samples = [];
  for (const [name, lines] of Object.entries(texts)) for (const line of lines) {
    total++;
    const a = base(line), b = withUser(line);
    oovBefore += a.filter((t) => contentStrict(t) && t.oov).length; oovAfter += b.filter((t) => contentStrict(t) && t.oov).length;
    userHits += b.filter((t) => t.user).length;
    if (a.map((t) => t.s).join("|") !== b.map((t) => t.s).join("|")) { changed++; if (samples.length < 400) samples.push([a.map((t) => t.s).join("·"), b.map((t) => (t.user ? `[${t.s}]` : t.s)).join("·")]); }
  }
  table(["Measure", "Value"], [
    ["Entries (unknown words from the texts, padded with synthetic names)", `${Math.min(real.length, 10000)} real + ${synthetic.length} synthetic`],
    ["Time to compile the CSV into a user dictionary, ms", ms], ["CSV size, KB", Math.round(csv.length * 3 / 1024)],
    ["Lines whose segmentation changed", `${changed} of ${total}`], ["Tokens from the user dictionary", userHits],
    ["Unknown content tokens before", oovBefore], ["Unknown content tokens after", oovAfter],
  ]);
  // lines where the change is not just "unknown pieces became one user token"
  const side = samples.filter(([a, b]) => a.replaceAll("·", "") === b.replace(/[\[\]·]/g, "")).slice(0, 12);
  md.push("Sample of changed lines (user-dictionary tokens in brackets):", "", ...side.map(([a, b]) => `- ${a}\n  - ${b}`));
}

// 5: supplementary colloquial dictionary
md.push("", "## Supplementary dictionary for colloquial forms");
{
  const entries = { "やべぇ": "やばい", "やべえ": "やばい", "やべー": "やばい", "ヤベ": "やばい", "あっぶね": "危ない", "あぶね": "危ない", "あぶねぇ": "危ない", "あかん": "あかん", "すげー": "凄い", "うめぇ": "旨い", "つえぇ": "強い", "こえぇ": "怖い" };
  const csv = Object.keys(entries).map((s) => `${s},形容詞,*`).join("\n") + "\n";
  const sup = tokenizeWith(build(csv));
  const cases = ["やべぇ、うるせぇよ。", "あっぶね、死ぬとこだった。", "ほんまに知らんで。あかんやろ。", "こいつ、つえぇな。", "すげーうめぇ！"];
  table(["Sentence", "Without", "With"], cases.map((s) => [s, base(s).map((t) => `${t.s}${t.oov ? "?" : ""}`).join(" "), sup(s).map((t) => (t.user ? `[${t.s} ⇒ ${entries[t.s]}]` : t.s)).join(" ")]));
  let changed = 0, total = 0;
  const hits = [], collateral = [];
  for (const [name, lines] of Object.entries(texts)) for (const line of lines) {
    total++;
    const a = base(line), b = sup(line);
    if (a.map((t) => t.s).join("|") === b.map((t) => t.s).join("|")) continue;
    changed++;
    hits.push(...b.filter((t) => t.user).map((t) => t.s));
    collateral.push(`${a.map((t) => t.s).join("·")} → ${b.map((t) => (t.user ? `[${t.s}]` : t.s)).join("·")}`);
  }
  md.push(`${changed} of ${total} lines changed. Entries that fired: ${top(hits, 20)}.`, "", "Every changed line, up to 40, so false hits are visible:", "", ...collateral.slice(0, 40).map((l) => `- ${l}`));
}

// Spaces inside a line (lyrics and subtitles use them between phrases)
md.push("", "## Spaces inside a line");
{
  const keys = (toks) => toks.filter((t) => t.s.trim()).map((t) => `${t.s}⇒${t.key}`);
  let withSpace = 0, splitDiff = 0, joinDiff = 0;
  const ex = [];
  for (const [name, lines] of Object.entries(texts)) for (const line of lines) {
    if (!/\S[ \u3000]+\S/.test(line)) continue;
    withSpace++;
    const whole = keys(base(line)).join(" ");
    const split = line.split(/[ \u3000]+/).flatMap((p) => keys(base(p))).join(" ");
    const joined = keys(base(line.replace(/[ \u3000]+/g, ""))).join(" ");
    if (whole !== split) { splitDiff++; if (ex.length < 400) ex.push([line, whole, split]); }
    if (whole !== joined) joinDiff++;
  }
  md.push(`${withSpace} lines contain a space between two phrases. Tokenizing each phrase separately changes the result in ${splitDiff} of them. Removing the spaces changes it in ${joinDiff}.`, "", "Every 20th line where separate phrases differ (whole line, then separate phrases; only the tokens that differ):", "");
  for (const [line, a, b] of ex.filter((_, i) => i % 20 === 0).slice(0, 20)) {
    const A = a.split(" "), B = new Set(b.split(" ")), A2 = new Set(A);
    md.push(`- ${line}\n  - whole: ${A.filter((k) => !B.has(k)).join(" ")}\n  - separate: ${b.split(" ").filter((k) => !A2.has(k)).join(" ")}`);
  }
}

// 6: N-best on kana-only words
md.push("", "## N-best on ambiguous kana");
{
  const tok = build();
  const cases = [
    ["あゆみの のろい ものはない", "のろい", "鈍い"], ["あゆみののろいものはない", "のろい", "鈍い"],
    ["もしもし かめよ かめさんよ", "かめ", "亀"], ["あかんやろ", "あかん", "あかん"],
    ["はしをわたる", "はし", "橋"], ["はしでたべる", "はし", "箸"], ["あめがふる", "あめ", "雨"], ["あめをなめる", "あめ", "飴"],
    ["ふくをきる", "きる", "着る"], ["かみをきる", "きる", "切る"], ["かみをきる", "かみ", "髪"], ["うちにかえる", "かえる", "帰る"],
    ["かえるがなく", "かえる", "蛙"], ["おかねがいる", "いる", "要る"], ["きょうはあつい", "あつい", "暑い"], ["このほんはあつい", "あつい", "厚い"],
    ["はながさく", "はな", "花"], ["はなをかむ", "はな", "鼻"], ["にわにはにわにわとりがいる", "にわとり", "鶏"], ["せかいのうちに おまえほど", "せかい", "世界"],
  ];
  let top1 = 0, top3 = 0;
  const rows = cases.map(([text, surface, want]) => {
    const paths = tok.tokenizeNbest(text, 3).map((p) => p.tokens.find((t) => t.surface.startsWith(surface) || surface.startsWith(t.surface) && t.surface.length > 1)).map((t) => (t ? `${t.surface}⇒${t.details[7]}` : "(cut differently)"));
    const hit = (p) => p.endsWith("⇒" + want);
    if (hit(paths[0])) top1++;
    if (paths.some(hit)) top3++;
    return [text, `${surface} = ${want}`, paths.join(" / "), hit(paths[0]) ? "yes" : "no", paths.some(hit) ? "yes" : "no"];
  });
  table(["Text", "Wanted", "Top 3 paths", "First path right", "Right within 3"], rows);
  md.push(`First path right: ${top1} of ${cases.length}. Right within three paths: ${top3} of ${cases.length}.`);
}

writeFileSync("results-fixes.md", md.join("\n") + "\n");
console.log("wrote results-fixes.md");
