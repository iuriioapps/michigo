import { randomUUID } from "node:crypto";

import type { Logger } from "@michigo/core";
import { ORPCError, ValidationError, implement } from "@orpc/server";
import { ZodRealError } from "zod";
import type { $ZodIssue } from "zod/v4/core";

import { contract } from "../../shared/contract";
import type { MainErrors } from "./app";
import type { RendererLineLimit } from "./log";

/** What handlers share. `registerRpc` makes one for the life of the process. */
export interface RpcContext {
  readonly log: { readonly main: Logger; readonly renderer: Logger };
  readonly mainErrors: MainErrors;
  readonly rendererLines: RendererLineLimit;
}

/** Each domain file implements its part of the contract from here. */
export const os = implement(contract).$context<RpcContext>();

// oRPC wraps a failed input parse. Every input schema is zod, so the issues are
// zod issues, and rewrapping them lets the logger print their paths and codes.
// `ZodRealError` is the subclass that zod throws: unlike a bare `ZodError`, it is an `Error`.
function loggable(error: unknown): unknown {
  if (!(error instanceof ORPCError) || !(error.cause instanceof ValidationError)) {
    return error;
  }
  const { issues } = error.cause;

  return issues.every(isZodIssue) ? new ZodRealError([...issues]) : error;
}

function isZodIssue(issue: ValidationError["issues"][number]): issue is $ZodIssue {
  return "code" in issue && typeof issue.code === "string";
}

/**
 * Makes the `actionId` of each call and logs its start, its end and any failure.
 * It runs before input validation, so a call that fails the schema is logged too.
 */
export const logCalls = os.middleware(async ({ context, next, path, procedure }) => {
  const log = context.log.main;
  const channel = path.join(".");
  const quiet = procedure["~orpc"].meta.quiet === true;
  const actionId = randomUUID();
  const started = performance.now();
  const durationMs = () => Math.round(performance.now() - started);

  if (!quiet) {
    log.info("ipc", "ipc.start", { actionId, channel });
  }
  try {
    const result = await next();

    if (!quiet) {
      log.info("ipc", "ipc.end", { actionId, channel, durationMs: durationMs() });
    }

    return result;
  } catch (error) {
    log.error(
      "ipc",
      "ipc.failed",
      { actionId, channel, durationMs: durationMs() },
      loggable(error),
    );
    throw error;
  }
});
