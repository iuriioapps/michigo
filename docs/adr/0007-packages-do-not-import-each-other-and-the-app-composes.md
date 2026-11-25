# Packages do not import each other, and the app composes them

Michigo v1 has twelve packages. Each one imports `core` and no other package, with one exception: `storage` imports the store interfaces of the packages it serves. The desktop app combines the packages itself. It is the only app in v1.

```text
apps/desktop ─┬─> storage ──────────────> vocab, reference, pitch, audio ─┐
              └─> tokenizer, source, grammar, anki, manifest, log ────────┴─> core
```

Most learner actions need several capabilities. "Update from Anki" reads fields through `anki`, splits them with `tokenizer` and marks words through `vocab`. If packages imported each other for this, the graph would grow layers that are hard to state and easy to break. With one flat rule, a package can be read, tested and replaced alone, and its `package.json` enforces the rule: pnpm refuses an import that the package does not declare.

## The packages

| Package | Holds |
| --- | --- |
| `core` | Schemas: the data shapes that packages and the renderer exchange, such as a token and the word query |
| `storage` | Every store, with one strategy per backend, plus Snapshot and Backup. See ADR 0002 |
| `tokenizer` | The native Lindera binding, the build constant of the Tokenizer dictionary and its hash, the passes around the tokenizer, and Compound matching |
| `source` | One strategy per Source format, and the cleanup into Lines |
| `grammar` | Grammar Patterns, and the label of an inflected form as a separate export |
| `reference` | Readers for the import schemas, and the lookups for Dictionary entries, JLPT level and Frequency rank |
| `pitch` | Pitch dictionary rows, the order of Pitch dictionaries, the lookup, the split of a reading into morae, the high and low pattern of a value, and the card markup for Pitch accent |
| `vocab` | Projects, stored Sources, the Word Bank, Word Lists, Known, Coverage, Examples and CSV |
| `anki` | The AnkiConnect client, the maturity rule, and card formats with their markers |
| `audio` | Audio Sources, one strategy each, and the pipeline that produces a file |
| `manifest` | Fetch of the Manifest, download with resume, hash check and atomic install |
| `log` | The logger that every process uses, the log file and its rotation, and the renderer hook for uncaught errors |

## The rules

- **`core` is not a place for logic.** A thing enters `core` only when it is a data shape that two packages, or a package and the renderer, exchange. Logic goes to the package that owns the capability.
- A package that logs takes a `Logger` as an argument. `core` declares the `Logger` type, and only the app and the worker entries it owns import `log`.
- A package that keeps data declares its store, and `storage` implements it. No package but `storage` holds SQL.
- A package that needs the output of another package takes it as an argument. `grammar` takes tokens, `pitch` takes the pitch rows that `reference` reads from an archive, and `anki` takes the finished values of a card.
- Only `tokenizer` imports the native binding. It names `lindera` as a peer dependency, and the desktop app carries it in `dependencies`.
- A package knows nothing about Electron. The desktop app decides which process runs what, and it passes API keys and folder paths to `audio`.
- The scripts that build the Tokenizer dictionary and the UniDic Pitch dictionary live in `scripts/` at the repo root. They are not a package.

## Considered options

- One package that holds each learner action once, between the app and the other packages. Rejected: v1 has one app, so the app is that place. Access for AI agents, if a later version adds it, goes through the running desktop app and reuses the same composition.
- Layers, where a package may import the packages below it. Rejected: every new feature would reopen the question of which layer a package sits in.
- Store interfaces, the tokenize contract and pure helpers in `core`. Rejected: `core` would collect everything that has no obvious home.
- Store interfaces inside `storage`. Rejected: `storage` would define what each package needs, and a package could not be tested without it.
- Pitch code inside `reference`. Rejected: pitch has its own rules (order of Pitch dictionaries, morae, the card markup).
- One package each for Dictionary, JLPT list and Frequency list. Rejected: they share the archive readers and the same shape of lookup from a word's Spellings and readings.
- `audio` and `manifest` inside the desktop app. Rejected: `audio` has replaceable implementations, and `manifest` checks the hash of the Tokenizer dictionary and reads an untrusted Manifest. Both need tests that run without Electron.
- Packages for `media`, `ocr` and `llm`. Rejected: the file store covers media, and nothing in v1 uses the other two.

## Consequences

The desktop app holds real code: each learner action that spans packages is composed there.

`storage` depends on the four packages that declare a store, so a new field in a store is a change in two packages.

The Vite build of the Electron main process fails when it meets the native binding. The main build must list `lindera` as external. Checked with `lindera` 6.2.0 in a workspace package: the binding loads in an Electron 44.4.5 main process.
