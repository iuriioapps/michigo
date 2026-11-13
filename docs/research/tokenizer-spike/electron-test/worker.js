import { run } from "./tokenize.js";
process.parentPort.once("message", async (e) => {
  try { process.parentPort.postMessage(await run(e.data)); } catch (err) { process.parentPort.postMessage({ error: String(err) }); }
});
