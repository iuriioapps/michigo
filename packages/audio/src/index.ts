import type { ModuleInfo } from "@michigo/core/schemas";

/**
 * Audio Sources and the pipeline that produces a file.
 *
 * Scaffold only: no domain logic yet. The package exists so the workspace
 * boundary, build, lint and test wiring are proven before any is written.
 * Depends on `@michigo/core` for types; `core` never depends back on it.
 */
export const audioModule: ModuleInfo = {
  name: "@michigo/audio",
  version: "1.0.0",
  status: "scaffold",
};
