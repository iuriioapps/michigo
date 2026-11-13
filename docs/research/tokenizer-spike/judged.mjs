// Writes the judged sample. Verdicts were assigned by reading each item; they are a judgment, not a measurement.
import { readFileSync, writeFileSync } from "node:fs";
const r = JSON.parse(readFileSync("sample.json", "utf8"));
const U_BAD = [14, 25, 39, 78, 90, 95, 96, 114, 179, 195, 197, 201, 204, 221, 238, 239, 255];
const U_JOINED = [14, 25, 39, 95, 96, 114, 179, 195, 197, 201, 204, 221, 238, 239]; // wrong raw, right after joining katakana runs
const U_RUNS = [2, 75, 91, 128, 182, 183, 186, 187, 188, 193, 198, 200, 211, 212, 215, 216, 219, 220, 223, 225, 226, 233, 236, 237, 271, 272, 274, 275, 276, 277, 278, 279, 280, 282, 283, 284, 285, 286, 287, 289, 290, 291, 292, 294, 297, 298, 299, 300];
const U_HALF = [4];
const I_BAD = [3, 4, 9, 14, 20, 25, 26, 29, 33, 39, 42, 46, 50, 67, 70, 72, 78, 95, 106, 122, 132, 148, 149, 180, 189, 227, 245];
const S_BAD = [15, 59, 60, 78, 90];
const u = (n) => (U_JOINED.includes(n) ? "wrong, fixed by katakana join" : U_BAD.includes(n) ? "wrong" : U_RUNS.includes(n) ? "split, fixed by run join" : U_HALF.includes(n) ? "unknown, fixed by half-width normalization" : "ok");
const md = ["# Judged sample of 300 disagreement regions", "", "Seeded random sample (see `sample.mjs`) of regions where UniDic, IPADIC and Sudachi cut a line differently: 120 from subtitles, 60 from the transcript, 60 from Wikipedia, 30 from prose, 30 from the modern lyrics.", "", "A cut is \"wrong\" when it puts a word into the list that is not in the text: a wrong lemma or a fragment of a longer word. Short units (日本 + 人) and split function words (で + も) count as ok. The verdicts are one reader's judgment.", "", "Token notation: `surface[grouping key]`. The marked region is inside «». Lyrics context is left out.", ""];
const count = (f) => r.filter((_, i) => f(i + 1)).length;
md.push("## Totals", "", "| Candidate | Wrong | Wrong after Michigo's own fixes |", "| --- | --- | --- |",
  `| Lindera + UniDic 2.1.2 | ${U_BAD.length} of 300, plus ${U_RUNS.length + U_HALF.length} split or unknown | ${U_BAD.length - U_JOINED.length} of 300 |`,
  `| Lindera + IPADIC | ${I_BAD.length} of 300 | ${I_BAD.length - 1} of 300 |`,
  `| sudachi-wasm333 | ${S_BAD.length} of 300 | ${S_BAD.length} of 300 |`, "", "## Items", "", "| # | Kind | Context | UniDic | IPADIC | Sudachi | UniDic verdict | IPADIC verdict | Sudachi verdict |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- |");
r.forEach((x, i) => {
  const n = i + 1, esc = (s) => s.replaceAll("|", "¦");
  md.push(`| ${n} | ${x.kind} | ${x.kind === "lyrics" ? esc(x.ctx.match(/«.*»/)[0]) : esc(x.ctx)} | ${esc(x.cuts[0])} | ${esc(x.cuts[1])} | ${esc(x.cuts[2])} | ${u(n)} | ${I_BAD.includes(n) ? "wrong" : "ok"} | ${S_BAD.includes(n) ? "wrong" : "ok"} |`);
});
writeFileSync("judged-sample.md", md.join("\n") + "\n");
console.log(md.slice(8, 14).join("\n"));
