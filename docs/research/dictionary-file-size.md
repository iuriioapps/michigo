# Size of an indexed Dictionary file

Research for [How large is an indexed Dictionary file?](https://github.com/iuriioapps/michigo/issues/76). Measured on 2026-11-13.

## Question

How large is the indexed read-only file that Michigo builds from JMdict, JMnedict and KANJIDIC2, how long does the build take, and how long does a lookup take?

[What does storage, import and export cover?](https://github.com/iuriioapps/michigo/issues/46) decided that each Dictionary is its own indexed read-only file, built on import with `node:sqlite`. It listed the size as not measured.

## Short answer

With a plain schema, JMdict (English) is 202 MB, JMnedict is 62 MB and KANJIDIC is 3.3 MB. That is 268 MB for the three, from 27.8 MB of downloads. The builds take 6.8 s, 3.5 s and 0.13 s. A lookup takes 20 to 35 microseconds at the median.

| Dictionary         | Download | Rows    | Plain file | Build  | Lookup by spelling (median, p95) |
| ------------------ | -------- | ------- | ---------- | ------ | -------------------------------- |
| JMdict (English)   | 15.6 MB  | 527,778 | 202.3 MB   | 6.8 s  | 26 µs, 59 µs                     |
| JMnedict           | 11.4 MB  | 668,033 | 62.5 MB    | 3.5 s  | 20 µs, 29 µs                     |
| KANJIDIC (English) | 0.72 MB  | 10,384  | 3.3 MB     | 0.13 s | 23 µs, 31 µs                     |

Three things stand out:

- The JMdict file is larger than its unzipped JSON (171 MB), which is 11 times the size of the zip. The glossary is Yomitan structured content.
- Storing the glossary compressed cuts JMdict to 127 MB, but the build goes from 7 s to more than 4 minutes.
- **With one index on spelling and one on reading, a lookup by spelling plus reading in JMnedict takes 55 ms, not 25 µs.** A combined index on spelling and reading removes the problem.

## Setup

### Machine and versions

| Item                          | Value                                    |
| ----------------------------- | ---------------------------------------- |
| CPU                           | Intel(R) Core(TM) i9-9880H CPU @ 2.30GHz |
| OS                            | macOS (Darwin 25.6.0), internal SSD      |
| Node                          | v24.22.1                                 |
| SQLite (inside `node:sqlite`) | 3.53.4                                   |
| Page size                     | 4,096 bytes (default)                    |

### Input files

The three zips come from the [jmdict-yomitan release 2026-11-13](https://github.com/yomidevs/jmdict-yomitan/releases/tag/2026-11-13). All are Yomitan format 3.

| File | Revision | Zip | Unzipped | `unzip` time |
| --- | --- | --- | --- | --- |
| `JMdict_english.zip` | JMdict.2026-11-13 | 15,628,711 bytes | 171,432,317 bytes | 0.63 s |
| `JMnedict.zip` | JMnedict.2026-11-13 | 11,432,840 bytes | 45,437,800 bytes | 0.29 s |
| `KANJIDIC_english.zip` | kanjidic2.2026-317 | 721,032 bytes | 3,052,687 bytes | 0.03 s |

### Script

The script is [`dictionary-file-size/measure.mjs`](dictionary-file-size/measure.mjs). It has no dependencies beyond Node 24 and the system `unzip`.

```sh
node docs/research/dictionary-file-size/measure.mjs <dictionary.zip> <new-empty-work-dir>
```

It unzips the file, builds every variant, runs the lookups and prints one JSON object. It asserts that every bank row is in the table and that every lookup returns a row.

### Schema

The terms table has one row per row of a Yomitan term bank.

```sql
CREATE TABLE terms (
  id INTEGER PRIMARY KEY,
  expression TEXT NOT NULL,
  reading TEXT NOT NULL,
  sequence INTEGER,
  definition_tags TEXT,
  rules TEXT,
  score INTEGER,
  glossary,          -- JSON text
  term_tags TEXT
);
CREATE INDEX terms_expression ON terms (expression);
CREATE INDEX terms_reading ON terms (reading);
```

The kanji table has one row per row of a Yomitan kanji bank.

```sql
CREATE TABLE kanji (
  character TEXT PRIMARY KEY,
  onyomi TEXT,
  kunyomi TEXT,
  tags TEXT,
  meanings,          -- JSON text
  stats              -- JSON text
);
```

All rows are inserted in one transaction. The indexes are created after the inserts, inside the same transaction. `VACUUM` runs last.

### Variants

| Variant | Difference from the plain schema |
| --- | --- |
| plain | None. |
| composite | The spelling index is on `(expression, reading)`. The reading index stays. |
| without-rowid | `WITHOUT ROWID` with primary key `(expression, reading, id)`, plus the reading index. For kanji: `WITHOUT ROWID` on the same table. |
| deflate | Plain, with the JSON columns stored as raw deflate from `node:zlib`, one call per value. |

### What a number means

- A megabyte is 1,000,000 bytes.
- Build time covers reading and parsing the JSON banks, the inserts, the indexes and `VACUUM`. It does not cover the download or `unzip`.
- A lookup fetches all matching rows with a prepared statement and decodes the JSON columns (with inflate in the deflate variant).
- The 1,000 keys are random rows of the dictionary, the same for every variant of one dictionary. Every lookup hits. A key can have an empty reading.
- The file was written just before the lookups, so the operating system cache is warm.

## Results

### Entry counts

| Dictionary         | Rows    | Distinct sequence numbers | Rows with an empty reading |
| ------------------ | ------- | ------------------------- | -------------------------- |
| JMdict (English)   | 527,778 | 231,612                   | 20,875                     |
| JMnedict           | 668,033 | 613,382                   | 498,923                    |
| KANJIDIC (English) | 10,384  | not applicable            | not applicable             |

A Yomitan term bank can hold several rows for one entry, so the row count is higher than the entry count.

In JMdict, 219,069 sequence numbers are positive, which is close to the 219,051 entries in [Which dictionaries can Michigo ship or import?](https://github.com/iuriioapps/michigo/issues/34). Of those, 7,306 are 5,000,000 or higher, the range of JMnedict. The other 12,543 sequence numbers are negative. They belong to the 20,875 rows with an empty reading, and each of those rows is a pointer to another spelling.

In JMnedict, 166,591 sequence numbers are 5,000,000 or higher and 446,791 are lower, starting at 1. The upstream file has 744k entries and KANJIDIC2 has 13,108 kanji. This research did not find out why the Yomitan builds have fewer.

### File size

| Dictionary         | plain    | composite | without-rowid | deflate  |
| ------------------ | -------- | --------- | ------------- | -------- |
| JMdict (English)   | 202.3 MB | 211.5 MB  | 216.8 MB      | 127.3 MB |
| JMnedict           | 62.5 MB  | 66.5 MB   | 57.1 MB       | 63.1 MB  |
| KANJIDIC (English) | 3.32 MB  | not built | 3.20 MB       | 2.43 MB  |
| Sum                | 268.1 MB |           | 277.1 MB      | 192.8 MB |

`WITHOUT ROWID` shrinks JMnedict by 9% and grows JMdict by 7%. Deflate shrinks JMdict by 37% and KANJIDIC by 27%. It grows JMnedict by 1%, because its glossaries are short.

### Build time

| Dictionary         | plain  | composite | without-rowid | deflate |
| ------------------ | ------ | --------- | ------------- | ------- |
| JMdict (English)   | 6.8 s  | 7.0 s     | 13.7 s        | 278 s   |
| JMnedict           | 3.5 s  | 3.3 s     | 7.1 s         | 355 s   |
| KANJIDIC (English) | 0.13 s | not built | 0.13 s        | 2.2 s   |

The deflate times come from one synchronous `deflateRawSync` call per value, which costs about 0.1 to 0.5 ms each. An earlier run with two builds in parallel gave 222 s and 258 s, so these two numbers vary by run. The other build times differed by less than 20% between runs.

### Lookup by spelling

Median and p95 over 1,000 lookups, in microseconds.

| Dictionary                       | plain  | composite | without-rowid | deflate |
| -------------------------------- | ------ | --------- | ------------- | ------- |
| JMdict (English)                 | 26, 59 | 35, 78    | 35, 79        | 55, 151 |
| JMnedict                         | 20, 29 | 23, 29    | 21, 26        | 40, 70  |
| KANJIDIC (English), by character | 23, 31 | not built | 23, 29        | 46, 69  |

### Lookup by spelling plus reading

Median and p95 over 1,000 lookups, in microseconds unless a unit is given.

| Dictionary       | plain            | composite | without-rowid | deflate          |
| ---------------- | ---------------- | --------- | ------------- | ---------------- |
| JMdict (English) | 34, 148          | 32, 53    | 32, 53        | 57, 234          |
| JMnedict         | 54.9 ms, 63.2 ms | 24, 29    | 26, 31        | 51.3 ms, 60.7 ms |

## Findings beyond the numbers

### The planner picks the reading index

With two single-column indexes, SQLite answers `WHERE expression = ? AND reading = ?` through the reading index in the plain and deflate variants:

```text
SEARCH terms USING INDEX terms_reading (reading=?)
```

In JMnedict, 498,923 of 668,033 rows have an empty reading, so a lookup with an empty reading walks 75% of the table. That is the 55 ms. The composite variant gets this plan and stays at 24 µs:

```text
SEARCH terms USING INDEX terms_expression_reading (expression=? AND reading=?)
```

The script does not run `ANALYZE`. Whether `ANALYZE` alone changes the plan was not measured.

### Most JMnedict rows have no reading in the reading field

In this JMnedict build, 498,923 rows (75%) have an empty reading field, and the glossary holds the readings instead. An example row is spelling `飯利`, reading empty, tag `surname`, glossary `["いいり"]`. A lookup by spelling plus reading cannot match such a row through the reading column. This affects the match rule in [How does Michigo find Dictionary entries for a word and choose the gloss?](https://github.com/iuriioapps/michigo/issues/68).

In JMdict, the 20,875 rows with an empty reading are pointers to another spelling of the same entry. The other 506,903 rows have a reading. For a kana spelling the reading repeats the spelling (137,867 rows).

### JMdict is large because of structured content

The English JMdict build stores each glossary as Yomitan structured content (nested JSON with tags and styles). The unzipped banks are 171 MB for 527,778 rows, about 325 bytes per row. The release also has `JMdict_english_legacy.zip` (10.1 MB zip), which this research did not measure.

## Not measured

- Lookup time with a cold operating system cache, and the time to open the file.
- A lookup that finds nothing.
- The tag banks (`tag_bank_N.json`). The script does not store them. They are a few kilobytes.
- Other compression: zstd, a shared dictionary, or one compressed block per several rows.
- The legacy JMdict build, the build without proper names, and a build from the upstream EDRDG XML.
- A second machine. All numbers come from one 2019 Intel laptop.
