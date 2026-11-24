import { type IpcRendererEvent, contextBridge, ipcRenderer } from "electron";

import { channels, type DesktopApi } from "../shared/api";

/**
 * The waiter between the renderer and main.
 *
 * Only these named functions are exposed — never `ipcRenderer` itself, which
 * would let any code in the page send any message on any channel. Typing the
 * object as `DesktopApi` means a missing or misshapen entry fails to compile.
 */
const api: DesktopApi = {
  app: {
    info: () => ipcRenderer.invoke(channels.appInfo),
    onError: (listener) => {
      // The page gets the code only, never the IPC event.
      const forward = (_event: IpcRendererEvent, code: string) => {
        listener(code);
      };

      ipcRenderer.on(channels.appError, forward);

      return () => {
        ipcRenderer.off(channels.appError, forward);
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
