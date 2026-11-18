# Base UI for behavior, TanStack for state and tables

The renderer builds on React 19, Tailwind 4, Vite and the TanStack libraries. The high-fidelity canvas has about 56 artboards. It draws nested menus with radio items, anchored value popovers, a popover on a word in the reader, about 14 confirmation dialogs, tabs, switches, toasts, a ⌘K search and word tables with more than 7,000 rows.

**Behavior comes from Base UI, and all styling stays hand-written.** Focus handling, anchoring and keyboard behavior are the expensive part of those widgets. Base UI is headless, so it brings no styling system: variants stay plain lookup objects, with no `cva`, no `tailwind-merge`, no shadcn and no Radix.

## The stack

- Node 24 until an Electron release bundles Node 26. The shared packages run inside Electron main, so their types follow the bundled Node.
- Base UI for Dialog, Alert Dialog, Menu, Popover, Tabs, Switch, Checkbox, Toggle Group, Tooltip, Toast and Autocomplete. The ⌘K palette is an Autocomplete inside a Dialog, written by Michigo. The word detail panel is a fixed side panel, not a drawer.
- Tailwind `@theme` generated from the IO design tokens of the canvas. Inter, Noto Serif JP and JetBrains Mono through `@fontsource`, light and dark through CSS variables.
- TanStack Query for data from the main process. TanStack Store for renderer state that must survive navigation: each word view keeps its filters and sort in memory until the app quits, one state per Project, Source and the Word Bank. Router search params hold only which Project or Source is open.
- One shared word table on TanStack Table and TanStack Virtual. Sorting and filtering are manual and run in SQLite through IPC. A selection is a set of ids or "everything matching this query", never a flag per row.
- `lucide-react` for icons, with no form library and no hotkeys library: one small `useShortcut` hook serves ⌘K, the reader keys and Esc.
- Caret ranges, a committed lockfile and a pnpm catalog. Majors of Electron, Vite and TypeScript are deliberate upgrades.

## Considered options

- shadcn. Rejected: every file would be restyled to the IO tokens, and it brings `cva`, `clsx` and `tailwind-merge`, which the `className` rule of the UI components does not use.
- Vaul. Rejected: its repository says it is unmaintained, it depends on Radix and it is a mobile drawer.
- Sonner. Rejected: Base UI Toast covers the same ground, and Sonner would add a second styling model.
- cmdk. Rejected: its last release is from 2025-03 and it pulls four Radix packages. Base UI Autocomplete has grouping, filtering and async search.
- Route search params for view state. Rejected: a view must keep its state when the learner leaves it, and nothing may reach the disk.
- All behavior hand-written. Rejected: menus, popovers and the palette are where hand-written focus and anchoring code goes wrong.

## Consequences

Base UI is a new dependency in the renderer, and the `Dialog` in `apps/desktop/src/components/ui/` moves onto it. Its Drawer stability and the ARIA roles of its Toast are not verified yet. The palette has no Base UI example, so it is a Michigo composition.

Fonts change from Geist to the canvas fonts, and the theme follows the canvas tokens instead of the current scaffold values.
