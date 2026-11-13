import { readFileSync } from "node:fs";
import { join } from "node:path";
import init, { TokenizerBuilder, loadDictionaryFromBytes } from "lindera-wasm";
// @ts-expect-error bundler inlines the bytes
import wasm from "../node_modules/lindera-wasm/lindera_wasm_bg.wasm";

async function main() {
  const dir = process.argv[2];
  await init({ module_or_path: wasm });
  const f = (n: string) => readFileSync(join(dir, n));
  const dict = loadDictionaryFromBytes(f("metadata.json"), f("dict.trie"), f("dict.valsidx"), f("dict.vals"), f("dict.wordsidx"), f("dict.words"), f("matrix.mtx"), f("char_def.bin"), f("unk.bin"));
  const b = new TokenizerBuilder(); b.setDictionaryInstance(dict); b.setMode("normal");
  console.log(b.build().tokenize("すげぇな、お前。").map((t: any) => `${t.surface}:${t.details[7]}`).join(" "));
}
void main();
