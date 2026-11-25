import { randomUUID } from "node:crypto";

import type { Logger } from "@michigo/core";
import { RendererLogLineSchema } from "@michigo/log/renderer";
import { ipcMain } from "electron";

import { channels } from "../shared/api";
import { trustedSender } from "./trusted-sender";

const RENDERER_LINES_PER_SECOND = 100;

/**
 * Registers `log:write`, the one channel not yet on the oRPC contract in
 * `electron/rpc/`. It parses its input with `RendererLogLineSchema`.
 *
 * `handle` rejects calls from any frame other than the app's own page at
 * `rendererUrl`. It also makes the `actionId` of the call and logs its start,
 * its end and any failure.
 */
export function registerIpc(
  rendererUrl: string,
  log: { readonly main: Logger; readonly renderer: Logger },
): void {
  const isTrustedSender = trustedSender(rendererUrl);
  const warnedChannels = new Set<string>();

  function handle(
    channel: string,
    listener: (raw: unknown) => unknown,
    // A log line that logged its own call would write three lines for one.
    { quiet = false } = {},
  ): void {
    ipcMain.handle(channel, async (event, raw: unknown) => {
      if (!isTrustedSender(event)) {
        // Once per channel, so a frame that keeps calling cannot flood the log.
        if (!warnedChannels.has(channel)) {
          warnedChannels.add(channel);
          log.main.warn("ipc", "ipc.untrusted", { channel });
        }
        throw new Error(`IPC call to ${channel} from untrusted frame`);
      }

      const actionId = randomUUID();
      const started = performance.now();
      const durationMs = () => Math.round(performance.now() - started);

      if (!quiet) {
        log.main.info("ipc", "ipc.start", { actionId, channel });
      }
      try {
        const result = await listener(raw);

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

  // A compromised page must not be able to push the real lines out of the log.
  let windowStart = 0;
  let linesInWindow = 0;

  handle(
    channels.logWrite,
    (raw) => {
      // Counted before parsing: a line that fails the schema writes ipc.failed too.
      const now = performance.now();

      if (now - windowStart >= 1000) {
        const dropped = linesInWindow - RENDERER_LINES_PER_SECOND;

        if (dropped > 0) {
          log.main.warn("ipc", "log.dropped", { count: dropped });
        }
        windowStart = now;
        linesInWindow = 0;
      }
      linesInWindow += 1;
      if (linesInWindow > RENDERER_LINES_PER_SECOND) {
        return;
      }

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
