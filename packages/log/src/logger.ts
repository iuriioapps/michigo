import path from "node:path";

import { type LogFields, type Logger, MichigoError } from "@michigo/core";
import { ZodError } from "zod";

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

/**
 * The one logger of every Michigo process. A worker passes a `write` that
 * posts the line to the main process, which appends it to the log file.
 */
export function createLogger(options: LoggerOptions): Logger {
  const { dataDir, homeDir, now = Date.now } = options;

  function safeFields(fields: LogFields): Record<string, unknown> {
    const safe: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(fields)) {
      if (fixedKeys.has(key) || value === undefined) {
        continue;
      }
      if (typeof value === "string" && path.isAbsolute(value)) {
        const relative = path.relative(dataDir, value);

        // An outside path can name the learner's files, so it never reaches the log.
        if (relative.startsWith("..") || path.isAbsolute(relative)) {
          continue;
        }
        safe[key] = relative;
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
    // The first stack line repeats the message, which can span several lines.
    const frames = (error.stack ?? "")
      .split("\n")
      .filter((line) => /^\s+at /.test(line))
      .map((line) => hideHome(line.trim()));

    return {
      name: error.name,
      ...(error instanceof MichigoError ? { message: error.message } : {}),
      ...(typeof code === "string" || typeof code === "number" ? { code } : {}),
      // SQLite's result code, such as 2067 for a unique constraint.
      ...(typeof errcode === "number" ? { errcode } : {}),
      ...(error instanceof ZodError
        ? {
            issues: error.issues.map((issue) => ({ path: issue.path.join("."), code: issue.code })),
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
    info: (scope, event, fields = {}) => log("info", scope, event, fields),
    warn: (scope, event, fields = {}, error) => log("warn", scope, event, fields, error),
    error: (scope, event, fields = {}, error) => log("error", scope, event, fields, error),
  };
}
