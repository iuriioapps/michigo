// @vitest-environment node
import { createLogger } from "@michigo/log";
import { afterEach, describe, expect, it, vi } from "vitest";

import { type DelayHistogram, watchMainThread } from "./main-thread-watch";

function setup() {
  const lines: Record<string, unknown>[] = [];
  const log = createLogger({
    process: "main",
    write: (line) => {
      const parsed: Record<string, unknown> = JSON.parse(line);
      lines.push(parsed);
    },
    dataDir: "/data",
    homeDir: "/home/learner",
  });

  return { lines, log };
}

// A histogram that reports whatever longest delay the test sets.
function fakeHistogram() {
  const histogram = {
    max: 0,
    enable: () => true,
    disable: () => true,
    reset: () => {
      histogram.max = 0;
    },
  } satisfies DelayHistogram;

  return histogram;
}

describe("watchMainThread", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("logs a block longer than the threshold once per interval, with its length", () => {
    vi.useFakeTimers();
    const { lines, log } = setup();
    const histogram = fakeHistogram();
    const stop = watchMainThread(log, { histogram });

    histogram.max = 161e6;
    vi.advanceTimersByTime(1000);
    vi.advanceTimersByTime(1000);
    stop();

    expect(lines).toEqual([
      expect.objectContaining({
        level: "warn",
        scope: "main",
        event: "main.stall",
        durationMs: 161,
      }),
    ]);
  });

  it("stays quiet when every block is within the threshold", () => {
    vi.useFakeTimers();
    const { lines, log } = setup();
    const histogram = fakeHistogram();
    const stop = watchMainThread(log, { histogram });

    histogram.max = 50e6;
    vi.advanceTimersByTime(1000);
    stop();

    expect(lines).toEqual([]);
  });

  it("notices a real block of the main thread", async () => {
    const { lines, log } = setup();
    const stop = watchMainThread(log, { intervalMs: 100 });
    // The histogram records nothing before its first sample, so let it start.
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Blocks the thread four times longer than the threshold.
    const until = performance.now() + 200;
    while (performance.now() < until) {
      // busy
    }
    await vi.waitFor(() => {
      expect(lines).toContainEqual(expect.objectContaining({ event: "main.stall" }));
    });
    stop();

    const stall = lines.find((line) => line["event"] === "main.stall");
    expect(stall?.["durationMs"]).toBeGreaterThanOrEqual(150);
  });
});
