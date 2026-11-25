# i18next, with learner-facing text only in the app's catalog

The v1 UI is English only, but a later version must be able to add Spanish without a rewrite. Michigo sets up `i18next` with `react-i18next` in v1, with typed keys and one English catalog that the app bundles. **Packages and the main process emit ids and codes, never sentences for the learner**, and the app's catalog holds all learner-facing text. Japanese text, Dictionary glosses and Anki card templates stay out of the catalog.

## Considered options

- English strings in the code, with no setup. Rejected: adding Spanish later would touch every component.
- Lingui or Paraglide, with the English text in the code and catalogs extracted by a build plugin. Rejected: the plugin is one more piece in the Vite 8, TypeScript 7 and Oxlint chain, which has had tool friction before. `i18next` needs no build step and runs the same in the main process.
- FormatJS with full ICU messages. Rejected: more runtime and more verbose code. English and Spanish need only the `Intl.PluralRules` plurals that `i18next` has.
- One catalog per package (for example, Grammar Pattern text in `packages/grammar`). Rejected: a translation would spread over twelve packages, each with its own loading.

## Consequences

Every catalog is bundled statically, because the renderer loads from `file://` and dynamic `import()` fails there. A package that adds a Grammar Pattern, an inflection name or an error also adds its key to the app's English catalog. The rules for code are in `docs/quality-targets.md`.
