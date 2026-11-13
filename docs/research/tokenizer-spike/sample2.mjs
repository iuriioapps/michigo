// Seeded sample of regions where two UniDic versions cut a line differently after Michigo's passes.
// Usage: node sample2.mjs <run A> <run B>   -> sample2.json
import { readFileSync, writeFileSync } from "node:fs";
import assert from "node:assert";
const [A, B] = process.argv.slice(2);
const R = [A, B].map((c) => JSON.parse(readFileSync(`out-all/${c}.json`, "utf8")).texts);
const RUN = [/^[A-Za-zＡ-Ｚａ-ｚ]+$/, /^[0-9０-９]+$/], KATA = /^[\p{sc=Katakana}ー]+$/u;
// The passes: join Latin and digit runs, then join katakana runs when a piece is unknown or at most two characters long.
function passes(toks) {
  const out = [];
  for (const t of toks) {
    const p = out.at(-1), cls = RUN.findIndex((r) => r.test(t.s));
    if (p && p.e === t.b && ((cls >= 0 && p.cls === cls) || (KATA.test(p.s) && KATA.test(t.s) && (p.short || t.oov || t.s.length <= 2)))) {
      p.s += t.s; p.e = t.e; p.group = p.s; p.short = false;
    } else out.push({ ...t, cls, short: t.oov || t.s.length <= 2 });
  }
  return out;
}
assert.deepEqual(passes([{ s: "フリー", b: 0, e: 3 }, { s: "レン", b: 3, e: 5 }, { s: "2", b: 5, e: 6 }, { s: "0", b: 6, e: 7 }]).map((t) => t.s), ["フリーレン", "20"]);
let seed = 20261113;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const by = {}, kind = (tx) => (tx.startsWith("subs") ? "subs" : tx.startsWith("wiki") ? "wiki" : "prose");
let lineCount = 0, changed = 0;
for (const tx of Object.keys(R[0])) {
  const lines = readFileSync(`texts/${tx}.txt`, "utf8").split(/\r?\n/).filter(Boolean);
  lines.forEach((line, l) => {
    const lt = R.map((r) => passes(r[tx][l]));
    const bs = lt.map((toks) => new Set(toks.flatMap((t) => [t.b, t.e])));
    const common = [...bs[0]].filter((b) => bs[1].has(b)).sort((a, b) => a - b);
    let hit = false;
    for (let i = 0; i + 1 < common.length; i++) {
      const [b, e] = [common[i], common[i + 1]], text = line.slice(b, e);
      const segs = lt.map((toks) => toks.filter((t) => t.b >= b && t.e <= e));
      if (segs.every((s) => s.length === 1) || !/[\p{L}\p{N}]/u.test(text)) continue;
      hit = true;
      (by[kind(tx)] ??= []).push({ ctx: `${line.slice(Math.max(0, b - 12), b)}«${text}»${line.slice(e, e + 12)}`, cuts: segs.map((s) => s.map((t) => `${t.s}${t.oov ? "?" : ""}[${t.group.replace(/\(.*\)$/, "")}]`).join("·")) });
    }
    lineCount++; if (hit) changed++;
  });
}
const out = [];
for (const [k, n] of Object.entries({ subs: 100, wiki: 35, prose: 15 })) for (let i = 0; i < n && by[k].length; i++) out.push({ kind: k, ...by[k].splice(Math.floor(rnd() * by[k].length), 1)[0] });
writeFileSync("sample2.json", JSON.stringify(out, null, 1));
console.log({ lines: lineCount, linesStillDifferent: changed, regions: Object.fromEntries(Object.entries(by).map(([k, v]) => [k, v.length + out.filter((o) => o.kind === k).length])) });
console.log(out.map((r, i) => `${i + 1} ${r.kind} ${r.ctx}\n  A ${r.cuts[0]}\n  B ${r.cuts[1]}`).join("\n"));
