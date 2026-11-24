import path from "node:path";
import { fileURLToPath } from "node:url";

import { type LogFields, type Logger, MichigoError } from "@michigo/core";
import { ZodError } from "zod";

import { stackFrames } from "./frames";
import type { LogLevel } from "./renderer";

export type LogProcess = "main" | "storage" | "dictionary-build" | "tokenizer" | "renderer";

export interface LoggerOptions {
  readonly process: LogProcess;
  /** Receives one finished JSON line, newline included. */
  readonly write: (line: string) => void;
  /** Paths inside it are logged relative to it. Paths outside it are dropped. */
  readonly dataDir: string;
  /** Replaced with `~` in stack frames. */
  readonly homeDir: string;
  readonly now?: () => number;
}

const fixedKeys = new Set(["time", "level", "process", "scope", "event", "error"]);

const MAX_LOGGED_ISSUES = 10;

// A part of a zod issue path is a field name of the schema or a record key of the
// input, and a record key is received text. Only a short ASCII name is kept.
function safePathPart(part: PropertyKey): string {
  if (typeof part === "number") {
    return String(part);
  }

  return typeof part === "string" && /^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(part) ? part : "*";
}

/**
 * The one logger of every Michigo process. A worker passes a `write` that
 * posts the line to the main process, which appends it to the log file.
 */
export function createLogger(options: LoggerOptions): Logger {
  const { dataDir, homeDir, now = Date.now } = options;

  // The path relative to the data folder, or undefined for a path outside it,
  // which can name the learner's files and so never reaches the log.
  function insideDataDir(value: string): string | undefined {
    let absolute: string;
    try {
      absolute = value.startsWith("file:") ? fileURLToPath(value) : value;
    } catch {
      return undefined;
    }
    const relative = path.relative(dataDir, absolute);
    const outside =
      relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);

    return outside ? undefined : relative;
  }

  function safeFields(fields: LogFields): Record<string, unknown> {
    const safe: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(fields)) {
      if (fixedKeys.has(key) || value === undefined) {
        continue;
      }
      if (typeof value === "string" && (value.startsWith("file:") || path.isAbsolute(value))) {
        const relative = insideDataDir(value);

        if (relative !== undefined) {
          safe[key] = relative;
        }
      } else {
        safe[key] = value;
      }
    }

    return safe;
  }

  // Renderer frames are file:// URLs: forward slashes on Windows too, and a
  // name with spaces or Japanese characters is percent-encoded.
  const slashedHome = homeDir.replaceAll("\\", "/");
  const homeForms = homeDir === "" ? [] : [homeDir, slashedHome, encodeURI(slashedHome)];

  function hideHome(frame: string): string {
    return homeForms.reduce((hidden, form) => hidden.replaceAll(form, "~"), frame);
  }

  function serializeError(error: unknown): Record<string, unknown> {
    // A thrown non-error is a value, and a value can be the learner's text.
    if (!(error instanceof Error)) {
      return { name: typeof error };
    }

    const code = "code" in error ? error.code : undefined;
    const errcode = "errcode" in error ? error.errcode : undefined;
    const frames = stackFrames(error).map((line) => hideHome(line.trim()));

    return {
      name: error.name,
      ...(error instanceof MichigoError ? { message: error.message } : {}),
      ...(typeof code === "string" || typeof code === "number" ? { code } : {}),
      // SQLite's result code, such as 2067 for a unique constraint.
      ...(typeof errcode === "number" ? { errcode } : {}),
      ...(error instanceof ZodError
        ? {
            issueCount: error.issues.length,
            issues: error.issues.slice(0, MAX_LOGGED_ISSUES).map((issue) => ({
              path: issue.path.map(safePathPart).join("."),
              code: issue.code,
            })),
          }
        : {}),
      frames,
    };
  }

  function log(level: LogLevel, scope: string, event: string, fields: LogFields, error?: unknown) {
    const line = {
      // shortcut: Date formats the instant until `Temporal` is in `lib`; switch to Temporal.Instant then.
      time: new Date(now()).toISOString(),
      level,
      process: options.process,
      scope,
      event,
      ...safeFields(fields),
      ...(error === undefined ? {} : { error: serializeError(error) }),
    };

    options.write(`${JSON.stringify(line)}\n`);
  }

  return {
    info: (scope, event, fields = {}, error) => log("info", scope, event, fields, error),
    warn: (scope, event, fields = {}, error) => log("warn", scope, event, fields, error),
    error: (scope, event, fields = {}, error) => log("error", scope, event, fields, error),
  };
}
