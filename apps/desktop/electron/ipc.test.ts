// @vitest-environment node
import { createLogger } from "@michigo/log";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { channels } from "../shared/api";
import { registerIpc } from "./ipc";

type Listener = (event: unknown, raw?: unknown) => Promise<unknown>;

const handlers = new Map<string, Listener>();

vi.mock("electron", () => ({
  ipcMain: {
    handle: (channel: string, listener: Listener) => handlers.set(channel, listener),
  },
}));

const rendererUrl = "file:///app/dist/index.html";
const trusted = { senderFrame: { url: `${rendererUrl}#/projects` } };

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

  handlers.clear();
  registerIpc(rendererUrl, { main: logger("main"), renderer: logger("renderer") });

  const call = (channel: string, raw?: unknown, event: unknown = trusted) => {
    const listener = handlers.get(channel);
    if (listener === undefined) {
      throw new Error(`no handler for ${channel}`);
    }
    return listener(event, raw);
  };

  return { lines, call };
}

describe("registerIpc", () => {
  let ipc: ReturnType<typeof setup>;

  beforeEach(() => {
    ipc = setup();
  });

  it("logs a call from another frame at warn and refuses it", async () => {
    await expect(
      ipc.call(channels.logWrite, undefined, { senderFrame: { url: "https://evil.example/" } }),
    ).rejects.toThrow("untrusted frame");

    expect(ipc.lines).toEqual([
      expect.objectContaining({ level: "warn", event: "ipc.untrusted", channel: "log:write" }),
    ]);
  });

  it("writes a renderer line as the renderer process, without logging the call itself", async () => {
    await ipc.call(channels.logWrite, {
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
    await expect(
      ipc.call(channels.logWrite, { level: "debug", scope: "x", event: "y" }),
    ).rejects.toThrow("invalid_value");
  });

  it("writes at most 100 renderer lines per second, so a flood cannot push out the history", async () => {
    const line = { level: "info", scope: "app", event: "app.flood" };

    await Promise.all(Array.from({ length: 150 }, () => ipc.call(channels.logWrite, line)));

    expect(ipc.lines).toHaveLength(100);
  });

  it("counts a line that fails the schema toward the limit, so failures cannot flood the log either", async () => {
    const bad = { level: "debug", scope: "app", event: "app.flood" };

    await Promise.allSettled(Array.from({ length: 150 }, () => ipc.call(channels.logWrite, bad)));

    expect(ipc.lines.filter((line) => line["event"] === "ipc.failed")).toHaveLength(100);
  });

  it("marks the lines it dropped once the next second starts", async () => {
    vi.useFakeTimers({ toFake: ["performance"] });
    try {
      const line = { level: "info", scope: "app", event: "app.flood" };
      await Promise.all(Array.from({ length: 130 }, () => ipc.call(channels.logWrite, line)));
      vi.advanceTimersByTime(1000);

      await ipc.call(channels.logWrite, line);

      expect(ipc.lines).toContainEqual(
        expect.objectContaining({ level: "warn", event: "log.dropped", count: 30 }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("warns about an untrusted frame once per channel", async () => {
    const evil = { senderFrame: { url: "https://evil.example/" } };

    await Promise.allSettled([1, 2, 3].map(() => ipc.call(channels.logWrite, undefined, evil)));

    expect(ipc.lines).toHaveLength(1);
  });

  it("keeps the error of a renderer line at info", async () => {
    await ipc.call(channels.logWrite, {
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
