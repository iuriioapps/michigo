# Michigo: working notes

Rules that the code cannot state for itself. Rules for one area live in `.claude/rules/` and load when you open a file in that area (see "Area rules").

## Pull request size

Every change ships as a **stack of small PRs** made with `gh stack` (the `gh-stack` skill has the commands). A PR aims at about 500 changed lines and 15 files. It goes up to 1,000 lines or 25 files only for a slice that cannot be split. Generated files (`pnpm-lock.yaml`, `src/routeTree.gen.ts`) do not count.

Three checkpoints, each with its own check:

1. Before the first commit, slice the work and create the stack (`gh stack init`, `gh stack add`). Done when every planned slice fits the size above.
2. Before every push, run `pnpm check` and measure the branch against its parent: `git diff --shortstat <parent>...HEAD -- . ':!pnpm-lock.yaml' ':!**/routeTree.gen.ts'`. Push only when the check passes and the numbers fit. When they do not fit, split the branch into a stack first.
3. Work that arrives after a PR is open (review fixes, a new request, a follow-up) goes on a new branch stacked on top with `gh stack add`, then through checkpoint 2.

## Package boundaries

Imports go strictly one way:

```text
apps/desktop ─┬─> storage ──────────────> vocab, reference, pitch, audio ─┐
              └─> tokenizer, source, grammar, anki, manifest, log ────────┴─> core
```

Decided in `docs/adr/0007-packages-do-not-import-each-other-and-the-app-composes.md`. Every package in the graph exists, most as a scaffold with the layout of `packages/vocab`: `exports` pointing at `./src/index.ts`, a `typecheck` script and `@michigo/core` as a `workspace:*` dependency. A feature fills in the package that owns it. The rules for code:

- `core` imports no other package, and code in `packages/` imports only packages, never `apps/`.
- A package imports `core` and nothing else. The one exception is `storage`, which imports the store interfaces of the packages it serves.
- Where several packages have to be combined, the app composes them. See how `describeRuntime` receives its modules as an argument instead of importing them.
- A package that logs takes a `Logger` (a type in `core`) as an argument. Only the app, and the worker entries it owns, import `@michigo/log`.
- A package that keeps data declares its store as an interface in domain terms. **SQL lives only in `storage`.**
- `core` holds the data shapes that packages and the renderer exchange. Logic goes to the package that owns the capability.
- Each package declares what it imports in its own `package.json`, so pnpm refuses an import that breaks these rules.
- Only `packages/tokenizer` imports `lindera`, the native binding. Read ADR 0005 and `.claude/rules/tokenizer.md` before you add the binding to that package.

### Pure and Node entry points

`@michigo/core` and `@michigo/log` each have two entry points. The renderer bundle breaks on any `node:*` import, so code that the renderer can reach stays pure:

| Entry                   | Imported by                      | Node APIs |
| ----------------------- | -------------------------------- | --------- |
| `@michigo/core/schemas` | The renderer and everything else | None      |
| `@michigo/core`         | The main process                 | Allowed   |
| `@michigo/log/renderer` | The renderer                     | None      |
| `@michigo/log`          | The main process and workers     | Allowed   |

Put new code on the correct side of this split from the start. Moving it later is expensive.

## Threads and I/O

The main thread of the main process only validates IPC input and passes work on. Decided in issue #117 and recorded in ADR 0002. The rules for code:

- The main thread uses async I/O only: `fs/promises`, `fetch`, AnkiConnect. `*Sync` file calls and `DatabaseSync` run in workers.
- Any step that can take more than about 50 ms runs off the main thread, I/O or CPU. Hashing the tokenizer archive and unzipping a dropped archive use streaming async APIs or a worker.
- One storage worker (a worker thread) holds the only connection to `michigo.db` and the read-only Dictionary connections. It runs the migrations before it reports ready. The stores reach it through their async ports.
- A Dictionary build runs in a short-lived worker of its own, writes a temporary file and renames it into `reference/`.
- The tokenizer utility process opens no database. It returns tokens, and the storage worker writes words and occurrences in one transaction.
- One transaction covers one item (one Source, one CSV import, one Anki update). An action over many items commits each item on its own.
- Every action that reaches the main process shows a pending state, ignores a repeat while pending and leaves the rest of the window usable. An action longer than about 1 s shows progress, and it can be canceled where it commits item by item. Such an action is an event iterator procedure (see `.claude/rules/ipc.md`).

## Quality targets

Read `docs/quality-targets.md` before you work on any of these: an action with a performance budget, visible UI text, Japanese text, accessibility, dates and times, or anything that logs. Every implementation issue meets its targets, and its PR records the budgets it measured.

## Area rules

These files load when you open a file that matches their paths. When you create the first file of an area, read its rule file first.

| File | Loads for | Covers |
| --- | --- | --- |
| `.claude/rules/ipc.md` | `apps/desktop/electron/`, `apps/desktop/shared/`, `src/lib/rpc.ts` | The oRPC contract, input validation and the steps to add a procedure |
| `.claude/rules/renderer.md` | `apps/desktop/src/` | Routing, data from the main process and UI components |
| `.claude/rules/tokenizer.md` | `packages/tokenizer/` | Lindera and the dictionary build |
| `.claude/rules/dependencies.md` | `package.json` files, `pnpm-workspace.yaml`, `vite.config.ts`, `.nvmrc`, `dependabot.yml` | Where a dependency goes and the Node version pin |

## Toolchain

- Lint and format with Oxlint and Oxfmt. `typescript-eslint` refuses to load against TypeScript 7, and `oxlint-tsgolint` builds real TS programs on the Go compiler.
- `erasableSyntaxOnly` is on, so write union types instead of `enum` and assign fields in the constructor body.

## Writing Markdown

These rules cover docs, issue bodies and PR bodies. Oxfmt runs with `proseWrap: "never"` and joins every paragraph onto one line, so write each paragraph as one line.

- Use headings for anything a reader may want to link to or find in the outline. A finding, a step or a topic gets a heading. Labeled items go in headings or a table, not in bullets that start with a bold label.
- Use bold at most once per section, for the one thing a skimming reader must not miss.
- Headings separate sections. Leave out `---` rules.
- A bullet is one or two lines. If it needs more, make it a paragraph under a heading.
- Every fenced code block has a language tag. Use `text` for diagrams and trees.
- Leave headings unnumbered, because numbers break anchors when sections move.
- Use a colon, parentheses or a new sentence where an em-dash would go.
- Before you finish a doc, read only its headings. The outline alone must tell the reader what is where.

## Agent skills

### Issue tracker

Issues and specs live in GitHub Issues for `iuriioapps/michigo`. Use the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
