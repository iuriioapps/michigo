import type { ModuleInfo } from "@michigo/core/schemas";

/**
 * Pitch accent lookup and its card markup.
 *
 * Scaffold only: no domain logic yet. The package exists so the workspace
 * boundary, build, lint and test wiring are proven before any is written.
 * Depends on `@michigo/core` for types; `core` never depends back on it.
 */
export const pitchModule: ModuleInfo = {
  name: "@michigo/pitch",
  version: "1.0.0",
  status: "scaffold",
};
