# Storage is its own package behind asynchronous ports

Storage lives in `packages/storage`. The package defines two ports, a database port and a file store port, and both are asynchronous. v1 ships one implementation of each: `node:sqlite` and a local folder. The apps hand the storage to `vocab` and `anki`, which never import an engine.

`node:sqlite` is synchronous and is still a release candidate. Remote storage is out of v1 but planned, and every remote database is asynchronous. Callers that use a synchronous API would all need a rewrite on the day a remote store arrives, so the ports are asynchronous now, while the cost is only an `await`. The same ports contain the engine risk: `better-sqlite3` can replace `node:sqlite` without a change in any caller.

One database file, `michigo.db`, holds the learner's data together with frequency lists and JLPT lists, because the learner sorts and filters the Word Bank by them. Each Dictionary is a separate indexed read-only file in `reference/`. The Word Bank never depends on a Dictionary, so nothing in the database may reference one, and a dictionary lookup is a point query by word. Media files live under `media/`, grouped by owner, and the database stores paths relative to that folder.

## The package rule

A capability that has its own external dependency or a replaceable implementation gets its own package. `core` holds only schemas and shared pure logic. Before you create a package, check whether an existing package already owns the capability: remote storage belongs in `storage`.

## Considered options

- Storage code inside `core`. Rejected: `core` would gain an engine dependency, and each later capability (TTS, tokenizer, OCR) would follow it there.
- Synchronous ports that match `node:sqlite`. Rejected: remote storage would force a rewrite of every caller.
- `better-sqlite3` as the engine. Rejected for now: it is a native module, so it must go in `dependencies` and cannot be inlined into the one-file CLI.
- Dictionaries inside `michigo.db`. Rejected: they are the largest data and can be downloaded again, so they would inflate every Snapshot for no benefit to any query.
- A second database file for all Reference data. Rejected: frequency lists and JLPT lists take part in Word Bank queries, and a join across files gives up atomic writes.
- A data directory that the learner places in a synced folder. Rejected: a sync client copies the database and its WAL file separately and can corrupt a live database. A Backup is one closed file and is safe there.

## Consequences

Removing or updating a Dictionary is a file operation. A Snapshot stays small, and a Backup includes Dictionaries and media only when the learner ticks them. Heavy writes still block the thread that runs `node:sqlite`, so the SQLite implementation must move them to a worker.
