---
paths:
  - "apps/desktop/electron/**"
  - "apps/desktop/shared/**"
  - "apps/desktop/src/lib/rpc.ts"
---

# IPC

The IPC API is one oRPC contract, served by main over one MessagePort. Decided in `docs/adr/0010-ipc-is-an-orpc-contract-over-one-message-port.md`.

## Add a procedure

1. `apps/desktop/shared/contract/<domain>.ts`: declare it on `base` with `.input()` and `.output()`. This is where you decide what the feature looks like. A new domain file also goes into `contract` in `shared/contract/index.ts`.
2. `apps/desktop/electron/rpc/<domain>.ts`: implement it with `os.<domain>.<name>.handler()`. The router in `electron/rpc/index.ts` fails to compile until every procedure has a handler. A new domain also goes into that router.

The renderer then uses it through `orpc` from `src/lib/rpc.ts` (see `.claude/rules/renderer.md`). The preload stays as it is.

## Validate at the boundary

Treat everything arriving from the renderer as untrusted, exactly as a server treats an HTTP body. The renderer is a locked-down browser tab, and a compromised page or dependency must not be able to drive the main process.

- Every procedure that takes input declares `.input(schema)`. oRPC parses the input before the handler runs, so a handler reads only `input`. `projects.create` is the reference implementation: copy it.
- The schema comes from `@michigo/core/schemas`, or from the package that owns the shape (`log.write` uses `RendererLogLineSchema` from `@michigo/log/renderer`). The contract is imported by the renderer, so it imports only those pure entry points.
- A parse failure rejects the call with `BAD_REQUEST`, and TanStack Query surfaces it as an error, with no extra plumbing.
- `.output(schema)` gives the renderer its types, and main parses the result against it.

## Result size

Main parses and serializes every result on its own thread, and the serializing costs the most. Measured on a development machine with 9-field word rows:

| Rows   | Parse | Serialize | Round trip |
| ------ | ----- | --------- | ---------- |
| 500    | 1 ms  | 4 ms      | 2 ms       |
| 7,000  | 2 ms  | 14 ms     | 24 ms      |
| 50,000 | 20 ms | 99 ms     | 161 ms     |

So a procedure returns what the page shows, never a whole table. A word view asks for a window of rows and the total count, and SQLite sorts and filters, as ADR 0008 says. `type<T>()` from `@orpc/contract` skips only the parse, so it does not rescue a result that is too large.

### Watching the main thread

`watchMainThread` in `electron/main-thread-watch.ts` logs `main.stall` at `warn` when main's thread was blocked longer than 50 ms, with the longest block as `durationMs`. It reads Node's event-loop delay, so it catches what `logCalls` cannot see, such as serializing a large result after the handler has returned. The `ipc.start` lines just before a stall show which calls ran. It starts a second after the first window shows, because creating that window blocks main on every launch and startup has its own budget.

### When load grows

Reach for these in order, each only when a measurement or a `main.stall` line shows the one before is not enough:

1. Narrow rows: a table's procedure returns the table's columns, and a detail panel fetches the rest of one item.
2. Cancel stale queries: `queryOptions` passes TanStack Query's `signal` to the call, so a handler hands `signal` on to the storage worker. Debounce a search field.
3. Prefetch the next window, and keep the previous one on screen with `placeholderData: keepPreviousData`, so scrolling never shows an empty table.
4. Seek pagination: ask for the rows after a sort key instead of an `OFFSET` deep in the list. Keep offsets for a jump of the scrollbar.
5. Count apart: the total count as its own cached procedure, invalidated by the mutations that change it.
6. Bypass main: a second port from the storage worker straight to the page, handed over after the same sender check. Decide it in an ADR before any code.
7. Transfer buffers: typed arrays moved instead of copied, with oRPC's experimental transfer option. The last resort.

## Trusted sender

The renderer gets its port through one handshake: it posts the port to its own window, `preload.ts` forwards it on `rpc:connect`, and `registerRpc` in `electron/rpc/index.ts` serves it. That handshake is the only access check, so it checks the sender frame against the app's own page and refuses any other frame. Keep it the only way in: features reach main through the contract, and `preload.ts` stays the port forwarder alone, with no `contextBridge` API.

## Long actions and events

- A procedure that can take more than about 1 s outputs `eventIterator(schema)`, yields progress from an async generator and stops when `signal` aborts. It commits item by item, so a cancel keeps the finished items.
- The logging middleware sees a stream only until main hands it over, so its `ipc.end` marks the start of the stream. A long action logs its own done, canceled and failed events.
- An event that main sends to the renderer is an event iterator too, fed from an `EventPublisher`. `app.errors` is the reference: `createMainErrors` in `electron/rpc/app.ts`.
- `electron/rpc/transport.test.ts` shows both working over a real port.

## Handlers and logging

- A handler validates by contract and passes the work on to a package or a worker, as "Threads and I/O" in `CLAUDE.md` requires.
- The `logCalls` middleware in `electron/rpc/base.ts` logs the start, the end and any failure of every call, with the procedure path as `channel`. A procedure opts out with `.meta({ quiet: true })`, which only `log.write` needs.
- Dependencies that handlers share, such as the loggers, come through `RpcContext` in `electron/rpc/base.ts`.
- A failure the learner should see is a `MichigoError` with a code, such as `anki.closed`. `logCalls` hands that code to the page as the `ORPCError` code and message, from a call or from inside a stream. Any other error reaches the page as `INTERNAL_SERVER_ERROR`, and its message stays in the log.
