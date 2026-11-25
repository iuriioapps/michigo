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

## Data from the main process

Reach main through `orpc` and `rpc` from `src/lib/rpc.ts`. Both are derived from the contract in `shared/contract/`, so a call is typed and its query key comes with it:

```ts
const projects = useQuery(orpc.projects.list.queryOptions());
const create = useMutation(orpc.projects.create.mutationOptions({ onSuccess }));
void queryClient.invalidateQueries({ queryKey: orpc.projects.key() });
```

Use `orpc` inside components and `rpc` for a call outside TanStack Query. Tests render with `renderRoute` from `src/test/render.tsx`, whose stub answers every procedure in place of main. A new procedure gets a stub entry there.

## UI components

Styling is hand-written, with no shadcn and no `cva`. Behavior (focus, anchoring, keyboard) comes from Base UI, a headless library. See `docs/adr/0008-base-ui-for-behavior-and-tanstack-for-state-and-tables.md`. A variant is a plain lookup object:

```ts
const variants = { default: "…", outline: "…" } as const;
```

`cn()` is a plain join with no `tailwind-merge`, so two rules follow:

- A variant map sets only the utilities that the base string leaves unset.
- `className` from a caller is for layout only (margin, width, grid placement). Padding and color come from the variant.

There is no `asChild`. A component whose look others borrow exports its class string too, as `button.tsx` exports `buttonClasses()`. A router `<Link>` takes that string directly.
