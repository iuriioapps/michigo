import { errorLine } from "@michigo/log/renderer";
import { createHashHistory, createRouter } from "@tanstack/react-router";

import { RouteError, RouteNotFound } from "./components/route-fallbacks";
import { rpc } from "./lib/rpc";
import { routeTree } from "./routeTree.gen";

export const router = createRouter({
  routeTree,
  // Hash history, not browser history: production loads the renderer from a
  // file:// URL, where pushState paths do not resolve to anything.
  history: createHashHistory(),
  defaultErrorComponent: RouteError,
  defaultNotFoundComponent: RouteNotFound,
  // The error screen shows only a code, so the log keeps what happened.
  defaultOnCatch: (error) => {
    rpc.log.write(errorLine("route.error", error)).catch(() => undefined);
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
