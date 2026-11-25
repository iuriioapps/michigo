import { CreateProjectInputSchema, ProjectSchema } from "@michigo/core/schemas";
import { z } from "zod";

import { base } from "./base";

export const projects = {
  /** Every project the main process is holding, oldest first. */
  list: base.output(z.array(ProjectSchema)),
  /** Appends a project and returns it, with the id and timestamp main assigned. */
  create: base.input(CreateProjectInputSchema).output(ProjectSchema),
};
