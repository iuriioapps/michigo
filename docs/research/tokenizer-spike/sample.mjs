// Draws a seeded random sample of regions where UniDic, IPADIC and Sudachi cut a line differently.
import { readFileSync, writeFileSync } from "node:fs";
const C = ["lindera-unidic", "lindera-ipadic", "sudachi-wasm"];
const load = (dir) => Object.fromEntries(C.map((c) => [c, JSON.parse(readFileSync(`${dir}/${c}.json`, "utf8")).texts]));
const sets = [load("out"), load("out-subs")];
let seed = 20261112;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const all = [];
for (const R of sets) for (const tx of Object.keys(R[C[0]])) {
  if (tx === "subtitles" || tx === "lyrics-classic") continue;
  const lines = readFileSync(`texts/${tx}.txt`, "utf8").split("\n").filter(Boolean);
  lines.forEach((line, l) => {
    const lt = C.map((c) => R[c][tx][l].filter((t) => t.e > t.b));
    const bs = lt.map((toks) => new Set(toks.flatMap((t) => [t.b, t.e])));
    const common = [...bs[0]].filter((b) => bs.every((s) => s.has(b))).sort((a, b) => a - b);
    for (let i = 0; i + 1 < common.length; i++) {
      const [b, e] = [common[i], common[i + 1]];
      const segs = lt.map((toks) => toks.filter((t) => t.b >= b && t.e <= e));
      const text = line.slice(b, e);
      if (segs.every((s) => s.length === 1) || !/[\p{L}\p{N}]/u.test(text)) continue;
      all.push({ tx, ctx: `${line.slice(Math.max(0, b - 12), b)}«${text}»${line.slice(e, e + 12)}`, cuts: segs.map((s) => s.map((t) => `${t.s}[${t.group.replace(/\(.*\)$/, "")}]`).join("·")) });
    }
  });
}
// stratify: equal share per text kind
const kind = (tx) => (tx.startsWith("subs") ? "subs" : tx.startsWith("wiki") ? "wiki" : tx);
const by = {};
for (const r of all) (by[kind(r.tx)] ??= []).push(r);
const quota = { subs: 120, transcript: 60, wiki: 60, prose: 30, lyrics: 30 };
const out = [];
for (const [k, n] of Object.entries(quota)) {
  const pool = by[k];
  for (let i = 0; i < n && pool.length; i++) out.push({ kind: k, ...pool.splice(Math.floor(rnd() * pool.length), 1)[0] });
}
writeFileSync("sample.json", JSON.stringify(out, null, 1));
console.log(Object.fromEntries(Object.entries(by).map(([k, v]) => [k, v.length])), out.length);
console.log(out.map((r, i) => `${i + 1} ${r.kind} ${r.ctx}\n  U ${r.cuts[0]}\n  I ${r.cuts[1]}\n  S ${r.cuts[2]}`).join("\n"));
