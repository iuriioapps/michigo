---
paths:
  - "apps/desktop/electron/**"
  - "apps/desktop/shared/**"
  - "apps/desktop/src/lib/rpc.ts"
---

# IPC

The IPC API is one oRPC contract, served by main over one MessagePort. Decided in `docs/adr/0010-ipc-is-an-orpc-contract-over-one-message-port.md`.

`log.write` and the `app:error` event still use `handle()` and `channels` in `electron/ipc.ts`, `shared/api.ts` and `preload.ts`. They move to the contract next. Add every new procedure to the contract.

## Add a procedure

1. `apps/desktop/shared/contract/<domain>.ts`: declare it on `base` with `.input()` and `.output()`. This is where you decide what the feature looks like. A new domain file also goes into `contract` in `shared/contract/index.ts`.
2. `apps/desktop/electron/rpc/<domain>.ts`: implement it with `os.<domain>.<name>.handler()`. The router in `electron/rpc/index.ts` fails to compile until every procedure has a handler. A new domain also goes into that router.

The renderer then uses it through `orpc` from `src/lib/rpc.ts` (see `.claude/rules/renderer.md`). The preload stays as it is.

## Validate at the boundary

Treat everything arriving from the renderer as untrusted, exactly as a server treats an HTTP body. The renderer is a locked-down browser tab, and a compromised page or dependency must not be able to drive the main process.

- Every procedure that takes input declares `.input(schema)`. oRPC parses the input before the handler runs, so a handler reads only `input`. `projects.create` is the reference implementation: copy it.
- The schema comes from `@michigo/core/schemas`, or from the package that owns the shape (`log.write` uses `RendererLogLineSchema` from `@michigo/log/renderer`). The contract is imported by the renderer, so it imports only those pure entry points.
- A parse failure rejects the call with `BAD_REQUEST`, and TanStack Query surfaces it as an error, with no extra plumbing.
- `.output(schema)` gives the renderer its types, and main parses the result against it. When a measured budget shows that parse is too slow for a large result, use `type<T>()` from `@orpc/contract` for that output.

## Trusted sender

The renderer gets its port through one handshake: it posts the port to its own window, `preload.ts` forwards it on `rpc:connect`, and `registerRpc` in `electron/rpc/index.ts` serves it. That handshake is the only access check, so it checks the sender frame against the app's own page and refuses any other frame. Keep it the only way in: features reach main through the contract, and `preload.ts` exposes the port forwarder and named functions only, never `ipcRenderer`.

## Long actions and events

- A procedure that can take more than about 1 s outputs `eventIterator(schema)`, yields progress from an async generator and stops when `signal` aborts. It commits item by item, so a cancel keeps the finished items.
- An event that main sends to the renderer is an event iterator too, fed from an `EventPublisher`.
- `electron/rpc/transport.test.ts` shows both working over a real port.

## Handlers and logging

- A handler validates by contract and passes the work on to a package or a worker, as "Threads and I/O" in `CLAUDE.md` requires.
- The `logCalls` middleware in `electron/rpc/base.ts` logs the start, the end and any failure of every call, with the procedure path as `channel`. A procedure opts out with `.meta({ quiet: true })`, which only `log.write` needs.
- Dependencies that handlers share, such as the loggers, come through `RpcContext` in `electron/rpc/base.ts`.
