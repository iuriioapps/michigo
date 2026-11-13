// Turns the raw inputs into one clean line per subtitle line / paragraph / lyric line.
import { readFileSync, writeFileSync } from "node:fs";
const [srt, aozora] = process.argv.slice(2);
const subs = readFileSync(srt, "utf8").replace(/^﻿/, "").split(/\r?\n/)
  .filter((l) => l.trim() && !/^\d+$/.test(l) && !l.includes("-->"))
  .map((l) => l.replace(/（[^）]*）/g, "").replace(/\([^)]*\)/g, "").replace(/[♪〜]/g, "").trim())
  .filter(Boolean);
writeFileSync("texts/subtitles.txt", subs.join("\n") + "\n");
const raw = new TextDecoder("shift_jis").decode(readFileSync(aozora)).split(/\r?\n/);
const start = raw.lastIndexOf("-------------------------------------------------------") + 1;
const end = raw.findIndex((l) => l.startsWith("底本："));
const prose = raw.slice(start, end)
  .map((l) => l.replace(/［＃[^］]*］/g, "").replace(/《[^》]*》/g, "").replace(/｜/g, "").trim())
  .filter(Boolean);
writeFileSync("texts/prose.txt", prose.join("\n") + "\n");
console.log({ subs: subs.length, prose: prose.length });
// second batch: modern lyrics, a podcast transcript, two Wikipedia articles
{
  const [lyr, tr] = process.argv.slice(4);
  const lines = readFileSync(lyr, "utf8").split(/\r?\n/).map((l) => l.trim());
  const junk = lines.findIndex((l) => l === "You might also like");
  const keep = lines.filter((l, i) => l && !/^\[.*\]$/.test(l) && (junk < 0 || i < junk || i > junk + 2));
  writeFileSync("texts/lyrics.txt", keep.join("\n") + "\n");
  const t = readFileSync(tr, "utf8").split(/\r?\n/).map((l) => l.replace(/^#+\s*(\[[\d:]+\]\s*)?/, "").replace(/\\$/, "").trim()).filter(Boolean);
  writeFileSync("texts/transcript.txt", t.join("\n") + "\n");
  for (const [id, name] of [["1199627", "wiki-miku"], ["2912105", "wiki-danmachi"]]) {
    const w = readFileSync(`raw/wiki-${id}.txt`, "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !/^=+.*=+$/.test(l));
    writeFileSync(`texts/${name}.txt`, w.join("\n") + "\n");
  }
}
