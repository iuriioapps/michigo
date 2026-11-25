import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

import type { Logger } from "@michigo/core";
import { createLogFile, createLogger } from "@michigo/log";
import {
  BrowserWindow,
  Menu,
  type MenuItemConstructorOptions,
  app,
  session,
  shell,
} from "electron";

import { createRpcContext, registerRpc } from "./rpc";
import { createMainErrors } from "./rpc/app";

// import.meta.dirname is unavailable once bundled; derive it from the URL.
const moduleDir = path.dirname(fileURLToPath(import.meta.url));

// Production loads over file://, hence `base: "./"` in vite.config.ts.
const rendererUrl =
  process.env["VITE_DEV_SERVER_URL"] ??
  pathToFileURL(path.join(moduleDir, "../dist/index.html")).href;

// Only https links leave the app, and they go to the system browser.
function openExternally(url: string): void {
  if (URL.parse(url)?.protocol === "https:") {
    void shell.openExternal(url);
  }
}

// Replaces Electron's default menu, which ships Reload and DevTools in the
// packaged app. The Edit menu stays: without it, copy and paste stop working
// on macOS.
function buildMenu(): Menu {
  const devItems: MenuItemConstructorOptions[] = app.isPackaged
    ? []
    : [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
      ];

  return Menu.buildFromTemplate([
    process.platform === "darwin" ? { role: "appMenu" } : { role: "fileMenu" },
    { role: "editMenu" },
    {
      label: "View",
      submenu: [
        ...devItems,
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    { role: "windowMenu" },
  ]);
}

const MAIN_ERROR = "main.uncaught";

// Keeps the code while no page listens, for example while a window loads, and
// hands it to the next page once. A later reload does not show it again.
const mainErrors = createMainErrors();
let quitting = false;

function reportMainError(log: Logger): void {
  mainErrors.report(MAIN_ERROR);
  if (BrowserWindow.getAllWindows().length > 0) {
    return;
  }
  // A failure during startup can come before the first window, which would leave only
  // a dock icon. Not while quitting, or a window would flash before exit.
  if (app.isReady() && !quitting) {
    try {
      createWindow();
    } catch (error) {
      log.error("app", "window.failed", {}, error);
    }
  }
}

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1100,
    height: 750,
    // Avoids a flash of empty chrome before the renderer paints.
    show: false,
    // The design puts the traffic lights inside the sidebar, so macOS loses its
    // title bar and the sidebar supplies its own drag strip. Other platforms
    // keep their normal frame until there is a design for them.
    ...(process.platform === "darwin" ? { titleBarStyle: "hiddenInset" as const } : {}),
    webPreferences: {
      preload: path.join(moduleDir, "preload.cjs"),
      // Electron's security baseline: the renderer is a locked-down browser
      // tab with no Node access. Everything it needs goes through preload.
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      devTools: !app.isPackaged,
    },
  });

  // The app is a single page with hash routing, so it never navigates for
  // real. A link in user content must not replace the app or open a window.
  window.webContents.on("will-navigate", (event, url) => {
    event.preventDefault();
    openExternally(url);
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    openExternally(url);

    return { action: "deny" };
  });

  window.once("ready-to-show", () => {
    window.show();
  });

  void window.loadURL(rendererUrl);
}

// A second launch would run with its own in-memory state. Focus the running
// instance instead.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  const logFile = createLogFile(app.getPath("logs"));
  const logOptions = {
    write: (line: string) => {
      logFile.write(line);
    },
    dataDir: app.getPath("userData"),
    homeDir: app.getPath("home"),
  };
  const log = {
    main: createLogger({ process: "main", ...logOptions }),
    renderer: createLogger({ process: "renderer", ...logOptions }),
  };

  // A listener here also replaces Electron's own error box, which would show the raw
  // message. The window shows only the code.
  process.on("uncaughtException", (error) => {
    log.main.error("process", "uncaught.exception", {}, error);
    reportMainError(log.main);
  });
  process.on("unhandledRejection", (reason) => {
    log.main.error("process", "unhandled.rejection", {}, reason);
    reportMainError(log.main);
  });
  log.main.info("app", "app.start", {
    version: app.getVersion(),
    electron: process.versions.electron,
    platform: `${process.platform}-${process.arch}`,
  });

  app.on("second-instance", () => {
    const [window] = BrowserWindow.getAllWindows();

    if (window !== undefined) {
      if (window.isMinimized()) {
        window.restore();
      }
      window.focus();
    }
  });

  void app.whenReady().then(() => {
    // Electron grants every permission by default. Deny them all (camera,
    // notifications, geolocation, ...) until a feature needs a specific one.
    session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
      callback(false);
    });
    session.defaultSession.setPermissionCheckHandler(() => false);
    Menu.setApplicationMenu(buildMenu());
    registerRpc(rendererUrl, createRpcContext(log, mainErrors));
    createWindow();

    app.on("activate", () => {
      // macOS keeps the app running with no windows; recreate on dock click.
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  // Holds the quit until the last lines (often the error that led to it) reach the disk,
  // for at most 2 s so a stalled disk cannot block quitting. will-quit is the last
  // stage and the windows are closed, so exit() ends the app; a second app.quit()
  // after preventDefault() does not. exit() also skips the `quit` event, so cleanup
  // belongs in will-quit.
  app.on("before-quit", () => {
    quitting = true;
  });

  app.on("will-quit", (event) => {
    event.preventDefault();
    const timeout = new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });
    void Promise.race([logFile.flushed(), timeout]).then(() => {
      app.exit();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}
