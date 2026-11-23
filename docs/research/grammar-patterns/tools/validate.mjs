// Checks detailed Grammar Pattern files: node validate.mjs [--known ids.json] <file.json>...
// --known: a JSON array of every id in the final set, so references to other files resolve.
// Exit code 1 when any file has an error. Prints one line per problem.
import { readFileSync } from "node:fs";

const KEYS = ["id", "form", "variants", "meaning", "kind", "register", "level", "sources", "prototype", "connection", "examples", "counterexamples", "subsumes", "confusables", "detection"];
const KINDS = new Set(["construction", "particle", "word"]);
const REGISTERS = new Set(["spoken", "neutral", "written"]);
const LEVELS = new Set(["N5", "N4", "N3", "N2", "N1"]);
const JA = /[぀-ヿ一-鿿]/;
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const count = (hay, needle) => hay.split(needle).length - 1;
let errors = 0;
const seen = new Map();
const refs = [];
const args = process.argv.slice(2);
const k = args.indexOf("--known");
const known = new Set(k >= 0 ? JSON.parse(readFileSync(args.splice(k, 2)[1], "utf8")) : []);

for (const file of args) {
  const bad = (id, msg) => { errors++; console.log(`${file}: ${id}: ${msg}`); };
  let data;
  try { data = JSON.parse(readFileSync(file, "utf8")); } catch (e) { bad("-", `not JSON: ${e.message}`); continue; }
  if (!Array.isArray(data)) { bad("-", "not an array"); continue; }
  for (const p of data) {
    const id = p?.id ?? "?";
    for (const k of KEYS) if (!(k in p)) bad(id, `missing key ${k}`);
    for (const k of Object.keys(p)) if (!KEYS.includes(k)) bad(id, `unknown key ${k}`);
    if (!ID.test(id)) bad(id, "id is not kebab-case romaji");
    if (seen.has(id)) bad(id, `duplicate id, also in ${seen.get(id)}`); else seen.set(id, file);
    if (!KINDS.has(p.kind)) bad(id, `kind ${p.kind}`);
    if (!REGISTERS.has(p.register)) bad(id, `register ${p.register}`);
    if (!LEVELS.has(p.level)) bad(id, `level ${p.level}`);
    if (typeof p.meaning !== "string" || !p.meaning || p.meaning.length > 80) bad(id, "meaning empty or over 80 characters");
    if (!JA.test(p.form ?? "")) bad(id, "form has no Japanese");
    if (!Array.isArray(p.connection) || p.connection.length === 0) bad(id, "connection empty");
    if (typeof p.detection !== "string" || p.detection.length < 20) bad(id, "detection too short");
    const ex = Array.isArray(p.examples) ? p.examples : [];
    const cx = Array.isArray(p.counterexamples) ? p.counterexamples : [];
    if (ex.length < 5) bad(id, `${ex.length} examples, need 5`);
    if (cx.length < 3) bad(id, `${cx.length} counterexamples, need 3`);
    const sentences = new Set();
    for (const [i, e] of ex.entries()) {
      if (!JA.test(e.ja ?? "") || !e.en || !e.match) { bad(id, `example ${i} needs ja, match and en`); continue; }
      const n = count(e.ja, e.match);
      if (n !== 1) bad(id, `example ${i}: match "${e.match}" occurs ${n} times`);
      if (sentences.has(e.ja)) bad(id, `example ${i} repeats a sentence`);
      sentences.add(e.ja);
    }
    for (const [i, c] of cx.entries()) {
      if (!JA.test(c.ja ?? "") || !c.en || !c.why) bad(id, `counterexample ${i} needs ja, en and why`);
      if (sentences.has(c.ja)) bad(id, `counterexample ${i} repeats an example`);
      sentences.add(c.ja);
    }
    for (const r of [...(p.subsumes ?? []), ...(p.confusables ?? [])]) refs.push([file, id, r]);
  }
}
for (const [file, id, r] of refs) if (!seen.has(r) && !known.has(r)) { errors++; console.log(`${file}: ${id}: refers to unknown id ${r}`); }
console.log(`${seen.size} patterns, ${errors} problems`);
process.exit(errors ? 1 : 0);
