# Local database and full text search for Japanese text

Research for issue #39. Question: which local database fits Electron main (Electron 44, Node 24.21.0) and the bundled CLI, and how well does each one search Japanese text?

Researched on 2026-11-11. Every "measured" claim below was run on this machine (macOS, Apple Silicon) inside Electron 44.4.5 with `ELECTRON_RUN_AS_NODE=1`, so it reflects the Node and SQLite that ship in the app. The scripts are not committed; the method is described next to each result.

## Constraints from the repo

These come from `CLAUDE.md` and `pnpm-workspace.yaml`.

- The database runs in Electron main or in the CLI, never in the renderer. The renderer imports only `@michigo/core/schemas`, which must stay free of `node:*`.
- App `dependencies` are reserved for things that cannot be bundled, such as native modules. Anything in `devDependencies` gets bundled.
- The CLI ships as one self-contained file with no install-time dependencies.
- New dependencies with install scripts must be added to `allowBuilds`.
- Shared packages are typed against Node 24 because Electron 44 bundles Node 24.21.0.

## Why Japanese breaks ordinary full text search

Word-based tokenizers split on spaces and punctuation. Japanese has no spaces, so a whole clause becomes one token.

SQLite's default `unicode61` tokenizer treats every character in Unicode categories L and N as a token character, and "each contiguous run of one or more token characters is considered to be a token" ([FTS5, section 4.3.1](https://www.sqlite.org/fts5.html#unicode61_tokenizer)). Measured: indexing `吾輩は猫である。名前はまだ無い。` with `unicode61` produced the two terms `吾輩は猫である` and `名前はまだ無い`, and a search for `猫` matched nothing.

PostgreSQL's `simple` text search config behaves the same way. Measured in PGlite: `to_tsvector('simple', '吾輩は猫である。名前はまだ無い。')` returned `'名前はまだ無い':2 '吾輩は猫である':1`.

That leaves three approaches. Each option below is judged against them.

| Approach | How it works | Main limit |
| --- | --- | --- |
| Character n-grams | Index every 3-character substring (trigram) | Queries shorter than 3 characters cannot use the index |
| External tokens | Segment text in JavaScript first (the tokenizer from issue #33), then store tokens separated by spaces or as rows | Search quality equals tokenizer quality; reindex when the tokenizer changes |
| Native morphological tokenizer | A C or Rust tokenizer plugged into the database (for example Lindera with IPADIC) | Adds a native binary per platform plus a dictionary |

## Options at a glance

| Option | Packaging | Japanese search | Persistence in Node | Fits the bundling rules |
| --- | --- | --- | --- | --- |
| `node:sqlite` | Built into Node and Electron | FTS5 trigram, external tokens | File on disk | Yes, nothing to bundle or ship |
| `better-sqlite3` | Native module (N-API since v13) | FTS5 trigram, external tokens, loadable tokenizers | File on disk | App `dependencies`; breaks the single-file CLI |
| `@sqlite.org/sqlite-wasm` | WASM, bundled | FTS5 trigram, external tokens | No file VFS for Node; memory only | Bundles, but no durable storage in main |
| `sql.js` | WASM, bundled | No FTS5 in the default build | Memory, export whole file | Bundles; no FTS5 |
| PGlite | WASM Postgres, bundled | `pg_trgm` works on Japanese | Directory on disk (NodeFS) | Bundles; about 26 MB package |
| DuckDB (`@duckdb/node-api`) | Native module | FTS extension is English-oriented | File on disk | App `dependencies`; not verified hands-on |
| Lindera SQLite tokenizer | Native loadable extension | Morphological (IPADIC, UniDic) | Not a database; plugs into SQLite | A `.dylib`/`.dll`/`.so` per platform |

## node:sqlite

### Packaging

`node:sqlite` is part of Node. It was added in v22.5.0, unflagged in v22.13.0, and marked "Stability: 1.2 - Release candidate" in v24.15.0 ([Node 24 sqlite docs](https://nodejs.org/docs/latest-v24.x/api/sqlite.html)). Electron 44.4.5 reports Node 24.21.0, so the release candidate status applies.

Measured: inside Electron 44.4.5 it loads with no flag and no warning. `process.versions.sqlite` is 3.53.4. The compile options include `ENABLE_FTS5`, `ENABLE_FTS3`, `ENABLE_RTREE`, `ENABLE_SESSION`, `ENABLE_DBSTAT_VTAB` and `ENABLE_MATH_FUNCTIONS`. ICU is not compiled in. The plain Node 24.22.1 on this machine reports the same SQLite version and options.

Measured: `tsdown` leaves `import { DatabaseSync } from "node:sqlite"` as an import in the output, and the bundled file runs. So the single-file CLI keeps working. The Vite main-process build was not tried; it already handles other `node:*` imports.

Note: `node:sqlite` exists only with the `node:` prefix. It appears in `module.builtinModules` as `node:sqlite`, not `sqlite`.

### API surface relevant here

From the [Node 24 docs](https://nodejs.org/docs/latest-v24.x/api/sqlite.html):

- `DatabaseSync` is synchronous. Calls block the thread they run on.
- `sqlite.backup(sourceDb, path)` performs an online backup and returns a promise (added v23.8.0).
- `createSession()` and `applyChangeset()` expose SQLite sessions and changesets (added v22.12.0).
- `serialize()` and `deserialize()` (added v24.16.0) turn a database into a buffer and back.
- `loadExtension()` works only when the database is opened with `allowExtension: true` (added v22.13.0).
- The `defensive` option is on by default since v24.14.0.

### Japanese search

Measured in Electron with three rows (`吾輩は猫である。名前はまだ無い。`, `東京都に住んでいます`, `猫が好き`):

- `tokenize='trigram'` with `MATCH '猫であ'` found the right row.
- `MATCH '猫'` (1 character) and `MATCH '東京'` (2 characters) returned nothing.
- `LIKE '%猫%'` on the trigram table returned both cat rows, by scanning.
- Text stored as pre-split tokens (`吾輩 は 猫 で ある`) in a `unicode61` table matched `猫`.

This matches the documentation: "Substrings consisting of fewer than 3 unicode characters do not match any rows when used with a full-text query", and trigram tables also serve `LIKE` and `GLOB` from the index ([FTS5, section 4.3.4](https://www.sqlite.org/fts5.html#the_trigram_tokenizer)). Trigram indexes arrived in SQLite 3.34.0 ([release log](https://www.sqlite.org/releaselog/3_34_0.html)).

Many Japanese words are one or two characters (猫, 東京, 日本). With trigram alone, those need a fallback, such as a `LIKE` scan or a token table.

A custom FTS5 tokenizer written in JavaScript is not possible here. FTS5 registers tokenizers through the C `fts5_api` struct, obtained with `sqlite3_bind_pointer()` ([FTS5, section 7](https://www.sqlite.org/fts5.html#extending_fts5)). The `node:sqlite` docs expose no way to do that. A native tokenizer such as Lindera can still be loaded with `loadExtension()`.

### Performance at Michigo's scale

Measured with synthetic data: 3000 Sources, 1000 tokens each (3 million tokens), drawn from a 20000-word vocabulary of 1 to 3 kanji with a skewed frequency. Schema: a `source` table holding the text, an external-content FTS5 trigram table over it, a `token` table, and an `occurrence(source_id, token_id, pos)` table with an index on `(token_id, source_id)`. Run on one thread inside Electron.

| Measurement                                      | Result        |
| ------------------------------------------------ | ------------- |
| Insert everything in one transaction             | 34 s          |
| Database file after checkpoint                   | 155 MB        |
| FTS5 trigram index (`source_fts_data`)           | 48 MB         |
| `occurrence` rows plus its index                 | 87 MB         |
| Raw text (`source`)                              | 18 MB         |
| Trigram `MATCH` for a 3, 4 or 6 character string | 0.3 to 0.4 ms |
| `LIKE '%…%'` scan over all text                  | 30 ms         |
| `LIKE` on the trigram table, 3 characters        | 6 ms          |
| Sources containing a very common token           | 6 ms          |
| Distinct tokens in one Source                    | 0.4 ms        |
| Online `backup()` of the 155 MB file             | 0.7 s         |

Takeaways:

- At this scale even a full `LIKE` scan takes about 30 ms. Search speed is not the hard part.
- Storing every token occurrence costs more space than the trigram index. Storing per-Source token counts instead of positions would shrink it; this was not measured.
- Bulk import blocks for tens of seconds. Because `DatabaseSync` is synchronous, heavy writes in Electron main would freeze the app. A `worker_threads` worker or an Electron `utilityProcess` avoids that. This was not tried.

### Backup, import and export

- Online backup: `sqlite.backup()`, measured above.
- Single-file copy: `VACUUM INTO 'file'` is plain SQL.
- Export as data: `serialize()` gives a buffer; JSON and CSV can be produced with ordinary queries (`json_object`, `json_group_array` are available).
- Sync and merge: sessions and changesets.
- The file is a standard SQLite database, readable by the `sqlite3` CLI, DB Browser for SQLite and any other SQLite library.

## better-sqlite3

### Packaging

A native module. Version 13.0.0 "is the first version of `better-sqlite3` to run on the N-API", with prebuilt binaries now "published directly with the `better-sqlite3` code itself" ([v13.0.0 release notes](https://github.com/WiseLibs/better-sqlite3/releases/tag/v13.0.0)). The npm tarball for 13.0.3 (the current `latest` tag) contains prebuilds for darwin, linux, linuxmusl and win32, each on x64 and arm64. Its unpacked size is 27 MB. License: MIT.

Before v13, prebuilds were per Electron ABI. The last such release, 12.12.0, stops at `electron-v148`. Electron 44 reports `process.versions.modules` 149, so a v12 install would need a rebuild with `@electron/rebuild`, as the [Electron native modules guide](https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules) describes. Whether the v13 N-API prebuilds load in Electron 44 without a rebuild was not tested.

Under the repo rules it belongs in app `dependencies`. It also cannot be inlined into the single-file CLI, since a `.node` binary must sit next to it on disk.

### Japanese search

It bundles SQLite 3.54.1 with `SQLITE_ENABLE_FTS5` and no ICU ([compilation docs](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/compilation.md)). Search options are therefore the same as `node:sqlite`: trigram, external tokens, or a native tokenizer via `loadExtension()`. One extra: it can be built against a custom SQLite amalgamation (`--build-from-source --sqlite3=…`), which would allow compiling a tokenizer in.

### Backup, import and export

`backup()` with progress callbacks, `serialize()`, and `loadExtension()` ([API docs](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md)). Same file format as above.

## Official SQLite WASM

`@sqlite.org/sqlite-wasm` 3.54.1 is 2.9 MB installed and bundles cleanly as JavaScript plus WASM.

Measured in Electron: FTS5 trigram works and matched `猫であ`. The registered VFS list in Node was `unix-none, memdb, kvvfs, unix-excl, unix-dotfile, unix`, and `oo1.OpfsDb` was undefined.

The persistence docs describe only browser storage: kvvfs on `localStorage`, and OPFS variants that work in Worker threads only ([persistence docs](https://sqlite.org/wasm/doc/trunk/persistence.md)). They do not mention Node. The `unix` VFS names appear in the list, but whether they reach the real file system under Node was not tested. The safe reading is that in Electron main this option is in-memory, with whole-file export for durability.

## sql.js

`sql.js` 1.16.0 (SQLite 3.54.1) is 30 MB installed. Measured: its compile options include FTS3 but not FTS5, and `CREATE VIRTUAL TABLE … USING fts5` fails with `no such module: fts5`. So the default build offers no trigram tokenizer. The database lives in memory and is saved by exporting the whole file.

## PGlite

PGlite 0.5.16 is PostgreSQL 18.6 compiled to WASM. The npm package is 26 MB installed.

### Japanese search

`pg_trgm` ships in the main package ([extensions list](https://pglite.dev/extensions/)). `pg_bigm` and PGroonga, the Postgres extensions built for Japanese, are not on that list.

Measured in Electron: the server encoding is UTF8. `show_trgm('猫である')` returns hashed trigrams (non-ASCII trigrams are stored as hashes). A GIN `gin_trgm_ops` index served `ILIKE '%猫であ%'`, confirmed with `EXPLAIN` as a bitmap index scan, and returned the right row. Queries shorter than 3 characters were not tested.

### Persistence, backup, export

In Node, PGlite stores data in a directory: `new PGlite('./path/to/datadir/')` or `new NodeFS(…)` ([filesystems docs](https://pglite.dev/docs/filesystems)). `dumpDataDir()` and `loadDataDir` export and restore a data directory. The docs say nothing on NodeFS durability or concurrent access. Standard SQL `COPY` and JSON functions cover export. A data directory is less portable than a single SQLite file.

The API is async, which suits Electron main better than a synchronous driver, but the work still runs on the calling thread.

## DuckDB

DuckDB is an analytical database. Its Node client is native, so it would live in app `dependencies`.

The `fts` extension defaults to the Porter stemmer, English stopwords, and an ignore pattern `(\\.|[^a-z])+` that drops everything except lowercase a to z ([FTS docs](https://duckdb.org/docs/2.0/core_extensions/full_text_search.html)). Japanese would need custom settings and pre-split text. The index does not update when the table changes unless created with `incremental = 1`. The extension is "transparently autoloaded on first use from the official extension repository", which means a network fetch unless bundled. Not tried hands-on.

## Native Japanese tokenizer: Lindera for SQLite

[lindera-sqlite](https://github.com/lindera/lindera-sqlite) is an MIT-licensed Rust library that registers an FTS5 tokenizer: `CREATE VIRTUAL TABLE t USING fts5(content, tokenize='lindera_tokenizer')`. It is loaded as an extension with entry point `lindera_fts5_tokenizer_init`. Dictionaries are compiled in by feature flag: IPADIC, IPADIC NEologd, UniDic.

Release v2.0.0 (2026-01-11) publishes zips per platform and dictionary for macOS, Linux and Windows on x64 and arm64. It is a small project (24 stars).

With `node:sqlite` this needs `allowExtension: true` and a shipped binary per platform. That is a native artifact, so it collides with the "no native code" preference and with the single-file CLI. Not loaded in this research.

## What the evidence leaves open

- Whether search should even be morphological. If Michigo already tokenizes every Source for coverage (issue #33), the same tokens can feed search, and trigram covers free substring search.
- Whether heavy writes need a worker or `utilityProcess`. The measured 34 s bulk import says yes for large imports; this was not tried.
- Whether `better-sqlite3` v13 loads in Electron 44 without a rebuild.
- Whether the official SQLite WASM build can write real files under Node.
- PGlite performance at a few million rows. Not measured.

## Recommendation

This section is a recommendation, not a finding.

`node:sqlite` is the only option that meets every packaging rule with nothing to ship: no native module, no WASM blob, no change to the single-file CLI, and it already includes FTS5 with the trigram tokenizer. Its measured speed at the target scale is well within need. Pairing a trigram FTS5 table for substring search with a token table fed by the tokenizer from issue #33 covers short words too. The risks are its release candidate status and its synchronous API, which argues for running bulk writes off the main thread.

PGlite is the runner-up if Postgres features matter, at a cost of about 26 MB and a data directory instead of one file. `better-sqlite3` or Lindera become relevant only if a native dependency is accepted.
