// Builds texts/subs-<series>.txt from every local Japanese .srt/.ass file.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
// Usage: node prep2.mjs <dir> [<dir> ...]. Each directory becomes texts/subs-<n>.txt.
const series = Object.fromEntries(process.argv.slice(2).map((d, i) => [i + 1, d]));
const walk = (d, deep) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? (deep ? walk(p, deep) : []) : /\.(srt|ass)$/i.test(n) ? [p] : []; });
const clean = (l) => l.replace(/\{[^}]*\}/g, "").replace(/<[^>]*>/g, "").replace(/（[^）]*）/g, "").replace(/\([^)]*\)/g, "").replace(/[♪〜～]/g, "").trim();
function lines(p) {
  let t = readFileSync(p);
  t = t[0] === 0xff && t[1] === 0xfe ? new TextDecoder("utf-16le").decode(t) : t.toString("utf8");
  t = t.replace(/^﻿/, "");
  const raw = /\.ass$/i.test(p)
    ? t.split(/\r?\n/).filter((l) => l.startsWith("Dialogue:")).flatMap((l) => l.split(",").slice(9).join(",").split(/\\N/i))
    : t.split(/\r?\n/).filter((l) => l.trim() && !/^\d+$/.test(l.trim()) && !l.includes("-->"));
  return raw.map(clean).filter(Boolean);
}
for (const [name, dir] of Object.entries(series)) {
  let files = 0, out = [];
  for (const p of walk(dir, !process.env.FLAT?.split(",").includes(String(name)))) {
    const ls = lines(p);
    const kana = ls.filter((l) => /[぀-ヿ]/.test(l)).length;
    if (ls.length < 50 || kana / ls.length < 0.5) continue; // not Japanese
    files++; out.push(...ls);
  }
  writeFileSync(`texts/subs-${name}.txt`, out.join("\n") + "\n");
  console.log(name, { files, lines: out.length, chars: out.join("").length });
}
