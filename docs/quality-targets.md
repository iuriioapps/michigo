# Quality targets

Every implementation issue meets these targets, so that "done" can be checked. Decided in [Which performance, accessibility, language and logging targets does v1 commit to?](https://github.com/iuriioapps/michigo/issues/119).

## Performance

### Reference machine and library

Budgets are measured on an Apple M1 with 8 GB of memory. The reference library has 3,000 Sources and a Word Bank of 50,000 words.

### Budgets

| Action | Budget |
| --- | --- |
| Start to an interactive window, with the tokenizer installed | 2 s or less. The tokenizer is ready in 3 s or less, in the background. |
| Visible feedback on a click or a key | 100 ms or less |
| Import of one episode subtitle (about 400 Lines) to an open reader | 1 s or less |
| Folder import of 300 subtitle files | 2 min or less, with progress |
| Open a Project of 3,000 Sources | The list in 500 ms or less. Coverage numbers can fill in after. |
| Open a Source in the reader | 300 ms or less. The word popup in 100 ms or less. |
| Filter, sort or search the word table over 50,000 words | 200 ms or less. Scrolling at 60 fps. |
| Memory of all processes with the reference library open | 1 GB resident or less |

The main-thread rules in `CLAUDE.md` (no synchronous I/O, no step over about 50 ms) apply in addition.

### How budgets are checked

A budget is a target, not a CI gate, because CI machines vary too much. **Each implementation issue measures the budgets that it touches on the reference machine** and records the result in its PR.

The memory budget is the least certain: the resident memory of the native Lindera binding with UniDic 2025.12 is not measured yet. The issue that adds the tokenizer measures it and revises this budget.

## Accessibility

### Standard

Michigo aims for WCAG 2.2 AA, as a best effort. Only the automated checks below are enforced. There is no manual screen reader pass before a release. A learner's report about a screen reader is a normal bug.

### Rules

- Keyboard and focus behavior comes from Base UI. Do not replace it with hand-written behavior.
- Every element with Japanese text has `lang="ja"`, and the document has `lang="en"`. Screen readers then use the correct voice, and Chromium uses Japanese glyph shapes instead of Chinese ones.
- `prefers-reduced-motion` turns off animation.
- Keep the contrast (4.5:1 for text) and the control sizes of the canvas.

### Automated axe check

The component tests run axe on each rendered screen. A serious or critical violation fails the test.

### Screenshot baselines

A Playwright script drives the packaged app through every route with a fixture library. It takes a screenshot of every route and every open popover, dialog and popup of the canvas, at the smallest window size of the canvas.

| Theme | Zoom levels            |
| ----- | ---------------------- |
| Light | 100%, 125%, 150%, 200% |
| Dark  | 100%                   |

The screenshots are Playwright `toHaveScreenshot` baselines, committed for macOS only. Font rendering differs between machines, so only the macOS CI runner makes them. A local run reports differences but proves nothing.

The visual test runs on every PR on the macOS runner, and a difference fails the PR. A change that alters the look runs the "Update screenshots" workflow on its PR branch, which commits the new baselines. The human reviewer approves them in the image diff of the PR, and merging is the approval.

## Language

### Scope in v1

The v1 UI is English only, with no language picker. The setup must let a later version add Spanish without changing code outside the catalogs.

### Translation setup

- Use `i18next` with `react-i18next`. Each visible string is a typed key, for example `t("wordView.markKnown")`, in an English JSON catalog that the app bundles.
- Bundle every catalog statically. The renderer loads from `file://`, where dynamic `import()` fails.
- Plurals use the `Intl.PluralRules` suffixes (`_one`, `_other`). Do not build a plural with string concatenation.
- Format numbers with `Intl` in the active language.
- Do not set a fixed width on a container of UI text. Spanish text is longer than English text.

### Text from packages and the main process

Packages and the main process emit ids and codes, never sentences for the learner. A package returns `{ pattern: "te-iru" }` or `{ error: "anki.closed" }`, and the app's catalog holds the text (`grammar.te-iru.name`). This covers Grammar Pattern names and explanations, inflection names from the tokenizer's conjugation fields, and error messages.

Three kinds of text stay out of the catalog: Japanese text, Dictionary glosses (in the Dictionary's own language) and the text of Anki card templates (which the learner edits).

The reasons are in `docs/adr/0009-i18next-with-text-only-in-the-app-catalog.md`.

## Dates and times

- Use `Temporal` for all date and time code in the main process, the workers and the renderer. Use `Date` only where an API gives one, such as `fs.stat` or AnkiConnect, and convert it at once with `Temporal.Instant.fromEpochMilliseconds`.
- Across IPC and in `michigo.db`, an instant is an integer of epoch milliseconds. Structured clone throws `DataCloneError` on a Temporal object, and `Temporal.Instant.toString()` varies its fraction digits, so ISO strings do not sort as text in SQLite.
- Format dates with `Temporal` and `Intl` in the active language.
- `lib` includes `esnext.temporal`. Vitest runs on Node 24, which has no `Temporal`, so the test setup loads `temporal-polyfill`. The app always uses the native one in Electron 44.

## Logging

### The log file

One log in the OS log folder (`app.getPath("logs")`), as JSON Lines. It rotates at 5 MB and keeps 3 files. The main process, the storage worker, the Dictionary build worker, the tokenizer process and the renderer (through the main process) write to it. Levels are `error`, `warn` and `info`. There is no debug level or debug switch in v1.

### Line shape

The log exists so that a person or an AI agent can follow one action through every process. Each line has these fields:

| Field | Content |
| --- | --- |
| `time` | ISO 8601 instant |
| `level` | `error`, `warn` or `info` |
| `process` | `main`, `storage`, `dictionary-build`, `tokenizer` or `renderer` |
| `scope` | The package or module, for example `anki` |
| `event` | A stable name, for example `source.import.done` |
| `actionId` | The id of one learner action, made in the IPC handler and passed to the storage worker and the tokenizer process |
| fields | Ids, counts, `durationMs`, versions, HTTP status codes |
| `error` | Name, code and stack frames (see "Errors from libraries") |

Every IPC call logs its start and its end with `durationMs` at `info`. A failure logs at `error` with its stack. Uncaught errors and unhandled rejections in every process go to the log.

### What the log never holds

**Nothing in the log identifies the learner or holds their content.**

- No Source titles or file names, and no Source text, Spellings, translations or notes.
- No Anki field contents or deck names.
- No API keys, URLs that hold a key, or request and response bodies.
- Paths only inside the app's data folder, relative to it. A path outside it (a dropped file, an import folder) is never logged. Log what it is instead, such as `kind: "srt"` and `bytes`.

Log the id of a record, never its text.

### Errors from libraries

The message of an error from Node, SQLite, zod or another library can hold a file name or a rejected value, for example `ENOENT: no such file or directory, open '/Users/…/MyShow.srt'`. Learners paste the log into public bug reports, so these messages never reach the log.

- The `error` field holds the error's name, its code (`err.code`, such as `ENOENT` or `SQLITE_CONSTRAINT`) and the stack frames, without the first line of the stack, which repeats the message.
- The message is logged only for Michigo's own errors, whose message is a code such as `anki.closed`.
- A zod failure logs the path and code of each issue, never the received value.
- In stack frames, the home folder becomes `~`, as a safety net for the app's own install path.

### Bug reports

Michigo sends nothing about errors over the network: no telemetry, no crash upload and no Electron `crashReporter` upload. Settings: About and the route error screen have "Open log folder" and "Copy diagnostics". "Copy diagnostics" copies the app version, the OS and architecture, the Electron version, the Tokenizer dictionary build and the last 200 log lines. The learner pastes them into a bug report. A toast confirms the copy. The route error screen shows an error code, never the raw error message. The [high-fidelity canvas](https://claude.ai/artifact/AtuHSDWTQLvM3FHkA3MBD9) draws both places, from [Where do Open log folder and Copy diagnostics appear on the canvas?](https://github.com/iuriioapps/michigo/issues/126).
