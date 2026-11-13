// Finds the unpacked app that electron-builder produced, runs it, prints its result file.
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
const dir = readdirSync("dist").map((d) => join("dist", d)).find((d) => /mac|unpacked/.test(d));
const exe = process.platform === "darwin" ? join(dir, "TokenizerTest.app/Contents/MacOS/TokenizerTest")
  : process.platform === "win32" ? join(dir, "TokenizerTest.exe")
  : join(dir, readdirSync(dir).find((n) => /^tokenizer|^TokenizerTest$/i.test(n) && !n.includes(".")));
const out = resolve("result.json");
const args = process.platform === "linux" ? ["--no-sandbox"] : [];
const r = spawnSync(exe, args, { env: { ...process.env, TOKENIZER_TEST_OUT: out }, encoding: "utf8", timeout: 120000 });
if (!existsSync(out)) { console.error("no result", r.status, r.signal, r.stderr?.slice(-2000)); process.exit(1); }
const res = JSON.parse(readFileSync(out, "utf8"));
console.log(JSON.stringify(res, null, 2));
const ok = [res.main, res.utility].every((p) => p?.wasm?.tokens?.startsWith("すげぇ:凄い") && p?.native?.tokens === p.wasm.tokens);
if (!ok) process.exit(1);
