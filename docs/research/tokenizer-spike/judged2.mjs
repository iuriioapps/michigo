// Writes the judged sample for UniDic 2.1.2 against 2025.12. Verdicts were assigned by reading each item; they are a judgment, not a measurement.
import { readFileSync, writeFileSync } from "node:fs";
const r = JSON.parse(readFileSync("sample2.json", "utf8"));
const A_BAD = [1, 4, 5, 6, 7, 9, 15, 26, 27, 31, 35, 36, 45, 59, 60, 62, 65, 68, 69, 70, 73, 75, 76, 79, 88, 95, 96, 107, 109, 111, 113, 120, 122, 123, 125, 129, 137, 143, 144, 146, 147, 148, 150];
const B_BAD = [2, 3, 13, 17, 22, 25, 33, 68, 72, 75, 84, 86, 95, 109, 110, 122, 136, 143];
const esc = (s) => s.replaceAll("|", "¦");
const per = (bad, k) => bad.filter((n) => r[n - 1].kind === k).length;
const md = ["# Judged sample: UniDic 2.1.2 against 2025.12", "", "Seeded random sample (see `sample2.mjs`) of 150 regions where the two versions still cut a line differently after Michigo's passes (joined Latin and digit runs, the narrow katakana join, the letter-or-digit filter): 100 from subtitles, 35 from Wikipedia, 15 from prose and classic lyrics.", "", "A cut is \"wrong\" when it puts a word into the list that is not in the text: a wrong lemma or a fragment of a longer word. Short units (階 + 層) and split function words (と + も) count as ok. The verdicts are one reader's judgment.", "", "Token notation: `surface[lexeme]`, and `?` marks an unknown token. The marked region is inside «».", "",
  "## Totals", "", "| Version | Wrong, subtitles (100) | Wrong, Wikipedia (35) | Wrong, prose (15) | Wrong, all (150) |", "| --- | --- | --- | --- | --- |",
  ...[["UniDic 2.1.2", A_BAD], ["UniDic 2025.12", B_BAD]].map(([n, b]) => `| ${n} | ${per(b, "subs")} | ${per(b, "wiki")} | ${per(b, "prose")} | ${b.length} |`),
  "", "## Items", "", "| # | Kind | Context | 2.1.2 | 2025.12 | 2.1.2 verdict | 2025.12 verdict |", "| --- | --- | --- | --- | --- | --- | --- |",
  ...r.map((x, i) => `| ${i + 1} | ${x.kind} | ${esc(x.ctx)} | ${esc(x.cuts[0])} | ${esc(x.cuts[1])} | ${A_BAD.includes(i + 1) ? "wrong" : "ok"} | ${B_BAD.includes(i + 1) ? "wrong" : "ok"} |`)];
writeFileSync("judged-sample-202512.md", md.join("\n") + "\n");
console.log(md.slice(8, 14).join("\n"));
