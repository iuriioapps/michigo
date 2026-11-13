// Memory: WASM heap vs RSS, peak vs steady, and release when a worker exits.
import { readFileSync } from "node:fs";
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
const mb = (n) => Math.round(n / 1048576);
const rss = () => (globalThis.gc?.(), mb(process.memoryUsage().rss));

async function load(dictName) {
  const L = await import("lindera-wasm");
  const wasm = await L.default({ module_or_path: readFileSync("node_modules/lindera-wasm/lindera_wasm_bg.wasm") });
  const f = (n) => readFileSync(`dicts/lindera-${dictName}/${n}`);
  const dict = L.loadDictionaryFromBytes(f("metadata.json"), f("dict.trie"), f("dict.valsidx"), f("dict.vals"), f("dict.wordsidx"), f("dict.words"), f("matrix.mtx"), f("char_def.bin"), f("unk.bin"));
  const b = new L.TokenizerBuilder(); b.setDictionaryInstance(dict); b.setMode("normal");
  return { tok: b.build(), heap: () => mb(wasm.memory.buffer.byteLength) };
}

if (!isMainThread) {
  const { tok, heap } = await load(workerData);
  parentPort.postMessage({ n: tok.tokenize("準備できた。").length, heap: heap() });
} else {
  const dictName = process.argv[2];
  const base = rss();
  const w = new Worker(new URL(import.meta.url), { workerData: dictName });
  const msg = await new Promise((r) => w.once("message", r));
  const during = rss();
  await w.terminate();
  await new Promise((r) => setTimeout(r, 500));
  const afterWorker = rss();
  const { tok, heap } = await load(dictName);
  tok.tokenize("準備");
  const inProc = rss();
  await new Promise((r) => setTimeout(r, 3000));
  console.log(JSON.stringify({ dictName, baseRss: base, workerHeap: msg.heap, rssWithWorker: during, rssAfterWorkerExit: afterWorker, inProcHeap: heap(), rssInProc: inProc, rssInProcAfter3s: rss(), peakRss: mb(process.resourceUsage().maxRSS * 1024) }));
}
