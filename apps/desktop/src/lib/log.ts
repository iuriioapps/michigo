import type { RendererLogLine } from "@michigo/core/schemas";

type LoggedError = NonNullable<RendererLogLine["error"]>;

// The main process keeps only the name, the code and the frames of the stack.
function describeError(error: unknown): LoggedError {
  if (!(error instanceof Error)) {
    return { name: typeof error };
  }

  const code = "code" in error ? error.code : undefined;

  return {
    name: error.name.slice(0, 100),
    ...(typeof code === "string" ? { code: code.slice(0, 100) } : {}),
    ...(error.stack === undefined ? {} : { stack: error.stack.slice(0, 20_000) }),
  };
}

function send(event: string, error: unknown): void {
  // A failed log write has nowhere else to go.
  window.michigo.log
    .write({ level: "error", scope: "app", event, error: describeError(error) })
    .catch(() => undefined);
}

function onError(event: ErrorEvent): void {
  send("uncaught.error", event.error);
}

function onRejection(event: PromiseRejectionEvent): void {
  send("unhandled.rejection", event.reason);
}

/** Sends uncaught errors and unhandled rejections to the log. Returns the uninstaller. */
export function logUncaughtErrors(target: Window): () => void {
  target.addEventListener("error", onError);
  target.addEventListener("unhandledrejection", onRejection);

  return () => {
    target.removeEventListener("error", onError);
    target.removeEventListener("unhandledrejection", onRejection);
  };
}
