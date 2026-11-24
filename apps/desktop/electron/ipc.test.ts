// @vitest-environment node
import { createLogger } from "@michigo/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { channels } from "../shared/api";
import { registerIpc } from "./ipc";

type Listener = (event: unknown, raw?: unknown) => Promise<unknown>;

const handlers = new Map<string, Listener>();

vi.mock("electron", () => ({
  app: { getName: () => "Michigo", getVersion: () => "0.1.0" },
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

  it("logs the start and the end of project:create with one actionId and a durationMs", async () => {
    await ipc.call(channels.projectCreate, { name: "Frieren" });

    const [start, end] = ipc.lines;
    expect(ipc.lines).toHaveLength(2);
    expect(start).toMatchObject({
      level: "info",
      scope: "ipc",
      event: "ipc.start",
      channel: "project:create",
    });
    expect(end).toMatchObject({
      level: "info",
      scope: "ipc",
      event: "ipc.end",
      channel: "project:create",
    });
    expect(typeof start?.["actionId"]).toBe("string");
    expect(end?.["actionId"]).toBe(start?.["actionId"]);
    expect(typeof end?.["durationMs"]).toBe("number");
    expect(JSON.stringify(ipc.lines)).not.toContain("Frieren");
  });

  it("logs a failed call at error with the zod issues, and still rejects", async () => {
    await expect(ipc.call(channels.projectCreate, { name: 42 })).rejects.toThrow("invalid_type");

    expect(ipc.lines.at(-1)).toMatchObject({
      level: "error",
      event: "ipc.failed",
      channel: "project:create",
      error: { name: "ZodError", issues: [{ path: "name", code: "invalid_type" }] },
    });
  });

  it("logs a call from another frame at warn and refuses it", async () => {
    await expect(
      ipc.call(channels.appInfo, undefined, { senderFrame: { url: "https://evil.example/" } }),
    ).rejects.toThrow("untrusted frame");

    expect(ipc.lines).toEqual([
      expect.objectContaining({ level: "warn", event: "ipc.untrusted", channel: "app:info" }),
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
});
