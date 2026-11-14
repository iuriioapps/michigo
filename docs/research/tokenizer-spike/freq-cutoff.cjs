// What does "mark the N most frequent words Known" do to words from UniDic 2025.12? Usage: node freq-cutoff.cjs <Jiten global CSV> > results-freq-cutoff.md
const { readFileSync, readdirSync } = require("node:fs");
const assert = require("node:assert");
const { TokenizerBuilder } = require("lindera");
const b = new TokenizerBuilder(); b.setDictionary(`${__dirname}/dicts/lindera-unidic202512`); b.setMode("normal");
const tok = b.build();
const hira = (s) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
assert.equal(hira("ミンナ"), "みんな");

// Words of the corpus: one per lexeme plus lexeme reading, with every Spelling (dictionary form as written) and its kana reading
const FUNCTION_POS = new Set(["助詞", "助動詞", "記号", "補助記号", "空白"]);
const words = new Map();
let tokens = 0, contentTokens = 0;
for (const f of readdirSync(`${__dirname}/texts`)) for (const line of readFileSync(`${__dirname}/texts/${f}`, "utf8").split("\n")) for (const t of tok.tokenize(line)) {
  const d = t.details;
  if (t.isUnknown || !d[7] || d[7] === "*" || !/[\p{sc=Han}\p{sc=Hiragana}\p{sc=Katakana}]/u.test(t.surface) || d[0] === "記号" || d[0] === "補助記号") continue;
  tokens++;
  const content = !FUNCTION_POS.has(d[0]);
  if (content) contentTokens++;
  const key = `${d[7]}\t${d[6]}`;
  const w = words.get(key) ?? { key, n: 0, content, spellings: new Set(), bare: new Set() };
  w.n++; w.spellings.add(`${d[10]}\t${hira(d[21] ?? "")}`); w.bare.add(d[10]);
  words.set(key, w);
}
const index = (pick) => { const m = new Map(); for (const w of words.values()) for (const s of w[pick]) m.set(s, [...(m.get(s) ?? []), w]); return m; };
const bySpelling = index("spellings"), byBare = index("bare");

const rows = readFileSync(process.argv[2], "utf8").split("\n").slice(1).filter(Boolean).map((l) => { const [word, form, rank] = l.split(","); return { word, form: hira(form), rank: +rank }; }); // Jiten writes the reading of a katakana word in katakana
console.log(`# Frequency cutoff against words from UniDic 2025.12\n\nCorpus: ${tokens} word tokens (${contentTokens} without particles and auxiliaries), ${words.size} words. Jiten global list: ${rows.length} rows.\n`);
console.log("A Jiten row matches a word when the row's spelling and reading equal one Spelling of the word and its kana reading. The loose match compares the spelling only.\n");
console.log("| Cutoff (Jiten rank) | Rows | Rows that match a corpus word | Rows that match several words | Words marked | Share of corpus words | Share of corpus tokens | Words marked, loose match | Share of tokens, loose |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |");
const pct = (a, n) => `${(100 * a / n).toFixed(1)}%`;
for (const cut of [500, 1000, 2000, 5000, 10000, 20000]) {
  const top = rows.filter((r) => r.rank <= cut);
  const marked = new Set(), loose = new Set();
  let matched = 0, several = 0;
  for (const r of top) {
    const hit = bySpelling.get(`${r.word}\t${r.form}`) ?? [];
    if (hit.length) matched++;
    if (hit.length > 1) several++;
    for (const w of hit) marked.add(w);
    for (const w of byBare.get(r.word) ?? []) loose.add(w);
  }
  const share = (set) => pct([...set].reduce((a, w) => a + w.n, 0), tokens);
  console.log(`| ${cut} | ${top.length} | ${matched} | ${several} | ${marked.size} | ${pct(marked.size, words.size)} | ${share(marked)} | ${loose.size} | ${share(loose)} |`);
}

// The frequent corpus words that no Jiten row reaches with the strict match, to see why
const ranked = new Set(); for (const r of rows) for (const w of bySpelling.get(`${r.word}\t${r.form}`) ?? []) ranked.add(w);
const missed = [...words.values()].filter((w) => !ranked.has(w)).sort((a, c) => c.n - a.n);
console.log(`\n## Corpus words with no rank\n\n${missed.length} of ${words.size} words match no Jiten row at any rank (${pct(missed.reduce((a, w) => a + w.n, 0), tokens)} of tokens). The 40 most frequent, as lexeme, lexeme reading, then each Spelling with its reading:\n`);
for (const w of missed.slice(0, 40)) console.log(`- ${w.n}: ${w.key.replace("\t", " ")} (${[...w.spellings].map((s) => s.replace("\t", " ")).join(", ")})`);
const sev = rows.filter((r) => r.rank <= 5000 && (bySpelling.get(`${r.word}\t${r.form}`) ?? []).length > 1).slice(0, 15);
console.log(`\n## Rows that match several words\n\nFirst 15 within rank 5000:\n`);
for (const r of sev) console.log(`- ${r.rank} ${r.word} (${r.form}): ${bySpelling.get(`${r.word}\t${r.form}`).map((w) => w.key.replace("\t", " ")).join(" / ")}`);
