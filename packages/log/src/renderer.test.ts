import { afterEach, describe, expect, it, vi } from "vitest";

import { type RendererLogLine, RendererLogLineSchema, logUncaughtErrors } from "./renderer";

// Node has neither ErrorEvent nor PromiseRejectionEvent, so the events carry the property by hand.
function errorEvent(error: unknown): Event {
  return Object.assign(new Event("error"), { error });
}

describe("logUncaughtErrors", () => {
  const write = vi.fn<(line: RendererLogLine) => Promise<void>>(() => Promise.resolve());
  const target = new EventTarget();
  let stop: (() => void) | undefined;

  afterEach(() => {
    stop?.();
    write.mockClear();
  });

  function install() {
    stop = logUncaughtErrors(target, write);
  }

  it("sends an uncaught error as a line the main process accepts", () => {
    install();
    const error = new TypeError("MyShow.srt");

    target.dispatchEvent(errorEvent(error));

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

    target.dispatchEvent(Object.assign(new Event("unhandledrejection"), { reason: "MyShow.srt" }));

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

    target.dispatchEvent(errorEvent(error));

    expect(RendererLogLineSchema.safeParse(write.mock.calls[0]?.[0]).success).toBe(true);
  });

  it("stops sending once uninstalled", () => {
    install();
    stop?.();

    target.dispatchEvent(errorEvent(new Error("x")));

    expect(write).not.toHaveBeenCalled();
  });
});
