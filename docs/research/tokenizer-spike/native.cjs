const { loadDictionary, TokenizerBuilder } = require("lindera");
const mb = () => (global.gc?.(), Math.round(process.memoryUsage().rss / 1048576));
const dn = process.argv[2];
const base = mb(), t0 = performance.now();
const text = "ｽｺﾞｲ人だ。ＡＢＣ１２３！時々";
const mk = (f) => { const b = new TokenizerBuilder(); b.setDictionary(`${__dirname}/dicts/lindera-${dn}`); b.setMode("normal"); f?.(b); return b.build(); };
const plain = mk(); plain.tokenize("準備");
const loadMs = Math.round(performance.now() - t0), rss = mb();
const show = (t) => t.tokenize(text).map((x) => `${x.surface}@${x.byteStart}-${x.byteEnd}`).join(" ");
console.log(JSON.stringify({ dn, loadMs, baseRss: base, rss }));
console.log("plain :", show(plain));
console.log("nfkc  :", show(mk((b) => b.appendCharacterFilter("unicode_normalize", { kind: "nfkc" }))));
try { mk((b) => b.appendCharacterFilter("bogus", {})); console.log("bogus filter: no error"); } catch (e) { console.log("bogus filter:", String(e).slice(0, 80)); }
