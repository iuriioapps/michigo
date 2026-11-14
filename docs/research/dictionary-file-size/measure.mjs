// Builds indexed SQLite files from one Yomitan-format dictionary zip and measures them.
// Usage: node measure.mjs <dictionary.zip> <new-empty-work-dir>
// Needs Node 24 (node:sqlite) and the system `unzip`. Prints one JSON object.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import { cpus } from "node:os";
import { basename, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { deflateRawSync, inflateRawSync } from "node:zlib";

const [zip, work] = process.argv.slice(2);
assert(zip && work, "usage: node measure.mjs <dictionary.zip> <new-empty-work-dir>");
mkdirSync(work, { recursive: true });
assert.equal(readdirSync(work).length, 0, "work dir must be empty");

const ms = (start) => Number(process.hrtime.bigint() - start) / 1e6;
const text = (v) => (typeof v === "string" ? v : JSON.stringify(v));

const src = join(work, "unzipped");
let t = process.hrtime.bigint();
execFileSync("unzip", ["-q", zip, "-d", src]);
const unzipMs = ms(t);

const files = readdirSync(src);
const bankFiles = (kind) =>
  files
    .filter((f) => f.startsWith(`${kind}_bank_`))
    .sort((a, b) => parseInt(a.split("_")[2]) - parseInt(b.split("_")[2]));
const isKanji = bankFiles("kanji").length > 0;
const banks = bankFiles(isKanji ? "kanji" : "term");
const index = JSON.parse(readFileSync(join(src, "index.json"), "utf8"));
const unzippedBytes = files.reduce((n, f) => n + statSync(join(src, f)).size, 0);

// Term bank row (format 3): [expression, reading, definitionTags, rules, score, glossary, sequence, termTags]
// Kanji bank row (format 3): [character, onyomi, kunyomi, tags, meanings, stats]
const termCols = `expression TEXT NOT NULL, reading TEXT NOT NULL, sequence INTEGER, definition_tags TEXT, rules TEXT, score INTEGER, glossary, term_tags TEXT`;
const kanjiCols = `onyomi TEXT, kunyomi TEXT, tags TEXT, meanings, stats`;
const variants = isKanji
  ? {
      plain: { ddl: `CREATE TABLE kanji (character TEXT PRIMARY KEY, ${kanjiCols})` },
      "without-rowid": {
        ddl: `CREATE TABLE kanji (character TEXT PRIMARY KEY, ${kanjiCols}) WITHOUT ROWID`,
      },
      deflate: {
        ddl: `CREATE TABLE kanji (character TEXT PRIMARY KEY, ${kanjiCols})`,
        deflate: true,
      },
    }
  : {
      plain: {
        ddl: `CREATE TABLE terms (id INTEGER PRIMARY KEY, ${termCols})`,
        indexes: [
          `CREATE INDEX terms_expression ON terms (expression)`,
          `CREATE INDEX terms_reading ON terms (reading)`,
        ],
      },
      // One index serves both lookups. With two single-column indexes the planner may pick the reading index.
      composite: {
        ddl: `CREATE TABLE terms (id INTEGER PRIMARY KEY, ${termCols})`,
        indexes: [
          `CREATE INDEX terms_expression_reading ON terms (expression, reading)`,
          `CREATE INDEX terms_reading ON terms (reading)`,
        ],
      },
      // The primary key is the expression index, so the expression is stored once.
      "without-rowid": {
        ddl: `CREATE TABLE terms (id INTEGER NOT NULL, ${termCols}, PRIMARY KEY (expression, reading, id)) WITHOUT ROWID`,
        indexes: [`CREATE INDEX terms_reading ON terms (reading)`],
      },
      deflate: {
        ddl: `CREATE TABLE terms (id INTEGER PRIMARY KEY, ${termCols})`,
        indexes: [
          `CREATE INDEX terms_expression ON terms (expression)`,
          `CREATE INDEX terms_reading ON terms (reading)`,
        ],
        deflate: true,
      },
    };

const pack = (v, deflate) => (deflate ? deflateRawSync(text(v)) : text(v));
const unpack = (v) => JSON.parse(typeof v === "string" ? v : inflateRawSync(v).toString());

function build(name, v) {
  const file = join(work, `${name}.db`);
  const start = process.hrtime.bigint();
  const db = new DatabaseSync(file);
  db.exec(v.ddl);
  const insert = db.prepare(
    isKanji
      ? `INSERT OR REPLACE INTO kanji VALUES (?, ?, ?, ?, ?, ?)`
      : `INSERT INTO terms VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  let rows = 0;
  db.exec("BEGIN");
  for (const bank of banks) {
    for (const r of JSON.parse(readFileSync(join(src, bank), "utf8"))) {
      rows++;
      if (isKanji) insert.run(r[0], r[1], r[2], r[3], pack(r[4], v.deflate), pack(r[5], v.deflate));
      else insert.run(rows, r[0], r[1], r[6], r[2], r[3], r[4], pack(r[5], v.deflate), r[7]);
    }
  }
  for (const sql of v.indexes ?? []) db.exec(sql);
  db.exec("COMMIT");
  db.exec("VACUUM");
  db.close();
  return { file, rows, buildMs: ms(start), bytes: statSync(file).size };
}

function percentiles(times) {
  times.sort((a, b) => a - b);
  return {
    medianMs: times[Math.floor(times.length / 2)],
    p95Ms: times[Math.floor(times.length * 0.95)],
  };
}

// Each lookup fetches all matching rows and decodes the JSON columns, as a real caller would.
function lookups(file, sql, keys, jsonCols) {
  const db = new DatabaseSync(file, { readOnly: true });
  const stmt = db.prepare(sql);
  const times = keys.map((key) => {
    const start = process.hrtime.bigint();
    const rows = stmt.all(...key);
    for (const row of rows) for (const c of jsonCols) unpack(row[c]);
    const took = ms(start);
    assert(rows.length > 0, `no row for ${key}`);
    return took;
  });
  db.close();
  return percentiles(times);
}

const result = {
  zip: basename(zip),
  title: index.title,
  revision: index.revision,
  format: index.format ?? index.version,
  node: process.version,
  sqlite: new DatabaseSync(":memory:").prepare("SELECT sqlite_version() v").get().v,
  cpu: cpus()[0].model,
  zipBytes: statSync(zip).size,
  unzippedBytes,
  unzipMs,
  variants: {},
};

let keys;
for (const [name, v] of Object.entries(variants)) {
  const b = build(name, v);
  const db = new DatabaseSync(b.file, { readOnly: true });
  const table = isKanji ? "kanji" : "terms";
  const count = db.prepare(`SELECT count(*) n FROM ${table}`).get().n;
  if (!isKanji) assert.equal(count, b.rows, "every bank row must be in the table");
  result.bankRows ??= b.rows;
  result.rows ??= count;
  if (!isKanji)
    result.distinctSequences ??= db.prepare(`SELECT count(DISTINCT sequence) n FROM terms`).get().n;
  if (!isKanji)
    result.emptyReadingRows ??= db
      .prepare(`SELECT count(*) n FROM terms WHERE reading = ''`)
      .get().n;
  if (!isKanji)
    result.variants[name] = {
      plan: db
        .prepare(`EXPLAIN QUERY PLAN SELECT * FROM terms WHERE expression = ? AND reading = ?`)
        .get().detail,
    };
  // The same 1,000 random keys for every variant.
  keys ??= db
    .prepare(
      isKanji
        ? `SELECT character FROM kanji ORDER BY random() LIMIT 1000`
        : `SELECT expression, reading FROM terms ORDER BY random() LIMIT 1000`,
    )
    .all()
    .map((r) => Object.values(r));
  db.close();
  result.variants[name] = {
    ...result.variants[name],
    bytes: b.bytes,
    buildMs: Math.round(b.buildMs),
  };
  if (isKanji) {
    result.variants[name].byCharacter = lookups(
      b.file,
      `SELECT * FROM kanji WHERE character = ?`,
      keys,
      ["meanings", "stats"],
    );
  } else {
    result.variants[name].byExpression = lookups(
      b.file,
      `SELECT * FROM terms WHERE expression = ?`,
      keys.map((k) => [k[0]]),
      ["glossary"],
    );
    result.variants[name].byExpressionAndReading = lookups(
      b.file,
      `SELECT * FROM terms WHERE expression = ? AND reading = ?`,
      keys,
      ["glossary"],
    );
  }
}
console.log(JSON.stringify(result, null, 2));
