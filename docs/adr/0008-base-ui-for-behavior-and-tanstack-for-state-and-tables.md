# Base UI for behavior, TanStack for state and tables

The renderer builds on React 19, Tailwind 4, Vite and the TanStack libraries. The high-fidelity canvas has about 56 artboards. It draws nested menus with radio items, anchored value popovers, a popover on a word in the reader, about 14 confirmation dialogs, tabs, switches, toasts, a ⌘K search, rows to reorder by drag and word tables with more than 7,000 rows.

**Behavior comes from Base UI, and all styling stays hand-written.** Focus handling, anchoring and keyboard behavior are the expensive part of those widgets. Base UI is headless, so it brings no styling system: variants stay plain lookup objects, with no `cva`, no `tailwind-merge`, no shadcn and no Radix.

## The stack

- Node 24 until an Electron release bundles Node 26. The shared packages run inside Electron main, so their types follow the bundled Node.
- Base UI for Dialog, Alert Dialog, Menu, Popover, Select, Switch, Checkbox, Radio Group, Toggle Group, Field, Number Field, Collapsible, Progress, Meter, Tooltip and Toast. The word detail panel is a fixed side panel, not a drawer.
- No command palette in v1. ⌘K focuses the sidebar search field, and Enter opens the search results page. A palette with commands can come later on the same field.
- Pragmatic drag and drop, with its auto-scroll and hitbox packages, for Sources, groups, files dropped from the OS and the ordered lists in Settings. Every drag has a menu item that does the same from the keyboard ("Move to", "Move up", "Move down"), as WCAG 2.2 asks in 2.5.7.
- Tailwind `@theme` generated from the IO design tokens of the canvas. Inter, Noto Serif JP and JetBrains Mono through `@fontsource`, light and dark through CSS variables.
- TanStack Query for data from the main process. TanStack Store for renderer state that must survive navigation: each word view keeps its filters and sort in memory until the app quits, one state per Project, Source and the Word Bank. Router search params hold only which Project or Source is open.
- One shared word table on TanStack Table and TanStack Virtual. Sorting and filtering are manual and run in SQLite through IPC. A selection is a set of ids or "everything matching this query", never a flag per row.
- `lucide-react` for icons, with no form library and no hotkeys library: one small `useShortcut` hook serves ⌘K, the reader keys and Esc.
- Caret ranges, a committed lockfile and a pnpm catalog. Majors of Electron, Vite and TypeScript are deliberate upgrades.

## Considered options

- shadcn. Rejected: every file would be restyled to the IO tokens, and it brings `cva`, `clsx` and `tailwind-merge`, which the `className` rule of the UI components does not use.
- Vaul. Rejected: its repository says it is unmaintained, it depends on Radix and it is a mobile drawer.
- Sonner. Rejected: Base UI Toast covers the same ground, and Sonner would add a second styling model.
- A ⌘K palette as an Autocomplete inside a Dialog. Rejected for v1: search is a results page with a Words and a Sentences section, and the sidebar field already reaches it.
- cmdk. Rejected: its last release is from 2025-03 and it pulls four Radix packages.
- A native `<select>`. Rejected: on macOS it opens an OS menu that a screenshot test cannot capture, and on Windows and Linux its list ignores the IO tokens.
- dnd-kit. Rejected: `@dnd-kit/react` is before 1.0, and it is built for dragging inside the page, so files from the OS would need a second mechanism.
- Route search params for view state. Rejected: a view must keep its state when the learner leaves it, and nothing may reach the disk.
- All behavior hand-written. Rejected: menus, popovers and the palette are where hand-written focus and anchoring code goes wrong.

## Consequences

Base UI is a new dependency in the renderer, and the `Dialog` in `apps/desktop/src/components/ui/` moves onto it. The ARIA roles of its Toast are not verified yet. Pragmatic drag and drop is a second new dependency, and a dropped file reaches the main process as a path from `webUtils.getPathForFile` in the preload. The component inventory and build order are in [#133](https://github.com/iuriioapps/michigo/issues/133).

Fonts change from Geist to the canvas fonts, and the theme follows the canvas tokens instead of the current scaffold values.
