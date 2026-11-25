import { RendererLogLineSchema } from "@michigo/log/renderer";
import { z } from "zod";

import { base } from "./base";

export const log = {
  /** Appends one line to the shared log. Rejects if `line` fails validation. */
  write: base.meta({ quiet: true }).input(RendererLogLineSchema).output(z.void()),
};
