import { RPCHandler } from "@orpc/server/message-port";
import { ipcMain } from "electron";

import { RPC_CONNECT } from "../../shared/ports";
import { trustedSender } from "../trusted-sender";
import { app } from "./app";
import { type RpcContext, logCalls, os } from "./base";
import { projects } from "./projects";

export const router = os.use(logCalls).router({ app, projects });

/**
 * Serves the contract on the port that the preload forwards on `rpc:connect`.
 *
 * Every call after the handshake goes through that port, so the sender check
 * here is the only one: a frame of another page gets no port and one warn line.
 * A reload sends a new port, and the old one closes with the old page.
 */
export function registerRpc(rendererUrl: string, log: RpcContext["log"]): void {
  const handler = new RPCHandler(router);
  const isTrusted = trustedSender(rendererUrl);
  let warned = false;

  ipcMain.on(RPC_CONNECT, (event) => {
    const [port] = event.ports;

    if (!isTrusted(event)) {
      // Once, so a frame that keeps connecting cannot flood the log.
      if (!warned) {
        warned = true;
        log.main.warn("ipc", "ipc.untrusted", { channel: RPC_CONNECT });
      }
      port?.close();

      return;
    }
    if (port === undefined) {
      return;
    }
    handler.upgrade(port, { context: { log } });
    port.start();
  });
}
