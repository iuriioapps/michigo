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
const jobs = new Map<string, { id: string; state: string; seconds: number }>();

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
  // Stands in for a long action such as the import of a Source.
  slow_import: {
    description: "PROTOTYPE: waits for the given seconds, like a long import, then returns.",
    input: z.object({ seconds: z.number().min(0).max(600) }),
    run: (input: { seconds: number }) =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({ waited: input.seconds });
        }, input.seconds * 1000);
      }),
  },
  // A real agent client gave up on `slow_import` after about 60 seconds, so a
  // long action starts a job and the agent asks for its state.
  import_start: {
    description:
      "PROTOTYPE: starts a long import that takes the given seconds. Returns a job id at once. Ask import_status for the result.",
    input: z.object({ seconds: z.number().min(0).max(600) }),
    run: (input: { seconds: number }) => {
      const job = { id: randomBytes(4).toString("hex"), state: "running", seconds: input.seconds };

      jobs.set(job.id, job);
      setTimeout(() => {
        job.state = "done";
      }, input.seconds * 1000);

      return job;
    },
  },
  // An agent that cannot sleep asked 18 times in a few seconds. So the status
  // call itself waits, for less than the 60 seconds that a client allows.
  import_status: {
    description:
      "PROTOTYPE: the state of a job from import_start: running or done. Waits up to 30 seconds for the job to finish before it answers.",
    input: z.object({ id: z.string() }),
    run: async (input: { id: string }) => {
      for (let waited = 0; waited < 30 && jobs.get(input.id)?.state === "running"; waited++) {
        await new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });
      }

      return jobs.get(input.id) ?? { state: "unknown" };
    },
  },
  project_create: {
    description: "Create a Project and return it.",
    input: CreateProjectInputSchema,
    changes: true,
    run: (input: z.infer<typeof CreateProjectInputSchema>) => createProject(input),
  },
};

async function callTool(name: string, args: unknown): Promise<unknown> {
  const tool = tools[name];

  if (tool === undefined) {
    return { isError: true, content: [{ type: "text", text: `Unknown tool ${name}` }] };
  }

  try {
    // The same parse as the IPC handler: the agent is as untrusted as the renderer.
    const result = await tool.run(tool.input.parse(args ?? {}) as never);

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
  // `tools/call` returns a promise, and the caller awaits every result.
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

      void Promise.resolve(answer(message.method, message.params ?? {})).then((result) => {
        reply(
          200,
          result === undefined
            ? {
                jsonrpc: "2.0",
                id: message.id,
                error: { code: -32601, message: "Method not found" },
              }
            : { jsonrpc: "2.0", id: message.id, result },
        );
      });
    });
  });

  server.listen(PORT, "127.0.0.1", () => {
    console.log(`[agent prototype] http://127.0.0.1:${PORT}/mcp token=${token}`);
  });
}
