import type { CreateProjectInput, Project, RuntimeInfo } from "@michigo/core/schemas";
import type { ClientContext, ClientLink } from "@orpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { render } from "@testing-library/react";

import type { DesktopApi } from "../../shared/api";
import { RouteError, RouteNotFound } from "../components/route-fallbacks";
import { setRpcLink } from "../lib/rpc";
import { routeTree } from "../routeTree.gen";

export const runtimeInfo: RuntimeInfo = {
  app: "Michigo",
  version: "0.1.0",
  node: "24.21.0",
  platform: "darwin-x64",
  electron: "44.4.5",
  modules: [
    { name: "@michigo/vocab", version: "0.1.0", status: "scaffold" },
    { name: "@michigo/anki", version: "0.1.0", status: "scaffold" },
  ],
};

/** The procedures of the contract and the rest of `window.michigo`, as plain functions. */
export interface ApiStub {
  readonly app: { info(): Promise<RuntimeInfo>; onError: DesktopApi["app"]["onError"] };
  readonly projects: {
    list(): Promise<Project[]>;
    create(input: CreateProjectInput): Promise<Project>;
  };
  readonly log: DesktopApi["log"];
}

/**
 * A stand-in for the main process.
 *
 * The projects namespace is backed by a real array rather than a fixed
 * resolved value, so `create` genuinely affects the next `list` — which is the
 * only way the create-then-refetch flow can be tested honestly.
 */
export function createApiStub(
  overrides: Partial<ApiStub> = {},
  seed: readonly string[] = [],
): ApiStub {
  const projects: Project[] = [];

  const add = (name: string): Project => {
    const project: Project = {
      id: `project-${String(projects.length)}`,
      name,
      createdAt: "2026-09-25T00:00:00.000Z",
    };

    projects.push(project);

    return project;
  };

  seed.forEach(add);

  return {
    app: { info: () => Promise.resolve(runtimeInfo), onError: () => () => undefined },
    projects: {
      list: () => Promise.resolve([...projects]),
      create: (input) => Promise.resolve(add(input.name)),
    },
    log: { write: () => Promise.resolve() },
    ...overrides,
  };
}

// Calls the stub function at the procedure's path, in place of the port to main.
function linkTo(api: ApiStub): ClientLink<ClientContext> {
  return {
    call: async (path, input) => {
      let procedure: unknown = api;

      for (const key of path) {
        procedure =
          typeof procedure === "object" && procedure !== null
            ? Reflect.get(procedure, key)
            : undefined;
      }
      if (typeof procedure !== "function") {
        throw new Error(`The stub has no ${path.join(".")}`);
      }
      const output: unknown = await Reflect.apply(procedure, undefined, [input]);

      return output;
    },
  };
}

/**
 * The renderer only talks to main through the oRPC client and `window.michigo`,
 * so the whole UI is testable by faking both. No Electron process is started.
 *
 * Memory history, where the app uses hash history — tests need no URL.
 */
export function renderRoute(path: string, api: ApiStub = createApiStub()) {
  window.michigo = { app: { onError: api.app.onError }, log: api.log };
  setRpcLink(linkTo(api));

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    defaultErrorComponent: RouteError,
    defaultNotFoundComponent: RouteNotFound,
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}
