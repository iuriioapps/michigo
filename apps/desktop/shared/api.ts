import type { CreateProjectInput, Project, RuntimeInfo } from "@michigo/core/schemas";
import type { RendererLogLine } from "@michigo/log/renderer";

/**
 * The IPC contract — the single source of truth shared by all three processes.
 *
 * `preload.ts` declares `const api: DesktopApi`, so if a handler is missing or
 * the wrong shape, it is a compile error rather than a runtime no-op. Channel
 * names live here too, typed once and imported on both sides, because a typo in
 * a raw string would only ever surface at runtime.
 *
 * This file must stay importable from the renderer, so it may only import types
 * from the pure entry points `@michigo/core/schemas` and `@michigo/log/renderer`,
 * never from `@michigo/core` or `@michigo/log`.
 */
export interface DesktopApi {
  readonly app: {
    /** Runtime details plus the domain modules the main process has loaded. */
    info(): Promise<RuntimeInfo>;
    /**
     * Calls `listener` with an error code such as `main.uncaught` when the main
     * process hits an error nobody caught. Returns the unsubscriber.
     */
    onError(listener: (code: string) => void): () => void;
  };
  readonly projects: {
    /** Every project the main process is holding, oldest first. */
    list(): Promise<Project[]>;
    /**
     * Appends a project and returns it, with the id and timestamp main
     * assigned. Rejects if `input` fails validation in the handler.
     */
    create(input: CreateProjectInput): Promise<Project>;
  };
  readonly log: {
    /** Appends one line to the shared log. Rejects if `line` fails validation. */
    write(line: RendererLogLine): Promise<void>;
  };
}

export const channels = {
  appInfo: "app:info",
  appError: "app:error",
  projectList: "project:list",
  projectCreate: "project:create",
  logWrite: "log:write",
} as const;

export type Channel = (typeof channels)[keyof typeof channels];
