import { app } from "electron";
import { Worker } from "node:worker_threads";
import { join } from "node:path";
import { writeFileSync } from "node:fs";

const out = process.env.SQLITE_WORKER_OUT;
app.whenReady().then(() => {
  const dbPath = join(app.getPath("temp"), `sqlite-worker-check-${process.pid}.db`);
  const worker = new Worker(join(import.meta.dirname, "worker.js"), { workerData: { dbPath } });
  worker.on("message", (m) => {
    const line = JSON.stringify({ electron: process.versions.electron, node: process.versions.node, dirname: import.meta.dirname, ...m });
    writeFileSync(out, line + "\n");
    app.quit();
  });
  worker.on("error", (e) => { writeFileSync(out, "ERROR " + e.stack + "\n"); app.quit(); });
});
