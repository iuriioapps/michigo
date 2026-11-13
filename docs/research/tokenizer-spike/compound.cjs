// Lindera's japanese_compound_word token filter, native binding only (filters are inert in the WASM build).
const { TokenizerBuilder } = require("lindera");
const mk = (f) => { const b = new TokenizerBuilder(); b.setDictionary(`${__dirname}/dicts/lindera-unidic`); b.setMode("normal"); f?.(b); return b.build(); };
const show = (t, s) => t.tokenize(s).map((x) => x.surface).join("·");
const plain = mk();
const tries = {
  "numerals": { tags: ["名詞,数詞"], new_tag: "名詞,数詞" },
  "common nouns": { tags: ["名詞,普通名詞"], new_tag: "名詞,普通名詞" },
};
const cases = ["封魔鉱を採掘する。", "2025年に15人が来た。", "魔法使いフリーレンは冒険者だ。", "日本人の大学生が自転車に乗る。", "Yes, my バディ"];
for (const s of cases) {
  console.log("\n" + s + "\n  plain:        " + show(plain, s));
  for (const [name, args] of Object.entries(tries)) {
    try { console.log(`  ${name.padEnd(13)} ` + show(mk((b) => b.appendTokenFilter("japanese_compound_word", args)), s)); } catch (e) { console.log(`  ${name}: ERROR ${String(e).slice(0, 160)}`); }
  }
}
