import { ipcRenderer } from "electron";

import { RPC_CONNECT, RPC_PORT_MESSAGE } from "../shared/ports";

/**
 * The waiter between the renderer and main, with one job: the oRPC handshake.
 * It forwards the port the page posts to main, and every procedure goes through
 * that port, so adding one never touches this file. It never exposes
 * `ipcRenderer` itself, which would let any code in the page send any message
 * on any channel.
 */

// The preload compiles with the main process, which has no DOM types, so this
// names the one part of `window` it uses.
type Port = NonNullable<Parameters<typeof ipcRenderer.postMessage>[2]>[number];

declare const window: {
  addEventListener(
    type: "message",
    listener: (event: { source: unknown; data: unknown; ports: readonly Port[] }) => void,
  ): void;
};

// Only a message from this window itself, never from a frame inside it.
window.addEventListener("message", (event) => {
  if (event.source !== window || event.data !== RPC_PORT_MESSAGE) {
    return;
  }
  const [port] = event.ports;

  if (port !== undefined) {
    ipcRenderer.postMessage(RPC_CONNECT, null, [port]);
  }
});
