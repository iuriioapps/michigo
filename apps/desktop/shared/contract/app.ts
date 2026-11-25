import { RuntimeInfoSchema } from "@michigo/core/schemas";
import { eventIterator } from "@orpc/contract";
import { z } from "zod";

import { base } from "./base";

export const app = {
  /** Runtime details plus the domain modules the main process has loaded. */
  info: base.output(RuntimeInfoSchema),
  /**
   * The code, such as `main.uncaught`, of each error the main process did not
   * catch. A code that came while no page listened arrives first.
   */
  errors: base.output(eventIterator(z.string())),
};
