import type { ModuleInfo } from "@michigo/core/schemas";

/**
 * Fetch, check and install of the files the Manifest lists.
 *
 * Scaffold only: no domain logic yet. The package exists so the workspace
 * boundary, build, lint and test wiring are proven before any is written.
 * Depends on `@michigo/core` for types; `core` never depends back on it.
 */
export const manifestModule: ModuleInfo = {
  name: "@michigo/manifest",
  version: "1.0.0",
  status: "scaffold",
};
