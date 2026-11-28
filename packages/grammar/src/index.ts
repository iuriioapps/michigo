import type { ModuleInfo } from "@michigo/core/schemas";

/**
 * Grammar Patterns and the labels of inflected forms.
 *
 * Scaffold only: no domain logic yet. The package exists so the workspace
 * boundary, build, lint and test wiring are proven before any is written.
 * Depends on `@michigo/core` for types; `core` never depends back on it.
 */
export const grammarModule: ModuleInfo = {
  name: "@michigo/grammar",
  version: "1.0.0",
  status: "scaffold",
};
