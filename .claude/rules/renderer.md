---
paths:
  - "apps/desktop/src/**"
---

# Renderer

## Routing

TanStack Router, file-based, with three constraints the code cannot explain:

- Hash history, not browser history. Production loads the renderer from a `file://` URL, where pushState paths do not resolve. Set in `src/router.tsx`.
- `src/routeTree.gen.ts` is generated but committed. The plugin runs only under `vite dev` and `vite build`, and CI runs `turbo run typecheck` on its own. It is excluded from lint and format instead of from git.
- **`autoCodeSplitting` stays off.** Splitting emits dynamic `import()` calls, and Chromium treats `file://` as an opaque origin, so they fail once packaged.

A `-` prefix keeps a path out of the route tree: `src/routes/-components/` holds the components that exactly one route uses. `routeFileIgnorePattern` excludes test files, or `settings.test.tsx` would become `/settings/test`.

## UI components

Styling is hand-written, with no shadcn and no `cva`. Behavior (focus, anchoring, keyboard) comes from Base UI, a headless library. See `docs/adr/0008-base-ui-for-behavior-and-tanstack-for-state-and-tables.md`. A variant is a plain lookup object:

```ts
const variants = { default: "…", outline: "…" } as const;
```

`cn()` is a plain join with no `tailwind-merge`, so two rules follow:

- A variant map sets only the utilities that the base string leaves unset.
- `className` from a caller is for layout only (margin, width, grid placement). Padding and color come from the variant.

There is no `asChild`. A component whose look others borrow exports its class string too, as `button.tsx` exports `buttonClasses()`. A router `<Link>` takes that string directly.
