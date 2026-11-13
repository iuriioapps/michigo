// Throwaway tokenizer spike. Usage:
//   node --expose-gc spike.mjs run <candidate>   -> out/<candidate>.json
//   node spike.mjs report                        -> results.md
import { readFileSync, writeFileSync, mkdirSync, promises } from "node:fs";
import assert from "node:assert";
import { fileURLToPath } from "node:url";

const CANDIDATES = (process.env.CANDS ?? "lindera-unidic,lindera-sudachidict,lindera-ipadic,kuromoji,sudachi-wasm").split(",");
const OUT = process.env.OUT ?? "out";
const TEXTS = (process.env.TEXTS ?? "subtitles,transcript,lyrics,lyrics-classic,prose,wiki-miku,wiki-danmachi").split(",");
const SKIP_POS = new Set(["助詞", "助動詞", "記号", "補助記号", "空白"]);

const HARD_CASES = [
  ["Rare compound", "封魔鉱を採掘する。"],
  ["Colloquial sound change", "すげぇな、お前。"],
  ["Colloquial sound change", "あっぶね、死ぬとこだった。"],
  ["Colloquial sound change", "やべぇ、うるせぇよ。"],
  ["Contraction とく", "先に言っとくけど、買っといて。"],
  ["Contraction ちゃう, てる", "忘れちゃった。見てる。食べなきゃ。"],
  ["Kansai-ben", "そうやけど、わからへん。"],
  ["Kansai-ben", "ほんまに知らんで。あかんやろ。"],
  ["Half-width katakana", "ｽｺﾞｲ ｶﾞﾝﾀﾞﾑ ﾊﾝｶｸ"],
  ["Spelling variants", "すごい人。凄い人。スゴイ人。"],
  ["Spelling variants", "出来る。できる。分かる。わかる。"],
  ["Spelling variants", "綺麗。きれい。キレイ。子供。子ども。"],
];

const utf16 = (line, byte) => Buffer.from(line).subarray(0, byte).toString().length;
const star = (v, fallback) => (v && v !== "*" ? v : fallback);

async function loadLindera(dictName, { nfkc = false, userCsv } = {}) {
  const L = await import("lindera-wasm");
  await L.default({ module_or_path: readFileSync("node_modules/lindera-wasm/lindera_wasm_bg.wasm") });
  const f = (n) => readFileSync(`dicts/lindera-${dictName}/${n}`);
  const dict = L.loadDictionaryFromBytes(f("metadata.json"), f("dict.trie"), f("dict.valsidx"), f("dict.vals"), f("dict.wordsidx"), f("dict.words"), f("matrix.mtx"), f("char_def.bin"), f("unk.bin"));
  // metadata must be read before the builder takes the dictionary, or the handle is a null pointer
  const user = userCsv && L.loadUserDictionaryFromBytes(Buffer.from(userCsv), dict.metadata);
  const b = new L.TokenizerBuilder();
  b.setDictionaryInstance(dict);
  b.setMode("normal");
  if (nfkc) b.appendCharacterFilter("unicode_normalize", { kind: "nfkc" });
  if (user) b.setUserDictionaryInstance(user);
  const tok = b.build();
  const map = {
    ipadic: (d, s) => ({ pos: d[0], lemma: star(d[6], s), reading: star(d[7], ""), group: star(d[6], s) }),
    // group = 語彙素 + 語彙素読み; lemma = 書字形基本形
    unidic: (d, s) => ({ pos: d[0], lemma: star(d[10], s), reading: star(d[9], ""), group: d[7] && d[7] !== "*" ? `${d[7]}(${d[6]})` : s }),
    // SudachiDict in Lindera has no dictionary form string, only an id (d[9])
    sudachidict: (d, s) => ({ pos: d[1], lemma: star(d[8], s), reading: star(d[7], ""), group: star(d[8], s) }),
  }[dictName];
  return (line) =>
    tok.tokenize(line).map((t) => {
      const b = utf16(line, t.byteStart), e = utf16(line, t.byteEnd);
      return { s: t.surface, b, e, oov: t.isUnknown, ...map(t.details, t.surface) };
    });
}

async function loadNative(dir) {
  const { createRequire } = await import("node:module");
  const { TokenizerBuilder } = createRequire(import.meta.url)("lindera");
  const b = new TokenizerBuilder();
  b.setDictionary(fileURLToPath(new URL(dir, import.meta.url)));
  b.setMode("normal");
  const tok = b.build();
  return (line) =>
    tok.tokenize(line).map((t) => {
      const d = t.details, s = t.surface;
      return { s, b: utf16(line, t.byteStart), e: utf16(line, t.byteEnd), oov: t.isUnknown, pos: d[0], lemma: star(d[10], s), reading: star(d[9], ""), group: d[7] && d[7] !== "*" ? `${d[7]}(${d[6]})` : s };
    });
}

const loaders = {
  "lindera-unidic": () => loadLindera("unidic"),
  "lindera-sudachidict": () => loadLindera("sudachidict"),
  "lindera-ipadic": () => loadLindera("ipadic"),
  // Native napi binding: same engine, dictionary loaded by path
  "lindera-native-unidic": () => loadNative("dicts/lindera-unidic"),
  "lindera-native-unidic2023": () => loadNative("unidic-new/cwj-out"),
  "lindera-native-unidic-csj": () => loadNative("unidic-new/csj-out"),
  kuromoji: async () => {
    const k = await import("@patdx/kuromoji");
    const { default: Loader } = await import("@patdx/kuromoji/node");
    const tok = await new k.TokenizerBuilder({ loader: new Loader({ dic_path: "node_modules/@patdx/kuromoji/dict/" }) }).build();
    return (line) =>
      tok.tokenize(line).map((t) => ({
        s: t.surface_form, b: t.word_position - 1, e: t.word_position - 1 + t.surface_form.length, oov: t.word_type === "UNKNOWN",
        pos: t.pos, lemma: star(t.basic_form, t.surface_form), reading: t.reading ?? "", group: star(t.basic_form, t.surface_form),
      }));
  },
  "sudachi-wasm": async () => {
    const { SudachiStateless, TokenizeMode } = await import("sudachi-wasm333");
    const s = new SudachiStateless();
    await s.initialize_node(promises.readFile);
    return (line) =>
      s.tokenize_raw(line, TokenizeMode.C).map((t) => ({
        s: t.surface, b: utf16(line, t.begin), e: utf16(line, t.end), oov: t.oov,
        pos: t.poses[0], lemma: t.dictionary_form, reading: t.reading_form, group: t.normalized_form,
      }));
  },
};

// NFKC in JS with a map back to the original: cluster = code point plus following marks (ｶﾞ is two code points).
function nfkcWithMap(line) {
  let norm = "";
  const start = [], end = [];
  for (const m of line.matchAll(/.[\p{M}\uFF9E\uFF9F]*/gsu)) {
    const n = m[0].normalize("NFKC");
    for (let i = 0; i < n.length; i++) start.push(m.index), end.push(m.index + m[0].length);
    norm += n;
  }
  return { norm, toOriginal: (t) => ({ ...t, b: start[t.b], e: end[t.e - 1] }) };
}
{
  const { norm, toOriginal } = nfkcWithMap("ｶﾞﾝﾀﾞﾑ①㍍");
  assert.equal(norm, "ガンダム1メートル");
  assert.deepEqual(toOriginal({ b: 0, e: 4 }), { b: 0, e: 6 });
  assert.deepEqual(toOriginal({ b: 5, e: 9 }), { b: 7, e: 8 });
}

const rssMb = () => (globalThis.gc?.(), Math.round(process.memoryUsage().rss / 1048576));
const offsetsOk = (line, toks) => toks.every((t) => line.slice(t.b, t.e) === t.s);

async function run(name) {
  const rss0 = rssMb();
  const t0 = performance.now();
  const tokenize = await loaders[name]();
  tokenize("準備"); // first call included in startup
  const loadMs = Math.round(performance.now() - t0);
  const out = { name, node: process.version, loadMs, rssBeforeMb: rss0, rssAfterLoadMb: rssMb(), hard: [], texts: {}, extra: {} };

  for (const [label, text] of HARD_CASES) {
    const toks = tokenize(text);
    out.hard.push({ label, text, toks, offsetsOk: offsetsOk(text, toks) });
  }
  let n = 0;
  const t1 = performance.now();
  for (const tx of TEXTS) {
    const lines = readFileSync(`texts/${tx}.txt`, "utf8").split("\n").filter(Boolean);
    out.texts[tx] = lines.map((line) => {
      const toks = tokenize(line);
      n += toks.length;
      if (!offsetsOk(line, toks)) {
        // kuromoji reports a wrong word_position after an unknown token that ends in 、; rebuild from surface lengths
        out.badOffsetLines = (out.badOffsetLines ?? 0) + 1;
        assert.equal(toks.map((t) => t.s).join(""), line);
        let at = 0;
        for (const t of toks) (t.b = at), (t.e = at += t.s.length);
      }
      return toks;
    });
  }
  out.tokensPerSec = Math.round(n / ((performance.now() - t1) / 1000));
  out.rssAfterRunMb = rssMb();

  // Normalization done by the caller, not the engine
  {
    const viaJs = (line) => { const { norm, toOriginal } = nfkcWithMap(line); return tokenize(norm).map(toOriginal); };
    const hw = "ｽｺﾞｲ ｶﾞﾝﾀﾞﾑ ﾊﾝｶｸ。ＡＢＣ１２３！";
    const toks = viaJs(hw);
    const subs = readFileSync(`texts/${TEXTS[0]}.txt`, "utf8").split("\n").filter(Boolean);
    const count = (fn) => subs.flatMap(fn).filter((t) => t.oov && !SKIP_POS.has(t.pos) && t.s.trim()).length;
    out.extra.jsNfkc = { text: hw, toks, spansOk: toks.every((t) => hw.slice(t.b, t.e).normalize("NFKC") === t.s), subsOovRaw: count(tokenize), subsOovNfkc: count(viaJs) };
  }
  if (name.startsWith("lindera-") && !name.includes("native")) {
    const dictName = name.slice(8);
    const hw = "ｽｺﾞｲ ｶﾞﾝﾀﾞﾑ ﾊﾝｶｸ。①㍍ＡＢＣ";
    try {
      const toks = (await loadLindera(dictName, { nfkc: true }))(hw);
      out.extra.nfkc = { text: hw, toks, offsetsOk: offsetsOk(hw, toks), spansOk: toks.every((t) => hw.slice(t.b, t.e).normalize("NFKC") === t.s.normalize("NFKC")) };
    } catch (e) { out.extra.nfkc = { error: String(e) }; }
    try {
      const text = "封魔鉱を採掘する。";
      out.extra.userDict = { text, toks: (await loadLindera(dictName, { userCsv: "封魔鉱,名詞,フウマコウ\n" }))(text) };
    } catch (e) { out.extra.userDict = { error: String(e) }; }
  }
  if (name === "sudachi-wasm") {
    const { SudachiStateless, TokenizeMode } = await import("sudachi-wasm333");
    const s = new SudachiStateless();
    await s.initialize_node(promises.readFile);
    out.extra.modeA = ["封魔鉱を採掘する。", "選挙管理委員会"].map((text) => ({ text, a: s.tokenize_raw(text, TokenizeMode.A).map((t) => t.surface), c: s.tokenize_raw(text, TokenizeMode.C).map((t) => t.surface) }));
  }
  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/${name}.json`, JSON.stringify(out));
  console.log(name, { loadMs, rss: out.rssAfterLoadMb, tps: out.tokensPerSec });
}

// ---------- report ----------

const show = (toks) => toks.filter((t) => t.s.trim()).map((t) => `${t.s}${t.oov ? "?" : ""}[${t.lemma}${t.group !== t.lemma ? " ⇒ " + t.group : ""}]`).join(" ");
const content = (t) => !SKIP_POS.has(t.pos) && t.s.trim() !== "";
const real = (toks) => toks.filter((t) => t.e > t.b); // sudachi-wasm emits zero-width tokens where NFKC expands a character
const bounds = (toks) => new Set(toks.flatMap((t) => [t.b, t.e]));

// Maximal spans between boundaries that every candidate shares, where at least one candidate cuts differently.
function regions(lineToks) {
  const sets = lineToks.map(bounds);
  const common = [...sets[0]].filter((b) => sets.every((s) => s.has(b))).sort((a, b) => a - b);
  const res = [];
  for (let i = 0; i + 1 < common.length; i++) {
    const [b, e] = [common[i], common[i + 1]];
    const segs = lineToks.map((toks) => toks.filter((t) => t.b >= b && t.e <= e));
    if (segs.some((s) => s.length !== 1)) res.push({ b, e, segs });
    else res.push({ b, e, segs, same: true });
  }
  return res;
}

function report() {
  const R = Object.fromEntries(CANDIDATES.map((c) => [c, JSON.parse(readFileSync(`${OUT}/${c}.json`, "utf8"))]));
  const md = [];
  const table = (head, rows) => md.push("", `| ${head.join(" | ")} |`, `| ${head.map(() => "---").join(" | ")} |`, ...rows.map((r) => `| ${r.join(" | ")} |`), "");

  md.push(`# Tokenizer spike: measured output`, "", `Node ${R[CANDIDATES[0]].node}, macOS arm64. Token notation: \`surface[lemma ⇒ grouping key]\`. The grouping key appears only when it differs from the lemma. A \`?\` after the surface marks an unknown word.`);

  md.push("", "## Startup, memory and speed");
  table(["Candidate", "Starts under Node 24", "Startup ms", "RSS after load MB", "RSS after run MB", "Tokens per second"], CANDIDATES.map((c) => [c, "yes", R[c].loadMs, R[c].rssAfterLoadMb, R[c].rssAfterRunMb, R[c].tokensPerSec]));

  md.push("## Hard cases");
  HARD_CASES.forEach(([label, text], i) => {
    md.push("", `### ${label}: ${text}`);
    table(["Candidate", "Tokens"], CANDIDATES.map((c) => [c, show(R[c].hard[i].toks)]));
  });

  md.push("## Offsets");
  table(["Candidate", "Hard-case offsets slice back to the surface", "Output with the engine `unicode_normalize` filter", "Surfaces equal the original slice"], CANDIDATES.map((c) => {
    const n = R[c].extra.nfkc;
    return [c, R[c].hard.every((h) => h.offsetsOk) ? "yes" : "no", n ? (n.error ?? show(n.toks)) : "n/a", n?.toks ? (n.offsetsOk ? "yes" : "no") : "n/a"];
  }));
  md.push("Lines in the seven texts where raw offsets did not slice back to the surface (no normalization applied):");
  table(["Candidate", "Lines with wrong offsets"], CANDIDATES.map((c) => [c, R[c].badOffsetLines ?? 0]));

  md.push("", "## NFKC applied in JavaScript before tokenizing", "", "Offsets are mapped back with a per-cluster index table. Unknown counts are content tokens in the first text.");
  table(["Candidate", "Tokens", "Mapped spans point at the original", "Subtitle unknowns raw", "Subtitle unknowns after NFKC"], CANDIDATES.map((c) => { const j = R[c].extra.jsNfkc; return [c, show(j.toks), j.spansOk ? "yes" : "no", j.subsOovRaw, j.subsOovNfkc]; }));
  md.push("", "## User dictionary for 封魔鉱 (Lindera only)");
  table(["Candidate", "Tokens with a one-line user dictionary"], CANDIDATES.filter((c) => R[c].extra.userDict).map((c) => [c, R[c].extra.userDict.error ?? show(R[c].extra.userDict.toks)]));
  if (R["sudachi-wasm"]) {
    md.push("## Sudachi split modes (sudachi-wasm only)");
    table(["Text", "Mode A", "Mode C"], R["sudachi-wasm"].extra.modeA.map((m) => [m.text, m.a.join(" / "), m.c.join(" / ")]));
  }

  for (const tx of TEXTS) {
    md.push(`## Text: ${tx}`);
    const per = CANDIDATES.map((c) => R[c].texts[tx].map(real));
    table(["Candidate", "Tokens", "Content tokens", "Unknown content tokens", "Unique lemmas", "Unique grouping keys", "Keys that merge 2+ lemma spellings"], CANDIDATES.map((c, i) => {
      const toks = per[i].flat().filter(content);
      const groups = new Map();
      for (const t of toks) groups.set(t.group, (groups.get(t.group) ?? new Set()).add(t.lemma));
      return [c, per[i].flat().length, toks.length, toks.filter((t) => t.oov).length, new Set(toks.map((t) => t.lemma)).size, groups.size, [...groups.values()].filter((s) => s.size > 1).length];
    }));

    md.push("### Merged spellings (up to 12 per candidate)");
    table(["Candidate", "Examples"], CANDIDATES.map((c, i) => {
      const groups = new Map();
      for (const t of per[i].flat().filter(content)) groups.set(t.group, (groups.get(t.group) ?? new Set()).add(t.lemma));
      return [c, [...groups].filter(([, s]) => s.size > 1).slice(0, 12).map(([g, s]) => `${g}: ${[...s].join(", ")}`).join("; ") || "none"];
    }));

    md.push("### Unknown words (up to 25 per candidate)");
    table(["Candidate", "Unknown surfaces"], CANDIDATES.map((c, i) => [c, [...new Set(per[i].flat().filter((t) => t.oov && content(t)).map((t) => t.s))].slice(0, 25).join(", ") || "none"]));

    // segmentation
    const lines = per[0].length;
    let chars = 0, diffChars = 0;
    const diff = new Map(), lemmaDiff = new Map();
    let sameSpan = 0, lemmaDisagree = 0;
    const pair = CANDIDATES.map(() => CANDIDATES.map(() => 0));
    for (let l = 0; l < lines; l++) {
      const lt = per.map((p) => p[l]);
      for (const r of regions(lt)) {
        const text = r.segs[0].map((t) => t.s).join("");
        if (!text.trim()) continue;
        chars += r.e - r.b;
        if (r.same) {
          if (!r.segs.every(([t]) => content(t))) continue;
          sameSpan++;
          const lemmas = r.segs.map(([t]) => t.lemma);
          if (new Set(lemmas).size > 1) {
            lemmaDisagree++;
            const key = lemmas.join(" / ");
            lemmaDiff.set(key, (lemmaDiff.get(key) ?? 0) + 1);
          }
        } else {
          diffChars += r.e - r.b;
          const cuts = r.segs.map((s) => s.map((t) => t.s).join("·"));
          const key = cuts.join(" / ");
          diff.set(key, (diff.get(key) ?? 0) + 1);
          for (let a = 0; a < cuts.length; a++) for (let b = a + 1; b < cuts.length; b++) if (cuts[a] !== cuts[b]) pair[a][b]++;
        }
      }
    }
    md.push("### Segmentation disagreement", "", `${[...diff.values()].reduce((a, b) => a + b, 0)} regions where at least one candidate cuts differently, covering ${diffChars} of ${chars} characters (${((100 * diffChars) / chars).toFixed(1)}%).`, "", "Regions where the pair cuts differently:");
    table(["", ...CANDIDATES.slice(1)], CANDIDATES.slice(0, -1).map((c, a) => [c, ...CANDIDATES.slice(1).map((_, b) => (b + 1 > a ? pair[a][b + 1] : ""))]));
    md.push(`Most frequent regions, in the order ${CANDIDATES.join(" / ")}:`, "");
    for (const [k, n] of [...diff].sort((a, b) => b[1] - a[1]).slice(0, 25)) md.push(`- ${n}× ${k}`);

    md.push("", "### Lemma disagreement on identical spans", "", `${sameSpan} content tokens have the same span in all candidates. The lemma string differs in ${lemmaDisagree} of them (${((100 * lemmaDisagree) / sameSpan).toFixed(1)}%).`, "", `Most frequent, in the order ${CANDIDATES.join(" / ")}:`, "");
    for (const [k, n] of [...lemmaDiff].sort((a, b) => b[1] - a[1]).slice(0, 25)) md.push(`- ${n}× ${k}`);
    md.push("");
  }
  writeFileSync(process.env.RESULTS ?? "results.md", md.join("\n"));
  console.log("wrote results.md", md.length, "lines");
}

const [mode, arg] = process.argv.slice(2);
if (mode === "run") await run(arg);
else report();
