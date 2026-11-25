import type { Project, RuntimeInfo } from "@michigo/core/schemas";
import { type Client, type ClientContext, type ClientLink, EventPublisher } from "@orpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { render } from "@testing-library/react";

import { RouteError, RouteNotFound } from "../components/route-fallbacks";
import { type RpcClient, setRpcLink } from "../lib/rpc";
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

type Stub<T> = {
  readonly [K in keyof T]: T[K] extends Client<
    infer _Context,
    infer Input,
    infer Output,
    infer _Error
  >
    ? (input: Input) => Promise<Streamed<Output>>
    : Stub<T[K]>;
};

// A stub streams with any async iterator, not only oRPC's own class.
type Streamed<Output> =
  Output extends AsyncIterable<infer Value> ? AsyncIterator<Value> & AsyncIterable<Value> : Output;

/** Every procedure of the contract as a plain function, so a missing one fails to compile. */
export type ApiStub = Stub<RpcClient>;

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
    app: {
      info: () => Promise.resolve(runtimeInfo),
      // A stream that never yields: main reports no error unless a test publishes one.
      errors: () => Promise.resolve(new EventPublisher<{ error: string }>().subscribe("error")),
    },
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
 * The renderer only talks to main through the oRPC client, so the whole UI is
 * testable by pointing it at a stub. No Electron process is started.
 *
 * Memory history, where the app uses hash history — tests need no URL.
 */
export function renderRoute(path: string, api: ApiStub = createApiStub()) {
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
