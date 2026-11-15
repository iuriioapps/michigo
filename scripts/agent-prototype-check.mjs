// PROTOTYPE, throwaway. Starts a packaged Michigo and drives the MCP endpoint.
// Usage: node scripts/agent-prototype-check.mjs <path to the packaged binary>
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const url = "http://127.0.0.1:47800/mcp";
const token = "check-token";
const app = spawn(process.argv[2], process.argv.slice(3), {
  env: { ...process.env, MICHIGO_AGENT_TOKEN: token },
  stdio: "inherit",
});

let id = 0;

async function rpc(method, params, headers = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...headers },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
  });

  return { status: response.status, body: response.status === 200 ? await response.json() : null };
}

const call = async (name, args) =>
  (await rpc("tools/call", { name, arguments: args })).body.result;

try {
  for (let attempt = 0; ; attempt++) {
    try {
      await rpc("ping");
      break;
    } catch (error) {
      if (attempt > 120) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  assert.equal((await rpc("ping", undefined, { authorization: "Bearer wrong" })).status, 401);
  assert.equal((await rpc("ping", undefined, { origin: "https://evil.example" })).status, 403);

  const tools = (await rpc("tools/list")).body.result.tools.map((tool) => tool.name);
  assert.deepEqual(tools, ["app_info", "project_list", "slow_import", "project_create"]);

  console.log("app_info:", (await call("app_info", {})).content[0].text);
  assert.equal(JSON.parse((await call("project_create", { name: " Frieren " })).content[0].text).name, "Frieren");
  assert.equal((await call("project_create", { name: "" })).isError, true);

  // A long call must not block other calls.
  const slow = call("slow_import", { seconds: 20 });
  const started = Date.now();
  const list = JSON.parse((await call("project_list", {})).content[0].text);
  const listMs = Date.now() - started;

  assert.equal(list.length, 1);
  assert.ok(listMs < 2000, `project_list took ${listMs} ms during a long call`);
  assert.deepEqual(JSON.parse((await slow).content[0].text), { waited: 20 });
  console.log(`OK on ${process.platform}-${process.arch}: list during a long call took ${listMs} ms`);
} finally {
  app.kill();
}
process.exit(0);
