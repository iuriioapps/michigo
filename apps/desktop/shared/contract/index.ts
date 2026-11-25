import { app } from "./app";
import { projects } from "./projects";

/**
 * The IPC contract: every procedure the renderer can call, with its input and
 * output schemas. Main implements it in `electron/rpc/`, and the router fails to
 * compile while a procedure has no handler. oRPC parses the input against the
 * schema before the handler runs.
 *
 * The renderer imports this file, so it and its domain files import schemas only
 * from the pure entry points `@michigo/core/schemas` and `@michigo/log/renderer`.
 */
export const contract = { app, projects };

export type { RpcMeta } from "./base";
