# Storage is its own package behind asynchronous ports

Storage lives in `packages/storage`. Each package that keeps data declares the store it needs as an asynchronous interface in domain terms. `storage` implements every store, with one strategy per backend. v1 ships one strategy for data, `node:sqlite`, and one for files, a local folder. The apps create the stores and hand them to the packages, which never import an engine.

`node:sqlite` is synchronous and is still a release candidate. Remote storage is out of v1 but planned, and every remote database is asynchronous. Callers that use a synchronous API would all need a rewrite on the day a remote store arrives, so the stores are asynchronous now, while the cost is only an `await`. The same interfaces contain the engine risk: `better-sqlite3` can replace `node:sqlite` without a change in any caller.

One database file, `michigo.db`, holds the learner's data together with frequency lists and JLPT lists, because the learner sorts and filters the Word Bank by them. Each Dictionary is a separate indexed read-only file in `reference/`. The Word Bank never depends on a Dictionary, so nothing in the database may reference one, and a dictionary lookup is a point query by word. Media files live under `media/`, grouped by owner, and the database stores paths relative to that folder.

## Stores and queries

**SQL exists only in `storage`.** No other package holds a query, a table name or a query builder. `storage` owns the tables of `michigo.db` and one ordered list of migrations, and it also implements the store for the indexed Dictionary files.

A store speaks in domain terms. A question with one fixed shape is a named method: the Coverage counts of a Source, the Examples of a word. A list of words is one method that takes a word query: a scope, filters over a closed list of word fields, a sort and a page. The word query is a schema in `core`, because the renderer sends the same object over IPC and the main process validates it there. A new filter is one new field in that list and one column mapping in `storage`.

A remote store of the SQL family (libSQL, D1, Postgres) is the target for later, because it translates a word query the same way. A store without joins, such as DynamoDB, can implement the same interfaces, but v1 plans nothing for it.

## The package rule

A capability that has its own external dependency or a replaceable implementation gets its own package. `core` holds only schemas. Before you create a package, check whether an existing package already owns the capability: remote storage belongs in `storage`. The full layout is in `0007-packages-do-not-import-each-other-and-the-apps-compose.md`.

## Considered options

- Storage code inside `core`. Rejected: `core` would gain an engine dependency, and each later capability (TTS, tokenizer, OCR) would follow it there.
- Synchronous ports that match `node:sqlite`. Rejected: remote storage would force a rewrite of every caller.
- One generic database port (query, run, transaction) with the SQL in the packages that call it. Rejected: every package would know the table layout, so a schema change would touch all of them.
- A typed query builder in the other packages. Rejected: it removes the SQL strings, but the packages still know the tables and the joins, and it adds a dependency.
- One store method per filter. Rejected: the learner filters a word view by any attribute, so the methods would multiply. The word query covers them with one method.
- A design that fits DynamoDB from the start. Rejected: every filter and sort would need a plan in advance, for a backend that nobody has asked for.
- `better-sqlite3` as the engine. Rejected for now: it is a native module that must be built for each platform, and `node:sqlite` is already inside Electron and Node.
- Dictionaries inside `michigo.db`. Rejected: they are the largest data and can be downloaded again, so they would inflate every Snapshot for no benefit to any query.
- A second database file for all Reference data. Rejected: frequency lists and JLPT lists take part in Word Bank queries, and a join across files gives up atomic writes.
- A data directory that the learner places in a synced folder. Rejected: a sync client copies the database and its WAL file separately and can corrupt a live database. A Backup is one closed file and is safe there.

## Consequences

Removing or updating a Dictionary is a file operation. A Snapshot stays small, and a Backup includes Dictionaries and media only when the learner ticks them. Heavy writes still block the thread that runs `node:sqlite`, so the SQLite implementation must move them to a worker.

`storage` is the largest package, because every query lands there. It keeps one folder per store. The renderer cannot ask for a filter that the word query does not name.
