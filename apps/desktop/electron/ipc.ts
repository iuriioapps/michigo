import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import process from "node:process";

import { ankiModule } from "@michigo/anki";
import { type Logger, describeRuntime } from "@michigo/core";
import { CreateProjectInputSchema, RendererLogLineSchema } from "@michigo/core/schemas";
import { vocabModule } from "@michigo/vocab";
import { type IpcMainInvokeEvent, app, ipcMain } from "electron";

import { channels } from "../shared/api";
import { createProject, listProjects } from "./projects";

/**
 * Registers every IPC handler the renderer is allowed to reach.
 *
 * Rule for handlers that take arguments: treat anything arriving from the
 * renderer as untrusted and parse it with a zod schema from `@michigo/core`
 * before use, exactly as a server validates an HTTP body. `project:create`
 * below is the reference implementation — copy it.
 *
 * Every handler goes through `handle`, which rejects calls from any frame
 * other than the app's own page at `rendererUrl`. It also makes the
 * `actionId` of the call and logs its start, its end and any failure.
 */
export function registerIpc(
  rendererUrl: string,
  log: { readonly main: Logger; readonly renderer: Logger },
): void {
  // Normalized, so a dev server URL without a trailing slash still matches.
  const trustedUrl = new URL(rendererUrl).href;

  function isTrustedSender(event: IpcMainInvokeEvent): boolean {
    const url = URL.parse(event.senderFrame?.url ?? "");

    if (url === null) {
      return false;
    }
    // Hash routing changes only the fragment; the page itself must match.
    url.hash = "";

    return url.href === trustedUrl;
  }

  function handle(
    channel: string,
    listener: (raw: unknown, actionId: string) => unknown,
    // A log line that logged its own call would write three lines for one.
    { quiet = false } = {},
  ): void {
    ipcMain.handle(channel, async (event, raw: unknown) => {
      if (!isTrustedSender(event)) {
        log.main.warn("ipc", "ipc.untrusted", { channel });
        throw new Error(`IPC call to ${channel} from untrusted frame`);
      }

      const actionId = randomUUID();
      const started = performance.now();
      const durationMs = () => Math.round(performance.now() - started);

      if (!quiet) {
        log.main.info("ipc", "ipc.start", { actionId, channel });
      }
      try {
        const result = await listener(raw, actionId);

        if (!quiet) {
          log.main.info("ipc", "ipc.end", { actionId, channel, durationMs: durationMs() });
        }

        return result;
      } catch (error) {
        log.main.error("ipc", "ipc.failed", { actionId, channel, durationMs: durationMs() }, error);
        throw error;
      }
    });
  }

  handle(channels.appInfo, () =>
    describeRuntime({
      app: app.getName(),
      version: app.getVersion(),
      modules: [vocabModule, ankiModule],
      electron: process.versions.electron,
    }),
  );

  handle(channels.projectList, () => listProjects());

  handle(channels.projectCreate, (raw) => {
    // Never trust the renderer. A parse failure throws, which Electron turns
    // into a rejected promise on the other side — TanStack Query surfaces it
    // as a mutation error, so no extra plumbing is needed.
    const input = CreateProjectInputSchema.parse(raw);

    return createProject(input);
  });

  handle(
    channels.logWrite,
    (raw) => {
      const line = RendererLogLineSchema.parse(raw);
      // The stack goes through the same frame filter as a main-process error.
      const error =
        line.error === undefined
          ? undefined
          : Object.assign(new Error(), {
              name: line.error.name,
              code: line.error.code,
              stack: line.error.stack ?? "",
            });

      log.renderer[line.level](line.scope, line.event, line.fields, error);
    },
    { quiet: true },
  );
}
