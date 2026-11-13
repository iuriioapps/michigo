// How many context IDs stay distinct when costs are rounded? Reports class counts only, writes nothing.
// Usage: node quant.mjs <src dir> <shift> [<shift> ...]   (shift 4 = round to 16 cost units)
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
const [src, ...shifts] = process.argv.slice(2);
const bin = readFileSync(`${src}/matrix.bin`);
const A = bin.readUInt16LE(0), B = bin.readUInt16LE(2);
const m = new Int16Array(bin.buffer, bin.byteOffset + 4, A * B);
const ROW = /^("(?:[^"]|"")*"|[^,]*),(\d+),(\d+),/;
const usedL = new Set([0]), usedR = new Set([0]);
for (const f of [...readdirSync(src).filter((f) => /^lex.*\.csv$/.test(f)), "unk.def"])
  for (const l of readFileSync(`${src}/${f}`, "utf8").split("\n")) { const x = ROW.exec(l); if (x) usedL.add(+x[2]), usedR.add(+x[3]); }
let min = 0, max = 0, sum = 0;
for (let i = 0; i < m.length; i += 97) { const v = m[i]; if (v < min) min = v; if (v > max) max = v; sum += Math.abs(v); }
console.log({ dims: `${A} x ${B}`, min, max, meanAbs: Math.round(sum / (m.length / 97)) });
const count = (ids, others, cost, q) => {
  const keys = new Set(), buf = new Int16Array(others.length);
  for (const id of ids) { for (let i = 0; i < others.length; i++) buf[i] = cost(id, others[i]) >> q; keys.add(createHash("md5").update(new Uint8Array(buf.buffer)).digest("latin1")); }
  return keys.size;
};
const L = [...usedL], R = [...usedR];
for (const q of shifts.map(Number)) console.log({ roundTo: 1 << q, right: count(R, L, (a, b) => m[a + A * b], q), left: count(L, R, (b, a) => m[a + A * b], q) });
