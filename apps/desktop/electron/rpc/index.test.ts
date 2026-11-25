// @vitest-environment node
import { MessageChannel, type MessagePort } from "node:worker_threads";

import { createLogger } from "@michigo/log";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/message-port";
import type { ContractRouterClient } from "@orpc/contract";
import { createRouterClient } from "@orpc/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { contract } from "../../shared/contract";
import { RPC_CONNECT } from "../../shared/ports";
import { registerRpc, router } from "./index";

type Listener = (event: unknown) => void;

const listeners = new Map<string, Listener>();

vi.mock("electron", () => ({
  app: { getName: () => "Michigo", getVersion: () => "0.1.0" },
  ipcMain: {
    on: (channel: string, listener: Listener) => listeners.set(channel, listener),
  },
}));

const rendererUrl = "file:///app/dist/index.html";
const trustedFrame = { url: `${rendererUrl}#/projects` };
const evilFrame = { url: "https://evil.example/" };

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
  const log = { main: logger("main"), renderer: logger("renderer") };

  listeners.clear();
  registerRpc(rendererUrl, log);

  const connect = (event: unknown) => {
    const listener = listeners.get(RPC_CONNECT);
    if (listener === undefined) {
      throw new Error(`no listener for ${RPC_CONNECT}`);
    }
    listener(event);
  };

  return { lines, connect, client: createRouterClient(router, { context: { log } }) };
}

describe("the oRPC router", () => {
  let rpc: ReturnType<typeof setup>;
  const ports: MessagePort[] = [];

  beforeEach(() => {
    rpc = setup();
  });

  afterEach(() => {
    for (const port of ports.splice(0)) {
      port.close();
    }
  });

  it("logs the start and the end of projects.create with one actionId and a durationMs", async () => {
    await rpc.client.projects.create({ name: "Frieren" });

    const [start, end] = rpc.lines;
    expect(rpc.lines).toHaveLength(2);
    expect(start).toMatchObject({
      level: "info",
      scope: "ipc",
      event: "ipc.start",
      channel: "projects.create",
    });
    expect(end).toMatchObject({
      level: "info",
      scope: "ipc",
      event: "ipc.end",
      channel: "projects.create",
    });
    expect(typeof start?.["actionId"]).toBe("string");
    expect(end?.["actionId"]).toBe(start?.["actionId"]);
    expect(typeof end?.["durationMs"]).toBe("number");
    expect(JSON.stringify(rpc.lines)).not.toContain("Frieren");
  });

  it("logs input that fails the schema at error with the zod issues, and still rejects", async () => {
    // @ts-expect-error: the renderer is untrusted, so the input may be anything.
    await expect(rpc.client.projects.create({ name: 42 })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });

    expect(rpc.lines.at(-1)).toMatchObject({
      level: "error",
      event: "ipc.failed",
      channel: "projects.create",
      error: { name: "ZodError", issues: [{ path: "name", code: "invalid_type" }] },
    });
  });

  it("serves the app's own page on the port it sends", async () => {
    const { port1, port2 } = new MessageChannel();
    ports.push(port1, port2);
    rpc.connect({ senderFrame: trustedFrame, ports: [port1] });

    const client: ContractRouterClient<typeof contract> = createORPCClient(
      new RPCLink({ port: port2 }),
    );
    port2.start();

    // The store lives as long as the module, so earlier tests may have added to it.
    await expect(client.projects.list()).resolves.toBeInstanceOf(Array);
    expect(rpc.lines).toContainEqual(
      expect.objectContaining({ event: "ipc.end", channel: "projects.list" }),
    );
  });

  it("closes the port of another page and warns once, however often it connects", () => {
    const port = { close: vi.fn<() => void>(), start: vi.fn<() => void>() };

    for (let i = 0; i < 3; i++) {
      rpc.connect({ senderFrame: evilFrame, ports: [port] });
    }

    expect(port.close).toHaveBeenCalledTimes(3);
    expect(port.start).not.toHaveBeenCalled();
    expect(rpc.lines).toEqual([
      expect.objectContaining({ level: "warn", event: "ipc.untrusted", channel: RPC_CONNECT }),
    ]);
  });

  it("refuses a frame without a URL", () => {
    const port = { close: vi.fn<() => void>(), start: vi.fn<() => void>() };

    rpc.connect({ senderFrame: null, ports: [port] });

    expect(port.close).toHaveBeenCalledOnce();
  });
});
