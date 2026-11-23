// Finds the unpacked app that electron-builder produced, runs it, prints and checks its result.
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
const dir = readdirSync("dist").map((d) => join("dist", d)).find((d) => /mac|unpacked/.test(d));
const exe = process.platform === "darwin" ? join(dir, "SqliteWorkerTest.app/Contents/MacOS/SqliteWorkerTest")
  : process.platform === "win32" ? join(dir, "SqliteWorkerTest.exe")
  : join(dir, "sqliteworkertest");
const out = resolve("result.json");
const args = process.platform === "linux" ? ["--no-sandbox"] : [];
const r = spawnSync(exe, args, { env: { ...process.env, SQLITE_WORKER_OUT: out }, encoding: "utf8", timeout: 120000 });
if (!existsSync(out)) { console.error("no result", r.status, r.signal, r.stderr?.slice(-2000)); process.exit(1); }
const text = readFileSync(out, "utf8");
console.log(text);
const res = JSON.parse(text);
if (!(res.dirname.endsWith("app.asar") && res.mode === "wal" && res.rows === 100000 && res.fts === 1)) process.exit(1);
