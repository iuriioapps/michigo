import { type IpcRendererEvent, contextBridge, ipcRenderer } from "electron";

import { channels, type DesktopApi } from "../shared/api";
import { RPC_CONNECT, RPC_PORT_MESSAGE } from "../shared/ports";

/**
 * The waiter between the renderer and main.
 *
 * Its main job is the oRPC handshake: it forwards the port the page posts to
 * main, and every procedure goes through that port. It never exposes
 * `ipcRenderer` itself, which would let any code in the page send any message
 * on any channel. Typing `api` as `DesktopApi` means a missing or misshapen
 * entry fails to compile.
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

// Main can report an error before the page subscribes, so the last code waits here.
let pendingError: string | undefined;
const errorListeners = new Set<(code: string) => void>();

ipcRenderer.on(channels.appError, (_event: IpcRendererEvent, code: string) => {
  if (errorListeners.size === 0) {
    pendingError = code;
  }
  for (const listener of errorListeners) {
    listener(code);
  }
});

const api: DesktopApi = {
  app: {
    // The page gets the code only, never the IPC event.
    onError: (listener) => {
      errorListeners.add(listener);
      if (pendingError !== undefined) {
        const code = pendingError;

        pendingError = undefined;
        listener(code);
      }

      return () => {
        errorListeners.delete(listener);
      };
    },
  },
  log: {
    write: (line) => ipcRenderer.invoke(channels.logWrite, line),
  },
};

contextBridge.exposeInMainWorld("michigo", api);
