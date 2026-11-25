import type { RendererLogLine } from "@michigo/log/renderer";

/**
 * The part of the IPC API that is not yet on the oRPC contract in
 * `shared/contract/`: the renderer's log lines and the error event from main.
 *
 * `preload.ts` declares `const api: DesktopApi`, so a missing or misshapen entry
 * is a compile error. This file must stay importable from the renderer, so it
 * imports only types from pure entry points.
 */
export interface DesktopApi {
  readonly app: {
    /**
     * Calls `listener` with an error code such as `main.uncaught` when the main
     * process hits an error nobody caught. Returns the unsubscriber.
     */
    onError(listener: (code: string) => void): () => void;
  };
  readonly log: {
    /** Appends one line to the shared log. Rejects if `line` fails validation. */
    write(line: RendererLogLine): Promise<void>;
  };
}

export const channels = {
  appError: "app:error",
  logWrite: "log:write",
} as const;

export type Channel = (typeof channels)[keyof typeof channels];
