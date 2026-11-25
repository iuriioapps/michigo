import { errorLine } from "@michigo/log/renderer";
import { consumeEventIterator } from "@orpc/client";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { NewProjectProvider } from "@/components/new-project-dialog";
import { RouteError } from "@/components/route-fallbacks";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { rpc } from "@/lib/rpc";

export const Route = createRootRoute({ component: AppShell });

/**
 * The two-pane shell every route renders inside: a fixed sidebar beside a
 * scrolling content pane.
 *
 * Both panes open with a drag strip of the same height. Together they span the
 * full window width, which is the only reason the window can be moved by its
 * top edge — `titleBarStyle: "hiddenInset"` removes the title bar macOS would
 * otherwise provide, and nothing is draggable unless we say so.
 *
 * The strip sits outside the scroll container so it cannot scroll away, and
 * holds nothing interactive: a drag region swallows clicks on anything inside
 * it that is not marked `titlebar-no-drag`.
 */
function AppShell() {
  // An error the main process did not catch arrives as a code only.
  const [mainError, setMainError] = useState<string>();

  useEffect(() => {
    const cancel = consumeEventIterator(rpc.app.errors(), {
      onEvent: setMainError,
      // Without the stream the page would miss every later main error, so the log keeps why.
      onError: (error) => {
        rpc.log.write(errorLine("app.errors.failed", error)).catch(() => undefined);
      },
    });

    return () => {
      void cancel();
    };
  }, []);

  return (
    <NewProjectProvider>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <main className="flex min-w-0 flex-1 flex-col">
          {/* -ml-px closes the one-pixel dead column over the sidebar's right
              border, so the two strips form one continuous band. */}
          <div className="titlebar-drag -ml-px h-11 shrink-0" />
          <div className="min-h-0 flex-1 overflow-y-auto">
            {mainError === undefined ? (
              <Outlet />
            ) : (
              <RouteError
                error={new Error(mainError)}
                reset={() => {
                  setMainError(undefined);
                }}
              />
            )}
          </div>
        </main>
      </div>
    </NewProjectProvider>
  );
}
