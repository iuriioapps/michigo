// Prints one line per candidate: a hash of every token it produced, so runs on different platforms can be compared.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
const dir = process.env.OUT ?? "out";
for (const n of readdirSync(dir).sort()) {
  const r = JSON.parse(readFileSync(`${dir}/${n}`, "utf8"));
  const tokens = JSON.stringify([r.hard.map((h) => h.toks), r.texts]);
  console.log(JSON.stringify({ candidate: r.name, platform: `${process.platform}-${process.arch}`, node: r.node, tokensSha256: createHash("sha256").update(tokens).digest("hex").slice(0, 16), loadMs: r.loadMs, rssAfterLoadMb: r.rssAfterLoadMb, tokensPerSec: r.tokensPerSec, badOffsetLines: r.badOffsetLines ?? 0 }));
}
