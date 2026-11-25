// @vitest-environment node
import { createLogger } from "@michigo/log";
import { createRouterClient } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMainErrors } from "./app";
import { createRpcContext, router } from "./index";

vi.mock("electron", () => ({ app: {}, ipcMain: { on: () => undefined } }));

function setup() {
  const lines: Record<string, unknown>[] = [];
  const logger = (process: "main" | "renderer") =>
    createLogger({
      process,
      write: (line) => {
        const parsed: Record<string, unknown> = JSON.parse(line);
        lines.push(parsed);
      },
      dataDir: "/data",
      homeDir: "/home/learner",
    });
  const context = createRpcContext(
    { main: logger("main"), renderer: logger("renderer") },
    createMainErrors(),
  );
  // Method syntax takes any argument here: the renderer is untrusted, so a test
  // sends lines the schema refuses too.
  const client: { log: { write(raw: unknown): Promise<void> } } = createRouterClient(router, {
    context,
  });

  return { lines, write: (raw: unknown) => client.log.write(raw) };
}

describe("log.write", () => {
  let ipc: ReturnType<typeof setup>;

  beforeEach(() => {
    ipc = setup();
  });

  it("writes a renderer line as the renderer process, without logging the call itself", async () => {
    await ipc.write({
      level: "error",
      scope: "renderer",
      event: "uncaught.error",
      fields: { route: "settings" },
      error: { name: "TypeError", stack: "TypeError: MyShow.srt\n    at /home/learner/app.js:1:2" },
    });

    expect(ipc.lines).toEqual([
      expect.objectContaining({
        level: "error",
        process: "renderer",
        event: "uncaught.error",
        route: "settings",
        error: { name: "TypeError", frames: ["at ~/app.js:1:2"] },
      }),
    ]);
  });

  it("rejects a renderer line that fails the schema", async () => {
    await expect(ipc.write({ level: "debug", scope: "x", event: "y" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("writes at most 100 renderer lines per second, so a flood cannot push out the history", async () => {
    const line = { level: "info", scope: "app", event: "app.flood" };

    await Promise.all(Array.from({ length: 150 }, () => ipc.write(line)));

    expect(ipc.lines).toHaveLength(100);
  });

  it("counts a line that fails the schema toward the limit, so failures cannot flood the log either", async () => {
    const bad = { level: "debug", scope: "app", event: "app.flood" };

    await Promise.allSettled(Array.from({ length: 150 }, () => ipc.write(bad)));

    expect(ipc.lines.filter((line) => line["event"] === "ipc.failed")).toHaveLength(100);
  });

  it("marks the lines it dropped once the next second starts", async () => {
    vi.useFakeTimers({ toFake: ["performance"] });
    try {
      const line = { level: "info", scope: "app", event: "app.flood" };
      await Promise.all(Array.from({ length: 130 }, () => ipc.write(line)));
      vi.advanceTimersByTime(1000);

      await ipc.write(line);

      expect(ipc.lines).toContainEqual(
        expect.objectContaining({ level: "warn", event: "log.dropped", count: 30 }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps the error of a renderer line at info", async () => {
    await ipc.write({
      level: "info",
      scope: "app",
      event: "app.retry",
      error: { name: "TypeError", stack: "TypeError\n    at /home/learner/app.js:1:2" },
    });

    expect(ipc.lines[0]).toMatchObject({
      error: { name: "TypeError", frames: ["at ~/app.js:1:2"] },
    });
  });
});
