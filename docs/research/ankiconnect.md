# What AnkiConnect exposes

Research for issue #37. Checked on 2026-11-11 against AnkiConnect `master` at commit `c577b44` (tag `26.10.14.0` plus 3 commits) and Anki at commit `2ac9aee` (latest release 26.09.4).

## Sources

| Source | What it settles |
| --- | --- |
| [AnkiConnect repository](https://git.sr.ht/~foosoft/anki-connect) (sourcehut, current home) | Everything about the add-on |
| [README.md](https://git.sr.ht/~foosoft/anki-connect/tree/master/item/README.md) | Install, minimum Anki version, config, troubleshooting |
| [API_V1.md](https://git.sr.ht/~foosoft/anki-connect/tree/master/item/API_V1.md) and [api-v1.schema.json](https://git.sr.ht/~foosoft/anki-connect/tree/master/item/api-v1.schema.json) | The new JSON-RPC API |
| [API_LEGACY.md](https://git.sr.ht/~foosoft/anki-connect/tree/master/item/API_LEGACY.md) | The old action API (version 6) |
| [ARCHITECTURE.md](https://git.sr.ht/~foosoft/anki-connect/tree/master/item/ARCHITECTURE.md) | Threading, sessions, platform notes |
| [plugin/services.py](https://git.sr.ht/~foosoft/anki-connect/tree/master/item/plugin/services.py), [plugin/web.py](https://git.sr.ht/~foosoft/anki-connect/tree/master/item/plugin/web.py), [plugin/\_\_init\_\_.py](https://git.sr.ht/~foosoft/anki-connect/tree/master/item/plugin/__init__.py) | Duplicate check, origin check, version gate |
| [Anki manual](https://github.com/ankitects/anki-manual/tree/main/src): `searching.md`, `stats.md`, `files.md`, `exporting.md` | Search syntax, "mature", file locations, export formats |
| [Anki rslib](https://github.com/ankitects/anki/tree/main/rslib/src): `card/mod.rs`, `storage/sqlite.rs` | Card type and queue values, SQLite lock mode |

The GitHub repo `FooSoft/anki-connect` is archived and its README says the project "has permanently moved to https://git.sr.ht/~foosoft/anki-connect". Do not use it as a reference.

## What AnkiConnect is

AnkiConnect is an Anki Desktop add-on (AnkiWeb code `2055492159`) that runs an HTTP server inside Anki. It "lets applications search, create, and update notes and cards in a running Anki Desktop collection through a local HTTP API" (README). It is licensed GPL-3.0-or-later (`LICENSE`). Michigo talks to it over HTTP and ships none of its code.

It serves two protocols on the same port, both backed by the same services:

| Protocol | Endpoint | Status |
| --- | --- | --- |
| API v1, JSON-RPC 2.0, 94 methods | `POST http://127.0.0.1:8765/api/v1` | "Use API v1 for new integrations" (README) |
| Legacy action API, version 6, 122 actions | `POST http://127.0.0.1:8765/` | Kept for existing clients such as Yomitan |

API v1 is new. It landed in commit "Rework Anki-Connect with JSON-RPC API v1 and native compatibility tests" on 2026-10-11, one month before this research. Most AnkiConnect knowledge on the web, and in other tools, describes the legacy API.

## Version requirements

The current add-on requires Anki Desktop 26.08 or later. `plugin/__init__.py` sets `required_anki_version = (26, 8, 0)` and raises `Minimum Anki version supported: 26.8.0` on older Anki, so the add-on does not load at all there. The README says compatibility is tested with 26.08 and 26.09.3.

Runtime detection:

- v1: `api.describe` returns available methods, schemas, limits and runtime capabilities.
- Legacy: the `version` action returns `6`.

## Permissions and authentication

The listener binds to `127.0.0.1:8765` by default (`plugin/config.json`). Settings live under Tools, Add-ons, Anki-Connect, Config, and listener changes need an Anki restart.

| Setting | Default | Effect |
| --- | --- | --- |
| `apiKey` | `null` | When set, v1 needs `Authorization: Bearer <key>`; legacy needs a `key` field in the body |
| `webCorsOriginList` | `["http://localhost"]` | Browser origins allowed without a prompt |
| `ignoreOriginList` | `[]` | Origins whose permission prompts are suppressed |

Origin checks only bite when a request carries an `Origin` header. In `web.py`, `allowOrigin` computes `allowed = not origin or origin in origins`, so a request with no `Origin` header is allowed. Requests from Node (Electron main, the CLI) normally send none. A browser origin that is not listed must call `access.requestPermission` (legacy `requestPermission`), which shows a prompt inside Anki.

Transport failures come back as empty bodies with HTTP 401 (bad key), 403 (rejected origin), 405 (not POST) or 413 (body over 16 MiB). JSON-RPC results and errors use HTTP 200 (API_V1.md, "Requests, authentication, and errors").

## Reading notes from chosen decks and note types

Search uses Anki's own query syntax, so deck and note type filters go in the query string:

```text
deck:"Japanese::Core 2k" note:"Japanese (recognition)"
```

The read path in v1:

1. `notes.search` with `query` returns a page of note IDs (`IdPage`): default 100, maximum 1000 per page, with an opaque `nextCursor`. Cursors snapshot the result for ten minutes.
2. `notes.getMany` with `ids` returns each `Note`: `id`, `noteType` (id and name), `fields`, `tags`, `cardIds`, `modifiedAt`.

`fields` is an object of field name to HTML string. There is no field projection: you get every field and pick the one you need. "Fields contain HTML. Field names are exact." (API_V1.md, "Working with collections"). So reading the expression field means stripping HTML (and often furigana markup) on Michigo's side.

To list field names of a note type, `noteTypes.get` returns `fields`, `templates`, `sortField` and `kind` (`normal` or `cloze`). `decks.list` and `noteTypes.list` enumerate the choices for a picker.

Legacy equivalents are `findNotes`, `notesInfo`, `deckNames`, `modelNames` and `modelFieldNames`.

## Card study state

State lives on cards, not notes. A note has one or more cards (`cardIds`). Read cards with `cards.search` and `cards.getMany`. Each `Card` has `noteId`, `deck`, `flags` and a `scheduling` object (`SchedulingState`):

| Property | Values |
| --- | --- |
| `type` | `new`, `learning`, `review`, `relearning` |
| `queue` | `new`, `learning`, `review`, `dayLearning`, `preview`, `suspended`, `buriedByScheduler`, `buriedByUser` |
| `intervalDays` | integer, days |
| `repetitions`, `lapses`, `remainingSteps` | integers |
| `due`, `sm2EasePermille`, `fsrsMemory`, `desiredRetention` | scheduler details |

These map one to one onto Anki's `CardType` (0 to 3) and `CardQueue` (0 to 4, and -1 suspended, -2 and -3 buried) enums in `rslib/src/card/mod.rs`.

Young and mature are not fields. The Anki manual defines them: "A card is defined as 'mature' if its interval is ≥21 days" (`stats.md`). So:

| Michigo state | Derived from |
| --- | --- |
| New | `type == "new"` |
| Learning | `type` is `learning` or `relearning` |
| Young | `type == "review"` and `intervalDays < 21` |
| Mature | `type == "review"` and `intervalDays >= 21` |
| Suspended | `queue == "suspended"` (independent of `type`) |

The same splits work as searches: `is:new`, `is:learn`, `is:review`, `is:suspended` (`searching.md`, "Card state"), plus `prop:ivl>=21` for mature. A note with several cards (for example recognition and production) can have different states per card, so Michigo must pick a rule for combining them.

Legacy: `findCards` plus `cardsInfo` (which includes type, queue and interval), and `areSuspended`.

## Creating notes of a specific note type

`notes.create` takes `noteType` and `deck` as references (`{"name": "..."}` or `{"id": "..."}`), `fields` by exact name, optional `tags`, `duplicates` and `rejectEmptyQuestions` (default `true`). It returns the note and the cards Anki actually generated. `notes.createMany` does a batch; each item succeeds or fails on its own unless `atomic: true`, which preflights the whole batch and adds it in one transaction with one undo entry.

Writes are refused while an Anki editor for the affected note is open: error `editorConflict` (1003). "Affected editors must be closed before collection writes, including saved editors." (API_V1.md). A request ID is not an idempotency key, so a write whose response was lost must not be retried blindly.

Legacy: `addNote` and `addNotes` with `deckName`, `modelName`, `fields`, `tags`, `options`.

## Duplicate detection

`notes.validate` (and `notes.validateMany`) checks a note without writing it and returns `valid`, `issues` and `duplicateNoteIds`. `notes.create` runs the same check and fails with `validationFailed` on a duplicate unless the policy allows it.

The check in `services.py` (`validation`) compares only the first field. It looks up notes with the same first-field checksum (`csum`), then compares the normalized first field. The `DuplicatePolicy` options:

| Option | Default | Effect |
| --- | --- | --- |
| `allow` | `false` | Skip the check |
| `scope` | `collection` | Or `deck`, which then requires `deck` |
| `includeChildren` | `false` | With deck scope, also check child decks |
| `acrossNoteTypes` | `false` | By default only notes of the same note type count |

So "is this word already in Anki" via AnkiConnect works only if the word is the first field of the note type. Otherwise Michigo has to search itself, for example `notes.search` with a field query like `"Expression:食べる"`.

Legacy: `canAddNotes` and `canAddNotesWithErrorDetail`; duplicates fail with the string `cannot create note because it is a duplicate`.

## Storing audio and other media

`media.store` takes `filename`, a `source` that is exactly one of base64 `data`, a local `path` (on the machine running Anki) or an http(s) `url`, plus `collision` (`rename` by default, or `replace`, or `error`) and optional `skipIfHash`. Files are limited to 64 MiB.

`media.store` is an operation: it returns an `operationId`, and the client polls `operations.get` until the state is terminal. The final result has the stored `filename` and its `sha256`. The server "may normalize or rename the requested filename", so the note must reference the returned name, as `[sound:<filename>]` for audio. Media writes cannot be undone with Anki's undo.

Legacy `addNote` can attach `audio`, `video` or `picture` inline, appending the reference to named fields. Legacy `storeMediaFile` is the standalone call.

## Behavior when Anki is not running

AnkiConnect lives inside Anki, so with Anki closed there is no listener and the request fails with connection refused. The README's troubleshooting lists exactly that: "check that Anki is running, the add-on is enabled, and your client uses the configured address and port".

Other unavailable states return structured errors (codes in API_V1.md):

| Situation | Error |
| --- | --- |
| Anki open but no profile loaded | `collectionUnavailable` (1004) |
| Profile switched or full sync since the session was taken | `staleSession` (1005) |
| Profile switch or sync in progress | `busy` (1010) |
| Editor open on the target note | `editorConflict` (1003) |

IDs belong to one collection, so a profile switch invalidates stored IDs, cursors and sessions. `collection.get` returns the current `session` to pass on later calls. Operation handles are lost when Anki restarts.

## Platform differences

The API is the same on all platforms. Differences noted by the sources:

- macOS: AnkiConnect suppresses App Nap after its listener starts, so requests stay responsive when Anki is in the background (README, ARCHITECTURE.md).
- Windows: "allow Anki through the firewall if prompted" (README).
- All: `path` media sources and `media.getDirectory` refer to the machine running Anki.

Collection locations, needed only for the direct-access alternative below (`files.md`):

| OS | Data folder |
| --- | --- |
| Windows | `%APPDATA%\Anki2` |
| macOS | `~/Library/Application Support/Anki2` |
| Linux | `~/.local/share/Anki2` or `$XDG_DATA_HOME/Anki2` |
| Linux Flatpak | `~/.var/app/net.ankiweb.Anki/data/Anki2/` |

Each profile folder holds `collection.anki2` (SQLite) and `collection.media/`.

## Alternatives to AnkiConnect

### Text export

File, Export, "Notes in Plain Text" writes tab-separated fields with HTML embedded (`exporting.md`). It has no card scheduling state, so it can answer "which words are in my deck" but not "which are mature". It is a manual, one-shot snapshot.

### Package export

`.apkg` (one deck) and `.colpkg` (whole collection) are zip packages with the collection database and optionally media and scheduling (`exporting.md`). The modern format compresses data and "will not be readable by older Anki clients" unless the user ticks "Support older Anki versions". Reading one means unpacking and parsing Anki's internal schema. Read-only for Michigo and a manual snapshot again.

### Direct collection access

Reading `collection.anki2` with SQLite gives everything, including `cards.type`, `cards.queue` and `cards.ivl`, with the values from `rslib/src/card/mod.rs`. The limits:

- While Anki has the profile open, it holds the database with `locking_mode = exclusive` and WAL (`rslib/src/storage/sqlite.rs`), so another process cannot read it. It works only when Anki is closed.
- The manual warns that the collection can "become corrupt if the files are modified while Anki is open" (`files.md`, "Corrupt Collections"). Writing is off the table.
- Anki registers a custom `unicase` collation and `regexp` functions on its connection (`sqlite.rs`). Plain SQLite clients lack them, so some queries and index-touching writes fail.
- The schema is internal and changes between Anki versions.

The `anki` Python package on PyPI (26.9.4) is Anki's own backend and handles all of this, but it is AGPL-3.0-or-later (Anki `LICENSE`) and Python, and still cannot open a collection Anki holds open.

## Recommendation

This section is a recommendation, not a finding.

Use AnkiConnect from the Electron main process (and the CLI) over plain `fetch`, with no `Origin` header, so no permission prompt or config is needed. Target API v1 since it is typed and returns structured errors, but expect users on Anki older than 26.08 to have no working AnkiConnect at all, and decide whether to also speak the legacy API (Yomitan's path, stable for years). Derive young and mature from `type` and `intervalDays` with the 21-day rule. Do not rely on AnkiConnect's duplicate check unless the target field is the note type's first field. Treat "Anki not running" as a normal state in the UI, not an error. Skip direct SQLite access except perhaps as an offline read-only import while Anki is closed.

## Not verified

- Whether AnkiWeb still serves an older AnkiConnect build to Anki versions before 26.08. The AnkiWeb page needs JavaScript and the published supported range was not read.
- Whether Electron's Node `fetch` sends an `Origin` header in every Electron version. Assumed from Node's default behavior, not tested.
- No request was sent to a running Anki; all behavior above comes from documentation and source.
