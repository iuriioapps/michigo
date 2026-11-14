// Half-width katakana on UniDic 2025.12 (native binding). The corpus has no such line, so this writes the katakana of real lines in half width first.
// Usage: node halfwidth-202512.cjs > results-halfwidth-202512.md
const { readFileSync, readdirSync } = require("node:fs");
const assert = require("node:assert");
const { TokenizerBuilder } = require("lindera");
const b = new TokenizerBuilder(); b.setDictionary(`${__dirname}/dicts/lindera-unidic202512`); b.setMode("normal");
const t = b.build();
// full width -> half width, built from the NFKC table itself
const toHalf = new Map();
for (let c = 0xff66; c <= 0xff9d; c++) { const h = String.fromCharCode(c); toHalf.set(h.normalize("NFKC"), h); for (const m of ["ﾞ", "ﾟ"]) { const f = (h + m).normalize("NFKC"); if (f.length === 1) toHalf.set(f, h + m); } }
const half = (s) => s.replace(/[ァ-ヺー]/g, (c) => toHalf.get(c) ?? c);
const full = (s) => s.replace(/[ｦ-ﾟ]+/g, (m) => m.normalize("NFKC"));
assert.equal(half("チョコミントとバカ"), "ﾁｮｺﾐﾝﾄとﾊﾞｶ");
assert.equal(full("ﾁｮｺﾐﾝﾄとﾊﾞｶ！　１２ＡＢ"), "チョコミントとバカ！　１２ＡＢ");

const JP = /[ぁ-ゖァ-ヺー一-鿿々ｦ-ﾟ]/;
const toks = (s) => t.tokenize(s).filter((x) => JP.test(x.surface)).map((x) => ({ oov: x.isUnknown, k: `${x.surface}⇒${x.isUnknown ? "?" : `${x.details[7]}(${x.details[6]})`}` }));
const lines = readdirSync(`${__dirname}/texts`).flatMap((f) => readFileSync(`${__dirname}/texts/${f}`, "utf8").split("\n").filter(Boolean)).filter((l) => /[ァ-ヺ]{2}/.test(l));
let orig = 0, origOov = 0, asWritten = 0, asWrittenOov = 0, same = 0, changedLines = 0; const examples = [];
for (const line of lines) {
  const o = toks(line), h = toks(half(line)), back = toks(full(half(line)));
  orig += o.length; origOov += o.filter((x) => x.oov).length;
  asWritten += h.length; asWrittenOov += h.filter((x) => x.oov).length;
  if (o.map((x) => x.k).join("·") === back.map((x) => x.k).join("·")) same++;
  if (o.length !== h.length || o.some((x, i) => x.oov !== h[i].oov)) { changedLines++; if (line.length < 25 && examples.length < 6 && changedLines % 300 === 1) examples.push(`- ${half(line)}\n  - as written: ${h.map((x) => x.k).join(" ")}\n  - converted: ${back.map((x) => x.k).join(" ")}`); }
}
console.log(`# Half-width katakana on UniDic 2025.12\n\nThe corpus has no line in half-width katakana. This test takes the ${lines.length} lines that hold a katakana run and writes their katakana in half width.\n\n| Measure | Value |\n| --- | --- |\n| Tokens with Japanese script, original lines | ${orig} |\n| Unknown among them | ${origOov} |\n| Tokens, half-width lines as written | ${asWritten} |\n| Unknown among them | ${asWrittenOov} |\n| Lines where half width changes the cut or the unknown flags | ${changedLines} |\n| Lines where the conversion back to full width gives the original tokens | ${same} of ${lines.length} |\n\n## Examples\n\n${examples.join("\n")}`);
