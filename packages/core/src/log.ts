/**
 * What a package receives when it logs. The app creates the logger with
 * `@michigo/log` and passes it in, because a package imports only `core`.
 */
export interface Logger {
  info(scope: string, event: string, fields?: LogFields): void;
  warn(scope: string, event: string, fields?: LogFields, error?: unknown): void;
  error(scope: string, event: string, fields?: LogFields, error?: unknown): void;
}

/** Ids, counts, `durationMs`, versions and status codes. Never the learner's text. */
export type LogFields = Readonly<Record<string, string | number | boolean | undefined>>;
