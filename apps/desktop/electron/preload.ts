import { type IpcRendererEvent, contextBridge, ipcRenderer } from "electron";

import { channels, type DesktopApi } from "../shared/api";

/**
 * The waiter between the renderer and main.
 *
 * Only these named functions are exposed — never `ipcRenderer` itself, which
 * would let any code in the page send any message on any channel. Typing the
 * object as `DesktopApi` means a missing or misshapen entry fails to compile.
 */
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
    info: () => ipcRenderer.invoke(channels.appInfo),
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
  projects: {
    list: () => ipcRenderer.invoke(channels.projectList),
    create: (input) => ipcRenderer.invoke(channels.projectCreate, input),
  },
  log: {
    write: (line) => ipcRenderer.invoke(channels.logWrite, line),
  },
};

contextBridge.exposeInMainWorld("michigo", api);
