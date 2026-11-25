import type { Logger } from "@michigo/core";

import { os } from "./base";

const RENDERER_LINES_PER_SECOND = 100;

export interface RendererLineLimit {
  /** Counts one line and says whether it still fits in this second. */
  admit(): boolean;
}

/** A compromised page must not be able to push the real lines out of the log. */
export function createRendererLineLimit(log: Logger): RendererLineLimit {
  let windowStart = 0;
  let linesInWindow = 0;

  return {
    admit() {
      const now = performance.now();

      if (now - windowStart >= 1000) {
        const dropped = linesInWindow - RENDERER_LINES_PER_SECOND;

        if (dropped > 0) {
          log.warn("ipc", "log.dropped", { count: dropped });
        }
        windowStart = now;
        linesInWindow = 0;
      }
      linesInWindow += 1;

      return linesInWindow <= RENDERER_LINES_PER_SECOND;
    },
  };
}

// Counted before the input is parsed, so a line that fails the schema counts too.
// A router middleware runs before validation; one on the procedure would run after.
const admitLine = os.middleware(({ context, next }) =>
  context.rendererLines.admit() ? next() : { output: undefined, context: {} },
);

export const log = os.log.use(admitLine).router({
  write: os.log.write.handler(({ context, input: line }) => {
    // The stack goes through the same frame filter as a main-process error.
    const error =
      line.error === undefined
        ? undefined
        : Object.assign(new Error(), {
            name: line.error.name,
            code: line.error.code,
            stack: line.error.stack ?? "",
          });

    context.log.renderer[line.level](line.scope, line.event, line.fields, error);
  }),
});
