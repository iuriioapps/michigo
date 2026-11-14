// Can JMnedict tell names from words? Checked against UniDic 2025.12 tokens. Usage: node names-202512.cjs <unpacked JMnedict Yomitan folder> > results-names-202512.md
const { readFileSync, readdirSync } = require("node:fs");
const { TokenizerBuilder } = require("lindera");
const b = new TokenizerBuilder(); b.setDictionary(`${__dirname}/dicts/lindera-unidic202512`); b.setMode("normal");
const t = b.build();
const JP = /[ぁ-ゖァ-ヺー一-鿿々]/, KATA = /^[ァ-ヺー]+$/;
const PERSON = /\b(surname|given|fem|masc|person|char)\b/;
const dir = process.argv[2];
const any = new Set(), person = new Set();
for (const f of readdirSync(dir).filter((f) => f.startsWith("term_bank"))) for (const [term, , tags] of JSON.parse(readFileSync(`${dir}/${f}`, "utf8"))) { any.add(term); if (PERSON.test(tags)) person.add(term); }

const lines = readdirSync(`${__dirname}/texts`).flatMap((f) => readFileSync(`${__dirname}/texts/${f}`, "utf8").split("\n").filter(Boolean));
// group: distinct surface -> token count
const groups = { "UniDic person name": new Map(), "Common noun (名詞,普通名詞)": new Map(), "Verb, adjective or adverb": new Map(), "Unknown katakana": new Map(), "Unknown, other script": new Map() };
const tally = (m, k) => m.set(k, (m.get(k) ?? 0) + 1);
for (const line of lines) for (const x of t.tokenize(line)) {
  if (!JP.test(x.surface)) continue;
  const pos = x.details.slice(0, 3).join(",");
  if (x.isUnknown) tally(groups[KATA.test(x.surface) ? "Unknown katakana" : "Unknown, other script"], x.surface);
  else if (pos === "名詞,固有名詞,人名") tally(groups["UniDic person name"], x.surface);
  else if (pos.startsWith("名詞,普通名詞")) tally(groups["Common noun (名詞,普通名詞)"], x.surface);
  else if (/^(動詞|形容詞|副詞)/.test(pos)) tally(groups["Verb, adjective or adverb"], x.details[7] === "*" ? x.surface : x.details[10] ?? x.surface);
}
const pct = (a, n) => `${a} (${((100 * a) / n).toFixed(1)}%)`;
console.log(`# JMnedict as a name signal on UniDic 2025.12\n\nJMnedict: ${any.size} distinct terms, ${person.size} with a person tag (surname, given, fem, masc, person, char).\n\n| Group of tokens | Distinct forms | In JMnedict | With a person tag | Tokens | Tokens with a person tag |\n| --- | --- | --- | --- | --- | --- |`);
for (const [name, m] of Object.entries(groups)) {
  const ks = [...m.keys()], tok = [...m.values()].reduce((a, c) => a + c, 0);
  const pt = ks.filter((k) => person.has(k));
  console.log(`| ${name} | ${ks.length} | ${pct(ks.filter((k) => any.has(k)).length, ks.length)} | ${pct(pt.length, ks.length)} | ${tok} | ${pct(pt.reduce((a, k) => a + m.get(k), 0), tok)} |`);
}
const top = (m, keep, n) => [...m].filter(([k]) => keep(k)).sort((a, c) => c[1] - a[1]).slice(0, n).map(([k, v]) => `${k}×${v}`).join(", ");
console.log(`\n## Common nouns that JMnedict lists as a person name\n\n${top(groups["Common noun (名詞,普通名詞)"], (k) => person.has(k), 60)}`);
console.log(`\n## Verbs, adjectives and adverbs that JMnedict lists as a person name\n\n${top(groups["Verb, adjective or adverb"], (k) => person.has(k), 40)}`);
console.log(`\n## UniDic person names that JMnedict does not list as a person\n\n${top(groups["UniDic person name"], (k) => !person.has(k), 60)}`);
console.log(`\n## Unknown katakana that JMnedict lists as a person name\n\n${top(groups["Unknown katakana"], (k) => person.has(k), 40)}`);
console.log(`\n## Unknown katakana that JMnedict does not list at all\n\n${top(groups["Unknown katakana"], (k) => !any.has(k), 40)}`);
