import type { RendererLogLine } from "@michigo/core/schemas";
import { RendererLogLineSchema } from "@michigo/core/schemas";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createApiStub } from "../test/render";
import { logUncaughtErrors } from "./log";

describe("logUncaughtErrors", () => {
  const write = vi.fn<(line: RendererLogLine) => Promise<void>>(() => Promise.resolve());
  let stop: (() => void) | undefined;

  afterEach(() => {
    stop?.();
    write.mockClear();
  });

  function install() {
    window.michigo = createApiStub({ log: { write } });
    stop = logUncaughtErrors(window);
  }

  it("sends an uncaught error as a line the main process accepts", () => {
    install();
    const error = new TypeError("MyShow.srt");

    window.dispatchEvent(new ErrorEvent("error", { error }));

    const line = write.mock.calls[0]?.[0];
    expect(line).toEqual({
      level: "error",
      scope: "app",
      event: "uncaught.error",
      error: { name: "TypeError", stack: error.stack },
    });
    expect(RendererLogLineSchema.safeParse(line).success).toBe(true);
  });

  it("sends an unhandled rejection, and a non-error reason only by its type", () => {
    install();

    // happy-dom has no PromiseRejectionEvent.
    window.dispatchEvent(Object.assign(new Event("unhandledrejection"), { reason: "MyShow.srt" }));

    expect(write).toHaveBeenCalledWith({
      level: "error",
      scope: "app",
      event: "unhandled.rejection",
      error: { name: "string" },
    });
  });

  it("cuts a stack that is longer than the main process accepts", () => {
    install();
    const error = new Error("x");
    error.stack = "a".repeat(30_000);

    window.dispatchEvent(new ErrorEvent("error", { error }));

    expect(RendererLogLineSchema.safeParse(write.mock.calls[0]?.[0]).success).toBe(true);
  });
});
