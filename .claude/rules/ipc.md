---
paths:
  - "apps/desktop/electron/**"
  - "apps/desktop/shared/**"
  - "apps/desktop/src/lib/queries.ts"
---

# IPC

## Validate at the boundary

Treat everything arriving from the renderer as untrusted, exactly as a server treats an HTTP body. The renderer is a locked-down browser tab, and a compromised page or dependency must not be able to drive the main process.

- Parse every argument with a zod schema inside the handler before use. The schema comes from `@michigo/core`, or from the package that owns the channel's shape (`log:write` uses `RendererLogLineSchema` from `@michigo/log/renderer`).
- `project:create` in `apps/desktop/electron/ipc.ts` is the reference implementation: it parses with `CreateProjectInputSchema` before it touches the argument. Copy it. A parse failure throws, Electron rejects the renderer's promise, and TanStack Query surfaces it as a mutation error, with no extra plumbing.
- Register handlers through the local `handle()` in `registerIpc`, which rejects calls from any frame other than the app's own page. Calling `ipcMain.handle` directly skips that check.

## Add a channel

Touch these four places, in order:

1. `apps/desktop/shared/api.ts`: add the method to `DesktopApi` and its name to `channels`. This is where you decide what the feature looks like.
2. `apps/desktop/electron/ipc.ts`: register it with `handle()` and parse any input.
3. `apps/desktop/electron/preload.ts`: expose it as a named function. The object is typed as `DesktopApi`, so a missing function is a compile error. Expose only named functions, never `ipcRenderer` itself.
4. `apps/desktop/src/lib/queries.ts`: add a query or mutation, then use it. A fire-and-forget call (`log:write`) or an event that main sends (`app:error`) has no query, and the code that needs it calls `window.michigo` directly.
