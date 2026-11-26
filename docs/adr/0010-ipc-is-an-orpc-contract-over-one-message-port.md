# IPC is an oRPC contract over one MessagePort

The renderer reaches the main process through an IPC API. Each channel touched four files: the type and name in `shared/api.ts`, the handler in `electron/ipc.ts`, a bridge function in `preload.ts` and a query in `src/lib/queries.ts`. v1 adds dozens of channels for Sources, words, Word Lists, Anki, reference data and grammar, so each of those files would grow without bound. "Threads and I/O" in `CLAUDE.md` also asks that an action longer than about 1 s shows progress and can be canceled, and `ipcRenderer.invoke` has neither.

**The IPC API is one oRPC contract, served by the main process over one MessagePort.** The contract lives in `apps/desktop/shared/contract/`, one file per domain, and declares each procedure's zod input and output. `apps/desktop/electron/rpc/` implements it, one file per domain. The preload only hands the port to main and never changes when a procedure is added.

## How it works

- The renderer creates a `MessageChannel`, keeps one end for the oRPC client and posts the other to the preload, which forwards it to main on `rpc:connect`.
- Main checks the sender frame once, at that handshake, and upgrades the port only for the app's own page. Every call after that goes through the port, so the check covers every call.
- oRPC parses the input against the contract before the handler runs, so a handler never sees raw input.
- One middleware makes the `actionId` and logs the start, the end and any failure of every call. It runs before input validation, so a zod failure is logged too.
- A long action is an async generator that yields progress. An abort on the client reaches the handler's `signal` over the port. Events from main to the renderer use the same mechanism with `EventPublisher`.
- `@orpc/tanstack-query` derives query options, mutation options and query keys from the contract, so there is no hand-written query file.

A spike over a Node `MessageChannel` with oRPC 1.16 confirmed the middleware order, the validation error (`ORPCError` `BAD_REQUEST` with the zod issues), streaming and the abort reaching the handler.

## Considered options

- Raw `ipcMain.handle`, split into one file per domain. Rejected: a channel still touches four places, and progress and cancel need a side channel of our own.
- A homegrown contract map with a generic register loop and a generic preload. Rejected: about 150 lines of our own code before progress, cancel and query keys, which we would then have to maintain.
- electron-trpc and its tRPC v11 forks. Rejected: the original targets tRPC v10, and the v11 support lives in forks outside the original project.
- `@egoist/tipc` and `@electron-toolkit/typed-ipc`. Rejected: they type the calls, but neither derives TanStack Query options from the contract, and progress and cancel over IPC stay ours to build.

## Consequences

Four packages are new in `apps/desktop`: `@orpc/contract`, `@orpc/server`, `@orpc/client` and `@orpc/tanstack-query`. They share one version and move together. oRPC 2 is in beta, so Michigo stays on 1.x until 2 is stable and then upgrades as a deliberate step. The sender check no longer runs per call, so the handshake is the only place that grants access, and the preload must accept the port only from its own window.

Main parses every result against its output schema and serializes it on its own thread, which costs about 100 ms for 50,000 word rows, so a word view fetches a window of rows instead of a whole table. A procedure is named by its path, for example `projects.create`, and the log uses that path as `channel`. The oRPC serializer has no Temporal type, so a Temporal object would arrive as an ISO string: an instant still crosses IPC as epoch milliseconds.

The same handler and link work over a worker's MessagePort, so the storage worker could reuse this contract style later. That is not decided here.
