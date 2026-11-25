import { oc } from "@orpc/contract";

export interface RpcMeta {
  /** Skips the start and end lines, for `log.write`, whose own line would come with two more. */
  readonly quiet?: boolean;
}

/** Every procedure starts here, so the middleware in main can read its meta. */
export const base = oc.$meta<RpcMeta>({});
