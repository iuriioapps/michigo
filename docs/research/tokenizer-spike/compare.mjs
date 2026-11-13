// Compares two runs (default: UniDic 2.1.2 and UniDic 2023.02): unknowns, segmentation, and whether grouping keys stay the same.
import { readFileSync, writeFileSync } from "node:fs";
const [A, B, outFile] = [process.argv[2] ?? "lindera-native-unidic", process.argv[3] ?? "lindera-native-unidic2023", process.argv[4] ?? "results-unidic-versions.md"];
const ra = JSON.parse(readFileSync(`out-all/${A}.json`, "utf8")), rb = JSON.parse(readFileSync(`out-all/${B}.json`, "utf8"));
const SKIP = new Set(["助詞", "助動詞", "記号", "補助記号", "空白"]);
const content = (t) => !SKIP.has(t.pos) && /[\p{L}\p{N}]/u.test(t.s);
const md = [`# ${A} against ${B}`, ""];
const table = (head, rows) => md.push("", `| ${head.join(" | ")} |`, `| ${head.map(() => "---").join(" | ")} |`, ...rows.map((r) => `| ${r.join(" | ")} |`), "");
table(["Run", "Startup ms", "RSS after load MB", "RSS after all texts MB", "Tokens per second"], [ra, rb].map((r) => [r.name, r.loadMs, r.rssAfterLoadMb, r.rssAfterRunMb, r.tokensPerSec]));
md.push("## Hard cases");
table(["Text", A, B], ra.hard.map((h, i) => [h.text, ...[h, rb.hard[i]].map((x) => x.toks.filter((t) => t.s.trim()).map((t) => `${t.s}${t.oov ? "?" : ""}[${t.group.replace(/\(.*\)$/, "")}]`).join(" "))]));
md.push("## Per text");
const rows = [], keyChanges = new Map(), cutChanges = new Map(), fixed = new Map(), newUnknown = new Map();
let same = 0, keyDiff = 0;
for (const tx of Object.keys(ra.texts)) {
  let lines = 0, cutDiff = 0, oa = 0, ob = 0, ca = 0, cb = 0;
  ra.texts[tx].forEach((la, i) => {
    const lb = rb.texts[tx][i];
    lines++;
    ca += la.filter(content).length; cb += lb.filter(content).length;
    oa += la.filter((t) => content(t) && t.oov).length; ob += lb.filter((t) => content(t) && t.oov).length;
    for (const t of la) if (content(t) && t.oov && !lb.some((u) => u.oov && u.b < t.e && u.e > t.b)) fixed.set(t.s, (fixed.get(t.s) ?? 0) + 1);
    for (const t of lb) if (content(t) && t.oov && !la.some((u) => u.oov && u.b < t.e && u.e > t.b)) newUnknown.set(t.s, (newUnknown.get(t.s) ?? 0) + 1);
    const mb = new Map(lb.map((t) => [`${t.b}-${t.e}`, t]));
    if (la.map((t) => t.e).join() !== lb.map((t) => t.e).join()) {
      cutDiff++;
      const sa = new Set(la.map((t) => t.e)), sb = new Set(lb.map((t) => t.e));
      const common = [0, ...[...sa].filter((e) => sb.has(e))];
      for (let k = 0; k + 1 < common.length; k++) {
        const seg = (l) => l.filter((t) => t.b >= common[k] && t.e <= common[k + 1]).map((t) => t.s).join("·");
        const [x, y] = [seg(la), seg(lb)];
        if (x !== y) cutChanges.set(`${x} → ${y}`, (cutChanges.get(`${x} → ${y}`) ?? 0) + 1);
      }
    }
    for (const t of la) {
      const u = mb.get(`${t.b}-${t.e}`);
      if (!u || !content(t) || t.oov || u.oov) continue;
      same++;
      if (t.group !== u.group) { keyDiff++; const k = `${t.s}: ${t.group} → ${u.group}`; keyChanges.set(k, (keyChanges.get(k) ?? 0) + 1); }
    }
  });
  rows.push([tx, lines, `${oa} (${((100 * oa) / ca).toFixed(1)}%)`, `${ob} (${((100 * ob) / cb).toFixed(1)}%)`, `${cutDiff} (${((100 * cutDiff) / lines).toFixed(1)}%)`]);
}
table(["Text", "Lines", `Unknown content tokens, ${A}`, `Unknown content tokens, ${B}`, "Lines cut differently"], rows);
const top = (m, n) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k} ×${v}`);
md.push("## Unknown words that the second run knows", "", top(fixed, 60).join(", "), "", "## Words unknown only in the second run", "", top(newUnknown, 40).join(", ") || "none");
md.push("", "## Most frequent segmentation changes", "", ...top(cutChanges, 50).map((l) => `- ${l}`));
md.push("", "## Grouping key stability", "", `${same} known content tokens have the same span in both runs. The grouping key differs for ${keyDiff} of them (${((100 * keyDiff) / same).toFixed(2)}%), across ${keyChanges.size} distinct words.`, "", ...top(keyChanges, 50).map((l) => `- ${l}`));
writeFileSync(outFile, md.join("\n") + "\n");
console.log(md.join("\n").slice(0, 9000));
