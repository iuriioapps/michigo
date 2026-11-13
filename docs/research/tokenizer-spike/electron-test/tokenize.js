// Shared by main and the utility process. Everything here is loaded from inside app.asar.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import init, { TokenizerBuilder, loadDictionaryFromBytes } from "./vendor/lindera_wasm.js";

const mb = () => Math.round(process.memoryUsage().rss / 1048576);
export async function run(dictDir) {
  const out = { rssStart: mb() };
  let t0 = performance.now();
  // the .wasm file sits inside app.asar; Electron's fs reads it
  await init({ module_or_path: readFileSync(new URL("./vendor/lindera_wasm_bg.wasm", import.meta.url)) });
  const f = (n) => readFileSync(join(dictDir, n));
  const dict = loadDictionaryFromBytes(f("metadata.json"), f("dict.trie"), f("dict.valsidx"), f("dict.vals"), f("dict.wordsidx"), f("dict.words"), f("matrix.mtx"), f("char_def.bin"), f("unk.bin"));
  const b = new TokenizerBuilder(); b.setDictionaryInstance(dict); b.setMode("normal");
  const text = "すげぇな、お前。凄い人だ。";
  out.wasm = { tokens: b.build().tokenize(text).map((t) => `${t.surface}:${t.details[7]}`).join(" "), ms: Math.round(performance.now() - t0), rss: mb() };
  try {
    t0 = performance.now();
    const native = createRequire(import.meta.url)("lindera");
    const nb = new native.TokenizerBuilder(); nb.setDictionary(dictDir); nb.setMode("normal");
    out.native = { tokens: nb.build().tokenize(text).map((t) => `${t.surface}:${t.details[7]}`).join(" "), ms: Math.round(performance.now() - t0), rss: mb() };
  } catch (e) { out.native = { error: String(e).slice(0, 300) }; }
  return out;
}
