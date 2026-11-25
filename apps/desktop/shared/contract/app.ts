import { RuntimeInfoSchema } from "@michigo/core/schemas";

import { base } from "./base";

export const app = {
  /** Runtime details plus the domain modules the main process has loaded. */
  info: base.output(RuntimeInfoSchema),
};
