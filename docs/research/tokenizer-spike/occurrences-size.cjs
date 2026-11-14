// How large and how fast is one row per occurrence in SQLite? Usage: node occurrences-size.cjs <tmp dir> > results-occurrences-size.md
// Real tokens of the corpus (UniDic 2025.12), repeated as Sources of 400 lines until the library holds 3,000 Sources.
const { readFileSync, readdirSync, statSync, rmSync } = require("node:fs");
const { DatabaseSync } = require("node:sqlite");
const { TokenizerBuilder } = require("lindera");
const b = new TokenizerBuilder(); b.setDictionary(`${__dirname}/dicts/lindera-unidic202512`); b.setMode("normal");
const t = b.build();
const JP = /[ぁ-ゖァ-ヺー一-鿿々]/;
const SOURCES = 3000, LINES = 400;
const lines = readdirSync(`${__dirname}/texts`).filter((f) => f.startsWith("subs")).flatMap((f) => readFileSync(`${__dirname}/texts/${f}`, "utf8").split("\n").filter(Boolean));
const words = new Map();
// per line: [start, length, word id or null] in UTF-16 units, as the renderer needs them
const parsed = lines.map((line) => {
  let pos = 0; const occ = [];
  for (const x of t.tokenize(line)) {
    const start = line.indexOf(x.surface, pos); pos = start + x.surface.length;
    if (!JP.test(x.surface)) continue;
    const key = x.isUnknown ? null : `${x.details[7]}\t${x.details[6]}`;
    if (key && !words.has(key)) words.set(key, words.size + 1);
    occ.push([start, x.surface.length, key ? words.get(key) : null]);
  }
  return { line, occ };
});

const file = `${process.argv[2]}/occ.db`;
rmSync(file, { force: true });
const db = new DatabaseSync(file);
db.exec(`PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;
CREATE TABLE sentence (id INTEGER PRIMARY KEY, source_id INTEGER NOT NULL, idx INTEGER NOT NULL, text TEXT NOT NULL);
CREATE TABLE occurrence (sentence_id INTEGER NOT NULL, start INTEGER NOT NULL, length INTEGER NOT NULL, word_id INTEGER, PRIMARY KEY (sentence_id, start)) WITHOUT ROWID;`);
const insS = db.prepare("INSERT INTO sentence VALUES (?, ?, ?, ?)"), insO = db.prepare("INSERT INTO occurrence VALUES (?, ?, ?, ?)");
const ms = (f) => { const s = performance.now(); const r = f(); return [performance.now() - s, r]; };
let sid = 0, rows = 0;
const insertSource = (src) => { for (let i = 0; i < LINES; i++) { const p = parsed[(src * LINES + i) % parsed.length]; insS.run(++sid, src, i, p.line); for (const [s, l, w] of p.occ) { insO.run(sid, s, l, w); rows++; } } };
const [tInsert] = ms(() => { db.exec("BEGIN"); for (let src = 1; src <= SOURCES; src++) insertSource(src); db.exec("COMMIT"); });
db.exec("PRAGMA wal_checkpoint(TRUNCATE)");
const mb = () => (statSync(file).size / 1048576).toFixed(0);
const sizePlain = mb();
const [tIndex] = ms(() => db.exec("CREATE INDEX sentence_source ON sentence (source_id, idx); CREATE INDEX occurrence_word ON occurrence (word_id, sentence_id); ANALYZE; PRAGMA wal_checkpoint(TRUNCATE)"));
const sizeIndexed = mb();

const q = (sql, ...a) => { const st = db.prepare(sql); st.all(...a); const runs = [1, 2, 3, 4, 5].map(() => ms(() => st.all(...a))); return [Math.min(...runs.map((r) => r[0])), runs[0][1].length]; };
const byCount = db.prepare("SELECT word_id, count(*) n FROM occurrence WHERE sentence_id <= 400000 AND word_id IS NOT NULL GROUP BY word_id ORDER BY n DESC").all();
const frequent = byCount[0].word_id, rare = byCount.at(-1).word_id;
const results = [
  ["Read one Source: its sentences and occurrences", q("SELECT s.idx, s.text, o.start, o.length, o.word_id FROM sentence s LEFT JOIN occurrence o ON o.sentence_id = s.id WHERE s.source_id = ? ORDER BY s.idx, o.start", 1500)],
  ["Occurrences per word in one Source", q("SELECT o.word_id, count(*) FROM sentence s JOIN occurrence o ON o.sentence_id = s.id WHERE s.source_id = ? GROUP BY o.word_id", 1500)],
  ["Occurrences per word in a Project of 50 Sources", q("SELECT o.word_id, count(*) FROM sentence s JOIN occurrence o ON o.sentence_id = s.id WHERE s.source_id BETWEEN 1000 AND 1049 GROUP BY o.word_id")],
  ["20 sentences with the most frequent word", q("SELECT DISTINCT s.text FROM occurrence o JOIN sentence s ON s.id = o.sentence_id WHERE o.word_id = ? LIMIT 20", frequent)],
  ["20 sentences with a rare word", q("SELECT DISTINCT s.text FROM occurrence o JOIN sentence s ON s.id = o.sentence_id WHERE o.word_id = ? LIMIT 20", rare)],
  ["Occurrences per word over the whole library", q("SELECT word_id, count(*) FROM occurrence GROUP BY word_id")],
];
// a rerun of one Source: delete its rows and insert them again
const [tRerun] = ms(() => { db.exec("BEGIN"); db.prepare("DELETE FROM occurrence WHERE sentence_id IN (SELECT id FROM sentence WHERE source_id = ?)").run(1500); db.prepare("DELETE FROM sentence WHERE source_id = ?").run(1500); insertSource(1500); db.exec("COMMIT"); });

console.log(`# One row per occurrence in SQLite\n\nNode ${process.version}, \`node:sqlite\`, SQLite ${db.prepare("SELECT sqlite_version() v").get().v}. Real tokens of the subtitle corpus on UniDic 2025.12, repeated as Sources of ${LINES} lines. A line stands for a Sentence. Only tokens with Japanese script are rows.\n\n| Measure | Value |\n| --- | --- |\n| Sources | ${SOURCES} |\n| Sentences | ${sid} |\n| Occurrence rows | ${rows} |\n| Distinct words | ${words.size} |\n| Insert of everything in one transaction, s | ${(tInsert / 1000).toFixed(1)} |\n| File without secondary indexes, MB | ${sizePlain} |\n| Both indexes plus \`ANALYZE\`, s | ${(tIndex / 1000).toFixed(1)} |\n| File with indexes, MB | ${sizeIndexed} |\n| Rerun of one Source (delete and insert), ms | ${tRerun.toFixed(0)} |\n\n## Queries\n\nBest of five runs.\n\n| Query | ms | Rows |\n| --- | --- | --- |\n${results.map(([n, [m, r]]) => `| ${n} | ${m.toFixed(m < 10 ? 2 : 0)} | ${r} |`).join("\n")}`);
db.close();
