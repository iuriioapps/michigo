import { monitorEventLoopDelay } from "node:perf_hooks";

import type { Logger } from "@michigo/core";

/** The part of Node's event-loop delay histogram that the watch reads. */
export interface DelayHistogram {
  enable(): boolean;
  disable(): boolean;
  reset(): void;
  /** The longest delay since the last reset, in nanoseconds. */
  readonly max: number;
}

export interface MainThreadWatchOptions {
  /** A block longer than this is a stall. "Threads and I/O" in CLAUDE.md sets 50 ms. */
  readonly thresholdMs?: number;
  /** How often the watch reads the histogram, and so the most it logs. */
  readonly intervalMs?: number;
  readonly histogram?: DelayHistogram;
}

/**
 * Logs `main.stall` at `warn` when the main thread was blocked longer than the
 * threshold, with the longest block as `durationMs`. It catches every cause,
 * including the work oRPC does after `logCalls` has returned, such as
 * serializing a large result. The `ipc.start` lines just before it show what ran.
 * Returns a function that stops the watch.
 */
export function watchMainThread(
  log: Logger,
  {
    thresholdMs = 50,
    intervalMs = 1000,
    histogram = monitorEventLoopDelay({ resolution: 10 }),
  }: MainThreadWatchOptions = {},
): () => void {
  histogram.enable();

  const timer = setInterval(() => {
    const maxMs = Math.round(histogram.max / 1e6);

    histogram.reset();
    if (maxMs > thresholdMs) {
      log.warn("main", "main.stall", { durationMs: maxMs });
    }
  }, intervalMs);
  // The watch must never be the reason the process stays alive.
  timer.unref();

  return () => {
    clearInterval(timer);
    histogram.disable();
  };
}
