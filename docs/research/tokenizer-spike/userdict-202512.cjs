// Does a user dictionary entry win over the short units on UniDic 2025.12? Usage: node userdict-202512.cjs <tmp dir>
const { readFileSync, readdirSync, writeFileSync } = require("node:fs");
const { TokenizerBuilder } = require("lindera");
const words = ["魔法使い", "大魔法使い", "冒険者", "フリーレン", "日本人", "封魔鉱", "気がする", "母さん"];
const csv = `${process.argv[2]}/user.csv`;
writeFileSync(csv, words.map((w) => `${w},名詞,*`).join("\n") + "\n");
const b = new TokenizerBuilder(); b.setDictionary(`${__dirname}/dicts/lindera-unidic202512`); b.setMode("normal"); b.setUserDictionary(csv);
const t = b.build();
const lines = readdirSync(`${__dirname}/texts`).flatMap((f) => readFileSync(`${__dirname}/texts/${f}`, "utf8").split("\n").filter(Boolean));
const inText = new Map(words.map((w) => [w, 0])), asToken = new Map(words.map((w) => [w, 0])), misses = [];
for (const line of lines) {
  const toks = t.tokenize(line).map((x) => x.surface);
  for (const w of words) {
    const n = line.split(w).length - 1;
    if (!n) continue;
    // an occurrence inside a longer entry (魔法使い in 大魔法使い) belongs to the longer one
    const longer = words.filter((o) => o !== w && o.includes(w)).reduce((a, o) => a + line.split(o).length - 1, 0);
    const got = toks.filter((s) => s === w).length;
    inText.set(w, inText.get(w) + n - longer); asToken.set(w, asToken.get(w) + got);
    if (got < n - longer && misses.length < 15) misses.push(`${w}: ${toks.join("·")}`);
  }
}
console.log("| Entry | In the text | One token |\n| --- | --- | --- |");
for (const w of words) console.log(`| ${w} | ${inText.get(w)} | ${asToken.get(w)} |`);
console.log("\nMisses:\n" + misses.map((m) => `- ${m}`).join("\n"));
