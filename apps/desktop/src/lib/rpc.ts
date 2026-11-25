import { type ClientContext, type ClientLink, DynamicLink, createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/message-port";
import type { ContractRouterClient } from "@orpc/contract";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

import type { contract } from "../../shared/contract";
import { RPC_PORT_MESSAGE } from "../../shared/ports";

export type RpcClient = ContractRouterClient<typeof contract>;

// Resolved per call, so `connectRpc` and the test harness can each set it.
let link: ClientLink<ClientContext> | undefined;

/** The client for calls outside TanStack Query. */
export const rpc: RpcClient = createORPCClient(
  new DynamicLink(() => {
    if (link === undefined) {
      throw new Error("rpc.not-connected");
    }

    return link;
  }),
);

/**
 * Query and mutation options, with keys, for every procedure in the contract:
 * `useQuery(orpc.projects.list.queryOptions())`, and
 * `queryClient.invalidateQueries({ queryKey: orpc.projects.key() })`.
 */
export const orpc = createTanstackQueryUtils(rpc);

/** Points the client at another link. Only the test harness calls it. */
export function setRpcLink(next: ClientLink<ClientContext>): void {
  link = next;
}

/**
 * Opens the port to main: posts one end to the preload, which forwards it to
 * main, and talks oRPC over the other.
 */
export function connectRpc(): void {
  const { port1, port2 } = new MessageChannel();

  // "*" is safe: the message goes to this window itself, and a file:// page
  // has the opaque origin "null", which no target origin can name.
  window.postMessage(RPC_PORT_MESSAGE, "*", [port2]);
  link = new RPCLink({ port: port1 });
  port1.start();
}
