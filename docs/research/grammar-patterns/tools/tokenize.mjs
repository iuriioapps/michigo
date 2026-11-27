// Shows the UniDic short-unit tokens of an entry's sentences, so detection notes can be checked against the real tokenizer.
// Usage: node tokenize.mjs <id>...   or   node tokenize.mjs --text <sentence>...
// Env: LINDERA, a folder whose node_modules has lindera 6.2.0; UNIDIC, the built UniDic 2025.12 Lindera dictionary.
// One line per sentence. A token is surface(語彙素 品詞 活用型 活用形); tokens inside an example's match are in [ ].
// A line starts with ! when the match begins or ends inside a token, which a token matcher cannot mark.
// node tokenize.mjs --misaligned <batch>... lists only those examples.
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const { LINDERA, UNIDIC } = process.env;
if (!LINDERA || !UNIDIC) throw new Error("set LINDERA and UNIDIC");
const { TokenizerBuilder } = createRequire(join(LINDERA, "package.json"))("lindera");
const b = new TokenizerBuilder();
b.setDictionary(UNIDIC);
b.setMode("normal");
const tokenizer = b.build();

const enc = new TextEncoder();
// UniDic details: 0-3 品詞, 4 活用型, 5 活用形, 7 語彙素.
const show = (t) => {
  const d = t.details;
  if (t.isUnknown || !d || d.length < 8) return `${t.surface}(?)`;
  const pos = d.slice(0, 2).filter((x) => x !== "*").join("-");
  const conj = d[4] === "*" ? "" : ` ${d[4]} ${d[5]}`;
  return `${t.surface}(${d[7]} ${pos}${conj})`;
};
function line(ja, match) {
  const start = match ? enc.encode(ja.slice(0, ja.indexOf(match))).length : -1;
  const end = match ? start + enc.encode(match).length : -1;
  const tokens = tokenizer.tokenize(ja);
  const cut = match && tokens.some((t) => (t.byteStart < start && t.byteEnd > start) || (t.byteStart < end && t.byteEnd > end));
  const text = tokens.map((t) => (t.byteStart < end && t.byteEnd > start ? `[${show(t)}]` : show(t))).join(" ");
  return { cut, text };
}

const args = process.argv.slice(2);
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "details");
const load = (f) => JSON.parse(readFileSync(join(root, f), "utf8"));
const out = ({ cut, text }) => (cut ? "!" : "") + text;
if (args[0] === "--text") {
  for (const s of args.slice(1)) console.log(line(s).text);
} else if (args[0] === "--misaligned") {
  for (const batch of args.slice(1)) for (const e of load(`${batch}.json`)) e.examples.forEach((x, i) => {
    const r = line(x.ja, x.match);
    if (r.cut) console.log(`${e.id} +${i} match "${x.match}": ${r.text}`);
  });
} else {
  const all = readdirSync(root).filter((f) => f.endsWith(".json")).flatMap(load);
  for (const id of args) {
    const e = all.find((x) => x.id === id);
    if (!e) { console.log(`${id}: not found`); continue; }
    console.log(`## ${id}`);
    e.examples.forEach((x, i) => console.log(`+${i} ${out(line(x.ja, x.match))}`));
    e.counterexamples.forEach((x, i) => console.log(`-${i} ${line(x.ja).text}`));
  }
}
