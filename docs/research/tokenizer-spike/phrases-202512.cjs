// Phrase split, half-width katakana and name tags on UniDic 2025.12 (native binding). Usage: node phrases-202512.cjs > results-phrases-202512.md
const { readFileSync, readdirSync } = require("node:fs");
const assert = require("node:assert");
const { TokenizerBuilder } = require("lindera");
const b = new TokenizerBuilder(); b.setDictionary(`${__dirname}/dicts/lindera-unidic202512`); b.setMode("normal");
const t = b.build();
const JP = /[ぁ-ゖァ-ヺー一-鿿々]/;
// surface⇒lexeme(reading) for every token that holds Japanese script
const toks = (s) => t.tokenize(s).filter((x) => JP.test(x.surface)).map((x) => ({ s: x.surface, oov: x.isUnknown, pos: x.details.slice(0, 3).join(","), k: `${x.surface}⇒${x.isUnknown ? "?" : `${x.details[7]}(${x.details[6]})`}` }));
const halfToFull = (s) => s.replace(/[ｦ-ﾟ]+/g, (m) => m.normalize("NFKC"));
assert.equal(halfToFull("ﾊﾞｶ！ １２"), "バカ！ １２");

const lines = readdirSync(`${__dirname}/texts`).flatMap((f) => readFileSync(`${__dirname}/texts/${f}`, "utf8").split("\n").filter(Boolean));

// Phrase split
const SPACE = /[ 　]+/;
let withSpace = 0; const changed = [];
for (const line of lines) {
  const phrases = line.trim().split(SPACE).filter(Boolean);
  if (phrases.length < 2) continue;
  withSpace++;
  const whole = toks(line).map((x) => x.k), parts = phrases.flatMap((p) => toks(p).map((x) => x.k));
  if (whole.join("·") === parts.join("·")) continue;
  const w = whole.filter((k) => !parts.includes(k)), p = parts.filter((k) => !whole.includes(k));
  changed.push(`- ${line}\n  - whole: ${w.join(" ")}\n  - separate: ${p.join(" ")}`);
}
console.log(`# Phrase split, half-width katakana and name tags on UniDic 2025.12\n\n## Phrase split\n\n${lines.length} lines. ${withSpace} contain a space between two phrases. Tokenizing each phrase alone changes the tokens with Japanese script in ${changed.length} of them.\n`);
const step = Math.floor(changed.length / 40);
console.log(`### Every ${step}th changed line\n\n${changed.filter((_, i) => i % step === 0).join("\n")}\n`);

// Half-width katakana
const HALF = /[ｦ-ﾟ]/;
const half = lines.filter((l) => HALF.test(l));
const oov = (ls) => ls.reduce((a, l) => a + toks(l).filter((x) => x.oov).length, 0);
console.log(`## Half-width katakana\n\n${half.length} lines hold half-width katakana. Unknown tokens in them: ${oov(half)} as written, ${oov(half.map(halfToFull))} after conversion to full width.\n`);

// Name tags
const tally = (m, k) => m.set(k, (m.get(k) ?? 0) + 1);
const tags = new Map(), names = new Map();
let all = 0;
for (const line of lines) for (const x of toks(line)) {
  all++;
  if (!x.pos.startsWith("名詞,固有名詞")) continue;
  tally(tags, x.pos);
  if (x.pos.endsWith("人名")) tally(names, x.s);
}
const top = (m, n) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k}×${v}`).join(", ");
// seeded sample over distinct names, so the rare ones show too
function sample(m, n) { let x = 42; const ks = [...m.keys()]; const out = []; while (out.length < n && ks.length) { x = (x * 1103515245 + 12345) % 2147483648; out.push(ks.splice(x % ks.length, 1)[0]); } return out.join(", "); }
console.log(`## Proper noun tags\n\n${all} tokens with Japanese script.\n\n| Tag | Tokens |\n| --- | --- |\n${[...tags].sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join("\n")}\n`);
console.log(`### Person names\n\n${names.size} distinct surfaces.\n\nMost frequent: ${top(names, 60)}\n\nSeeded sample of distinct surfaces: ${sample(names, 80)}`);
