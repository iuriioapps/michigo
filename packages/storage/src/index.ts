import type { ModuleInfo } from "@michigo/core/schemas";

/**
 * Every store, with Snapshot and Backup.
 *
 * Scaffold only: no domain logic yet. The package exists so the workspace
 * boundary, build, lint and test wiring are proven before any is written.
 * Depends on `@michigo/core` for types; `core` never depends back on it.
 */
export const storageModule: ModuleInfo = {
  name: "@michigo/storage",
  version: "1.0.0",
  status: "scaffold",
};
