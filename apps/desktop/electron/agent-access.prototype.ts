// PROTOTYPE, throwaway. Not production code.
//
// Question: can an AI agent drive the running desktop app through MCP, on the
// same handlers and zod schemas that the renderer uses, with no second app?
//
// Shape: a stateless MCP endpoint (Streamable HTTP, JSON responses only) on
// 127.0.0.1 inside the Electron main process. No MCP SDK, no new dependency.
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import process from "node:process";

import { ankiModule } from "@michigo/anki";
import { describeRuntime } from "@michigo/core";
import { CreateProjectInputSchema } from "@michigo/core/schemas";
import { vocabModule } from "@michigo/vocab";
import { BrowserWindow, app } from "electron";
import { z } from "zod";

import { createProject, listProjects } from "./projects";

const PORT = 47800;

interface Tool {
  readonly description: string;
  readonly input: z.ZodType;
  /** True when the tool changes data that the window shows. */
  readonly changes?: boolean;
  readonly run: (input: never) => unknown;
}

// One row per action. In the real app this table and `registerIpc` would read
// the same list, so an action exists once.
const tools: Record<string, Tool> = {
  app_info: {
    description: "Runtime details of the running Michigo app.",
    input: z.object({}),
    run: () =>
      describeRuntime({
        app: app.getName(),
        version: app.getVersion(),
        modules: [vocabModule, ankiModule],
        electron: process.versions.electron,
      }),
  },
  project_list: {
    description: "Every Project, oldest first.",
    input: z.object({}),
    run: () => listProjects(),
  },
  project_create: {
    description: "Create a Project and return it.",
    input: CreateProjectInputSchema,
    changes: true,
    run: (input: z.infer<typeof CreateProjectInputSchema>) => createProject(input),
  },
};

function callTool(name: string, args: unknown): unknown {
  const tool = tools[name];

  if (tool === undefined) {
    return { isError: true, content: [{ type: "text", text: `Unknown tool ${name}` }] };
  }

  try {
    // The same parse as the IPC handler: the agent is as untrusted as the renderer.
    const result = tool.run(tool.input.parse(args ?? {}) as never);

    if (tool.changes === true) {
      for (const window of BrowserWindow.getAllWindows()) {
        window.webContents.send("agent-prototype:changed");
      }
    }

    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  } catch (error) {
    return { isError: true, content: [{ type: "text", text: String(error) }] };
  }
}

function answer(method: string, params: Record<string, unknown>): unknown {
  switch (method) {
    case "initialize":
      return {
        protocolVersion: params["protocolVersion"],
        capabilities: { tools: {} },
        serverInfo: { name: "michigo-prototype", version: app.getVersion() },
      };
    case "ping":
      return {};
    case "tools/list":
      return {
        tools: Object.entries(tools).map(([name, tool]) => ({
          name,
          description: tool.description,
          inputSchema: z.toJSONSchema(tool.input),
        })),
      };
    case "tools/call":
      return callTool(String(params["name"]), params["arguments"]);
    default:
      return undefined;
  }
}

export function startAgentAccessPrototype(): void {
  // A real version shows the token in Settings and keeps it in the data folder.
  const token = process.env["MICHIGO_AGENT_TOKEN"] ?? randomBytes(24).toString("hex");

  const server = createServer((request, response) => {
    const reply = (status: number, body?: unknown): void => {
      response.writeHead(status, { "content-type": "application/json" });
      response.end(body === undefined ? undefined : JSON.stringify(body));
    };

    // A browser always sends Origin on a cross-site POST, and an agent never
    // does. This stops a web page (and DNS rebinding) from reaching the port.
    if (request.headers.origin !== undefined) {
      reply(403);
      return;
    }
    if (request.headers.authorization !== `Bearer ${token}`) {
      reply(401);
      return;
    }
    if (request.method !== "POST" || request.url !== "/mcp") {
      reply(405);
      return;
    }

    let raw = "";

    request.on("data", (chunk: Buffer) => {
      raw += chunk.toString();
    });
    request.on("end", () => {
      const message = JSON.parse(raw) as {
        id?: number | string;
        method: string;
        params?: Record<string, unknown>;
      };

      // A notification has no id and gets no body.
      if (message.id === undefined) {
        reply(202);
        return;
      }

      const result = answer(message.method, message.params ?? {});

      reply(
        200,
        result === undefined
          ? { jsonrpc: "2.0", id: message.id, error: { code: -32601, message: "Method not found" } }
          : { jsonrpc: "2.0", id: message.id, result },
      );
    });
  });

  server.listen(PORT, "127.0.0.1", () => {
    console.log(`[agent prototype] http://127.0.0.1:${PORT}/mcp token=${token}`);
  });
}
