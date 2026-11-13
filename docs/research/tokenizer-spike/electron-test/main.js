import { app, utilityProcess } from "electron";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { run } from "./tokenize.js";

app.whenReady().then(async () => {
  const dictDir = join(process.resourcesPath, "unidic");
  const result = { packaged: app.isPackaged, electron: process.versions.electron, node: process.versions.node, platform: `${process.platform}-${process.arch}`, appPath: app.getAppPath() };
  try { result.main = await run(dictDir); } catch (e) { result.main = { error: String(e) }; }
  const child = utilityProcess.fork(fileURLToPath(new URL("./worker.js", import.meta.url)));
  result.utility = await new Promise((resolve) => {
    child.once("message", resolve);
    child.once("exit", (code) => resolve({ error: `exit ${code}` }));
    child.postMessage(dictDir);
  });
  child.kill();
  const out = process.env.TOKENIZER_TEST_OUT ?? join(app.getPath("temp"), "tokenizer-electron-test.json");
  writeFileSync(out, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
  app.quit();
});
