import { z } from "zod";

/**
 * Pure schemas: this module must never import from `node:*`.
 *
 * It is the `@michigo/core/schemas` entry point precisely so the Electron
 * renderer can import these types without dragging Node built-ins into the
 * browser bundle. Anything needing Node APIs belongs in the `.` entry instead.
 */

export const ModuleStatusSchema = z.enum(["scaffold", "ready"]);
export type ModuleStatus = z.infer<typeof ModuleStatusSchema>;

/** Self-description that every `@michigo/*` domain package exports. */
export const ModuleInfoSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  status: ModuleStatusSchema,
});
export type ModuleInfo = z.infer<typeof ModuleInfoSchema>;

/** What the desktop UI renders. */
export const RuntimeInfoSchema = z.object({
  app: z.string().min(1),
  version: z.string().min(1),
  node: z.string().min(1),
  platform: z.string().min(1),
  /** Present only when running inside Electron. */
  electron: z.string().min(1).optional(),
  modules: z.array(ModuleInfoSchema),
});
export type RuntimeInfo = z.infer<typeof RuntimeInfoSchema>;

/**
 * A project: one set of texts the user wants to understand.
 *
 * `id` and `createdAt` are the main process's to assign, which is why creating
 * one takes a separate, narrower input type rather than a partial `Project`.
 */
/** Shared with the renderer's input, so the field cannot accept more than main does. */
export const PROJECT_NAME_MAX_LENGTH = 200;

export const ProjectSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(PROJECT_NAME_MAX_LENGTH),
  createdAt: z.iso.datetime(),
});
export type Project = z.infer<typeof ProjectSchema>;

/** The only shape the renderer is allowed to send on `project:create`. */
export const CreateProjectInputSchema = z.object({
  name: z.string().trim().min(1).max(PROJECT_NAME_MAX_LENGTH),
});
export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>;

/** Shared with the renderer, which cuts an error to fit instead of losing the line. */
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
