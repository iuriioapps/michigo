// What an accent table taken from the UniDic lexicon (dictionary form spelling + kana reading -> accent values) would cover.
// Usage: node accent-table.cjs <spike dir> <unidic lex.csv> <jmdict dir>
const { readFileSync, readdirSync, createReadStream } = require("node:fs");
const readline = require("node:readline"), zlib = require("node:zlib");
const [spike, lex, jm] = process.argv.slice(2);
const kata = (s) => s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
const KANAONLY = /^[ぁ-ゖァ-ヺー]+$/, JP = /[ぁ-ゖァ-ヺー一-鿿々]/;
const pct = (a, n) => `${((100 * a) / n).toFixed(1)}%`;
const split = (l) => { const o = []; let c = "", q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === "," && !q) { o.push(c); c = ""; } else c += ch; } o.push(c); return o; };
(async () => {
  const table = new Map(); let rows = 0, baseRows = 0;
  for await (const l of readline.createInterface({ input: createReadStream(lex) })) { rows++; const f = split(l); const orth = f[14], kana = f[25], a = f[28], pos = f[4];
    if (!orth || !JP.test(orth)) continue; const k = `${orth}\t${kana}`; const e = table.get(k) ?? table.set(k, { vals: new Set(), pos: new Set() }).get(k); e.pos.add(pos); if (a && a !== "*") e.vals.add(a); }
  const keys = [...table], withVal = keys.filter(([, e]) => e.vals.size), multi = withVal.filter(([, e]) => e.vals.size > 1);
  const tsv = withVal.map(([k, e]) => `${k}\t${[...e.vals].join("|")}`).join("\n");
  console.log(`## Table\n\nLexicon rows ${rows}. Distinct pairs of dictionary-form spelling and kana reading: ${keys.length}. With an accent value: ${withVal.length} (${pct(withVal.length, keys.length)}). With more than one distinct value string: ${multi.length} (${pct(multi.length, withVal.length)}). Examples: ${multi.slice(0, 12).map(([k, e]) => `${k.replace("\t", "/")} ${[...e.vals].join(" | ")} [${[...e.pos].join(" ")}]`).join("; ")}`);
  console.log(`As a TSV: ${(tsv.length / 1e6).toFixed(1)} MB of text, ${(zlib.gzipSync(tsv).length / 1e6).toFixed(1)} MB gzipped.`);
  const has = (t, r) => table.get(`${t}\t${r}`)?.vals.size > 0;
  // JMdict headwords
  const heads = new Map();
  for (const f of readdirSync(jm).filter((f) => f.startsWith("term_bank"))) for (const [term, reading, , , score] of JSON.parse(readFileSync(`${jm}/${f}`, "utf8"))) { const r = kata(reading || (KANAONLY.test(term) ? term : "")); if (!r) continue; const k = `${term}\t${r}`; heads.set(k, Math.max(heads.get(k) ?? -1e12, score)); }
  let hv = 0, common = 0, commonV = 0; for (const [k, s] of heads) { const ok = table.get(k)?.vals.size > 0; if (ok) hv++; if (s > 0) { common++; if (ok) commonV++; } }
  console.log(`\n## JMdict Headwords\n\nHeadwords (spelling plus reading): ${heads.size}. With a value in the table: ${hv} (${pct(hv, heads.size)}). Headwords with a score above zero: ${common}, with a value: ${commonV} (${pct(commonV, common)}).`);
  // corpus
  const { TokenizerBuilder } = require(`${spike}/node_modules/lindera`);
  const b = new TokenizerBuilder(); b.setDictionary(`${spike}/dicts/lindera-unidic202512`); b.setMode("normal"); const t = b.build();
  const ID = 28, KANA = 21, ORTH = 10, ATYPE = 24;
  const sp = new Map(); let toks = 0, tokVal = 0, same = 0, inSet = 0, amb = 0;
  for (const f of readdirSync(`${spike}/texts`)) for (const line of readFileSync(`${spike}/texts/${f}`, "utf8").split("\n")) for (const phrase of line.split(/[\s　]+/)) for (const x of phrase ? t.tokenize(phrase) : []) {
    if (x.isUnknown || !JP.test(x.surface) || x.details.length <= ID) continue; const d = x.details, k = `${d[ORTH]}\t${d[KANA]}`; toks++;
    const e = sp.get(k) ?? sp.set(k, { n: 0, vals: new Set() }).get(k); e.n++; if (d[ATYPE] !== "*") { e.vals.add(d[ATYPE]); tokVal++; const tv = table.get(k)?.vals; if (tv?.has(d[ATYPE])) { inSet++; if (tv.size === 1) same++; else amb++; } }
  }
  const spv = [...sp].filter(([, e]) => e.vals.size), spm = spv.filter(([, e]) => e.vals.size > 1);
  console.log(`\n## Corpus\n\nTokens ${toks}, with an accent value ${tokVal}. The token's value is in the table for its Spelling and reading: ${inSet} (${pct(inSet, tokVal)}). The table has exactly that one value: ${same} (${pct(same, tokVal)}). The table has further values for the pair: ${amb} (${pct(amb, tokVal)}).`);
  console.log(`Pairs of Spelling and reading seen: ${sp.size}, with a value ${spv.length}. Pairs whose tokens carry more than one value string: ${spm.length} (${pct(spm.length, spv.length)}), ${spm.reduce((a, [, e]) => a + e.n, 0)} tokens. Examples: ${spm.sort((a, c) => c[1].n - a[1].n).slice(0, 15).map(([k, e]) => `${k.replace("\t", "/")} ${[...e.vals].join(" | ")} ×${e.n}`).join("; ")}`);
  // other readings: JMdict headwords with the spelling of a corpus pair and another reading
  const byTerm = new Map(); for (const k of heads.keys()) { const [term, r] = k.split("\t"); (byTerm.get(term) ?? byTerm.set(term, []).get(term)).push(r); }
  let oth = 0, othV = 0, pairsWith = 0, pairsAll = 0;
  for (const [k] of sp) { const [o, r] = k.split("\t"); if (KANAONLY.test(o)) continue; const rs = (byTerm.get(o) ?? []); if (!rs.includes(r)) continue; const others = rs.filter((x) => x !== r); if (!others.length) continue; pairsAll++; let all = true; for (const x of others) { oth++; if (has(o, x)) othV++; else all = false; } if (all) pairsWith++; }
  console.log(`\n## Other readings\n\nKanji Spellings in the corpus with another reading in JMdict: ${pairsAll}. Other-reading Headwords: ${oth}, with a value in the table: ${othV} (${pct(othV, oth)}). Spellings where every other reading has a value: ${pairsWith} (${pct(pairsWith, pairsAll)}).`);
})();
