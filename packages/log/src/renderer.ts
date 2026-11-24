import { z } from "zod";

/**
 * The pure entry, `@michigo/log/renderer`: it must never import `node:*` or
 * `@michigo/core`, because the Electron renderer bundles it. The main process
 * imports the schema from here as well.
 */

/** Shared with the hook below, which cuts an error to fit instead of losing the line. */
export const LOG_ERROR_NAME_MAX_LENGTH = 100;
export const LOG_STACK_MAX_LENGTH = 20_000;

export const LogLevelSchema = z.enum(["error", "warn", "info"]);
export type LogLevel = z.infer<typeof LogLevelSchema>;

/** A stable name such as `source.import.done`, or a scope such as `anki`. */
const LogNameSchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]*(\.[a-z0-9-]+)*$/)
  .max(100);

/**
 * The only shape the renderer may send on `log:write`. The main process adds
 * the time and the process, and turns `error` into name, code and frames.
 */
export const RendererLogLineSchema = z.object({
  level: LogLevelSchema,
  scope: LogNameSchema,
  event: LogNameSchema,
  fields: z
    .record(z.string().max(64), z.union([z.string().max(200), z.number(), z.boolean()]))
    .refine((fields) => Object.keys(fields).length <= 20)
    .optional(),
  error: z
    .object({
      name: z.string().max(LOG_ERROR_NAME_MAX_LENGTH),
      code: z.string().max(LOG_ERROR_NAME_MAX_LENGTH).optional(),
      stack: z.string().max(LOG_STACK_MAX_LENGTH).optional(),
    })
    .optional(),
});
export type RendererLogLine = z.infer<typeof RendererLogLineSchema>;

type LoggedError = NonNullable<RendererLogLine["error"]>;

// The main process keeps only the name, the code and the frames of the stack.
function describeError(error: unknown): LoggedError {
  if (!(error instanceof Error)) {
    return { name: typeof error };
  }

  const code = "code" in error ? error.code : undefined;

  return {
    name: error.name.slice(0, LOG_ERROR_NAME_MAX_LENGTH),
    ...(typeof code === "string" ? { code: code.slice(0, LOG_ERROR_NAME_MAX_LENGTH) } : {}),
    ...(error.stack === undefined ? {} : { stack: error.stack.slice(0, LOG_STACK_MAX_LENGTH) }),
  };
}

/**
 * Sends uncaught errors and unhandled rejections from `target` (the page's
 * `window`) to `write`. Returns the uninstaller.
 */
export function logUncaughtErrors(
  target: EventTarget,
  write: (line: RendererLogLine) => Promise<unknown>,
): () => void {
  const send = (event: string, error: unknown) => {
    // A failed log write has nowhere else to go.
    write({ level: "error", scope: "app", event, error: describeError(error) }).catch(
      () => undefined,
    );
  };
  // `in` checks instead of ErrorEvent and PromiseRejectionEvent, so the package needs no DOM types.
  const onError = (event: Event) => {
    send("uncaught.error", "error" in event ? event.error : undefined);
  };
  const onRejection = (event: Event) => {
    send("unhandled.rejection", "reason" in event ? event.reason : undefined);
  };

  target.addEventListener("error", onError);
  target.addEventListener("unhandledrejection", onRejection);

  return () => {
    target.removeEventListener("error", onError);
    target.removeEventListener("unhandledrejection", onRejection);
  };
}
