import type { ModuleInfo } from "@michigo/core/schemas";

/**
 * Source formats and their cleanup into Lines.
 *
 * Scaffold only: no domain logic yet. The package exists so the workspace
 * boundary, build, lint and test wiring are proven before any is written.
 * Depends on `@michigo/core` for types; `core` never depends back on it.
 */
export const sourceModule: ModuleInfo = {
  name: "@michigo/source",
  version: "1.0.0",
  status: "scaffold",
};
