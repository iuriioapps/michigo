// Shrinks a MeCab-format UniDic source without changing any connection cost.
// Context IDs that no entry uses are dropped. IDs whose cost vectors are identical are merged.
// Usage: node --max-old-space-size=8000 compact.mjs <src dir> <out dir>
import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync, createWriteStream } from "node:fs";
import { createHash } from "node:crypto";
import { once } from "node:events";
import assert from "node:assert";

const [src, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const bin = readFileSync(`${src}/matrix.bin`);
const A = bin.readUInt16LE(0), B = bin.readUInt16LE(2); // A: right IDs of the previous word, B: left IDs of the next word
assert.equal(bin.length, 4 + 2 * A * B);
const m = new Int16Array(bin.buffer, bin.byteOffset + 4, A * B); // cost(a, b) = m[a + A * b]

const ROW = /^("(?:[^"]|"")*"|[^,]*),(\d+),(\d+),/;
const lexFiles = readdirSync(src).filter((f) => /^lex.*\.csv$/.test(f));
const usedL = new Set([0]), usedR = new Set([0]); // 0 is BOS/EOS
const sources = [...lexFiles, "unk.def"].map((f) => [f, readFileSync(`${src}/${f}`, "utf8").split("\n")]);
for (const [, lines] of sources) for (const l of lines) {
  if (!l) continue;
  const x = ROW.exec(l);
  usedL.add(+x[2]); usedR.add(+x[3]);
}

// Groups ids by their cost vector over the representatives of the other side.
function classes(ids, others, cost) {
  const byKey = new Map(), cls = new Map(), buf = new Int16Array(others.length);
  for (const id of ids) {
    for (let i = 0; i < others.length; i++) buf[i] = cost(id, others[i]);
    const key = createHash("md5").update(new Uint8Array(buf.buffer)).digest("latin1");
    if (!byKey.has(key)) byKey.set(key, id);
    cls.set(id, byKey.get(key));
  }
  return cls;
}
const sorted = (s) => [...s].sort((x, y) => x - y);
let repR = sorted(usedR), repL = sorted(usedL), clsR, clsL;
for (let before = Infinity; repR.length + repL.length < before; ) {
  before = repR.length + repL.length;
  clsR = classes(sorted(usedR), repL, (a, b) => m[a + A * b]);
  repR = sorted(new Set(clsR.values()));
  clsL = classes(sorted(usedL), repR, (b, a) => m[a + A * b]);
  repL = sorted(new Set(clsL.values()));
  console.log({ rightUsed: usedR.size, rightClasses: repR.length, leftUsed: usedL.size, leftClasses: repL.length });
}
const newR = new Map(repR.map((id, i) => [id, i])), newL = new Map(repL.map((id, i) => [id, i]));
assert.equal(newR.get(clsR.get(0)), 0); assert.equal(newL.get(clsL.get(0)), 0);

for (const [f, lines] of sources) {
  writeFileSync(`${out}/${f}`, lines.map((l) => l && l.replace(ROW, (_, s, lid, rid) => `${s},${newL.get(clsL.get(+lid))},${newR.get(clsR.get(+rid))},`)).join("\n"));
}
copyFileSync(`${src}/char.def`, `${out}/char.def`);
const w = createWriteStream(`${out}/matrix.def`);
w.write(`${repR.length} ${repL.length}\n`);
for (let i = 0; i < repR.length; i++) {
  let chunk = "";
  for (let j = 0; j < repL.length; j++) chunk += `${i} ${j} ${m[repR[i] + A * repL[j]]}\n`;
  if (!w.write(chunk)) await once(w, "drain");
}
w.end();
await once(w, "finish");
console.log({ from: `${A} x ${B}`, to: `${repR.length} x ${repL.length}`, matrixMb: Math.round((2 * repR.length * repL.length) / 1e6) });
