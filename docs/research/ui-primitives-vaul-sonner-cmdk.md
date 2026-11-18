# Vaul, Sonner and cmdk for the Michigo UI stack

Research for issue 105 (child of map issue 32). Question: should the Electron app use Vaul, Sonner and cmdk, given that Base UI (`@base-ui/react`) is the planned headless layer? Facts were gathered on 2026-11-17 from the npm registry, the GitHub API, package tarballs (`npm pack`) and the official docs.

## Summary

| | Vaul | Sonner | cmdk |
| --- | --- | --- | --- |
| Latest version | 1.1.2 (2024-12-14) | 2.0.8 (2026-08-09) | 1.1.1 (2025-03-14) |
| Last commit | 2025-10-03 | 2026-08-10 | 2025-10-29 |
| Maintained | No, README says unmaintained | Yes, active | Low activity |
| Runtime dependencies | `@radix-ui/react-dialog` | none | four `@radix-ui/*` packages |
| Dist JS, gzipped (unminified file) | about 17.1 KB | about 14.6 KB plus 3.3 KB CSS | about 5.4 KB |
| Recommendation | Skip | Replace with Base UI Toast | Replace with Base UI Autocomplete |

## Vaul

### What it does

A drawer component built on Radix Dialog, with drag gestures, snap points and a mobile bottom-sheet feel. Source: https://github.com/emilkowalski/vaul

### Version and maintenance

- Latest is 1.1.2, published 2024-12-14 (`npm view vaul`, https://www.npmjs.com/package/vaul).
- The last commit on `main` is 2025-10-03, and the repo shows 162 open issues (GitHub API, https://api.github.com/repos/emilkowalski/vaul).
- The README opens with "This repo is unmaintained." and says the author might come back "not in the near future" (https://github.com/emilkowalski/vaul).
- The repo is not archived. The owner is emilkowalski.

### React 19 and dependencies

- Peer dependencies include `^19.0.0` and `^19.0.0-rc` for `react` and `react-dom` (npm `peerDependencies`).
- The one runtime dependency is `@radix-ui/react-dialog ^1.1.1`. Adopting Vaul would pull Radix into a stack that deliberately avoids it.

### Accessibility

Accessibility comes from Radix Dialog (focus trap, focus return, Escape). The built dist contains `aria-hidden` handling and no other ARIA of its own (inspection of `dist/index.mjs` in the npm tarball). I did not run screen reader tests.

### Size

`dist/index.mjs` is 79,120 bytes raw and about 17.1 KB gzipped (measured with `gzip -9` on the tarball). This file is not minified and excludes Radix, so it is not a true bundle figure. I could not reach bundlephobia for a minified number.

### Fit for Michigo

Vaul's value is touch drag, snap points and background scaling, which are mobile idioms. The word detail panel is a fixed side panel, not a bottom sheet. A positioned Dialog or the Base UI Drawer covers it, and Base UI's docs say to use Dialog when gestures and snap points are not needed (https://base-ui.com/react/components/drawer.md).

## Sonner

### What it does

An opinionated toast library: a `<Toaster />` mounted once and an imperative `toast()` call from anywhere, with stacking, promise toasts and swipe to dismiss. Source: https://github.com/emilkowalski/sonner

### Version and maintenance

- Latest is 2.0.8, published 2026-08-09 (`npm view sonner`; https://github.com/emilkowalski/sonner/releases).
- The last commit is 2026-08-10, 86 open issues, not archived, owner emilkowalski (https://api.github.com/repos/emilkowalski/sonner).
- The previous release, 2.0.7, was 2025-08-02, so the cadence is roughly yearly.

### React 19 and dependencies

Peer dependencies are `react` and `react-dom` `^18 || ^19 || ^19.0.0-rc` and `@types/react` (npm). There are no runtime dependencies. Sonner does not use Radix.

### Accessibility

From the package source (`dist/index.mjs`): the container uses `aria-live="polite"`, `aria-atomic`, `aria-relevant` and an `aria-label`, and a keyboard hotkey (default Alt+T) focuses the toast region. I found no urgent (assertive) announcement path in the source. Compare Base UI below, which has a `priority` option.

### Size

`dist/index.mjs` is 69,795 bytes raw, about 14.6 KB gzipped, plus `styles.css` of about 3.3 KB gzipped (measured on the tarball, unminified). The CSS is injected by default and is written against Sonner's own class and data attribute names, which sits badly with the project rule that styling is hand-written in Tailwind.

### Fit for Michigo

The need (download and Anki sync toasts) is real, and Sonner is the healthiest of the three. Base UI ships the same capability (see below), so Sonner would be a second toast system with its own styling model.

## cmdk

### What it does

An unstyled command menu: a `Command` root with input, list, items, groups, an empty state, a loading state, and a `Command.Dialog` wrapper. Filtering and ranking use its own scoring (`command-score`). Source: https://github.com/dip/cmdk (the old `pacocoursey/cmdk` URL leads there).

### Version and maintenance

- Latest is 1.1.1, published 2025-03-14 (`npm view cmdk`; https://github.com/pacocoursey/cmdk/releases).
- The last commit is 2025-10-29, 86 open issues, not archived (https://api.github.com/repos/pacocoursey/cmdk).
- The owner shown on the README page is `dip`. The README credits Paco as the original author (2019) and says it was rewritten in 2022. I found no maintenance statement, but there has been no release in over eight months.
- The README's FAQ states that concurrent mode support is uncertain and that it "Uses risky approaches like manual DOM ordering." (https://github.com/dip/cmdk)

### React 19 and dependencies

Peers are `^18 || ^19 || ^19.0.0-rc`. Runtime dependencies are `@radix-ui/react-id`, `@radix-ui/react-dialog`, `@radix-ui/react-primitive` and `@radix-ui/react-compose-refs` (npm). Four Radix packages enter the tree.

### Accessibility

From `dist/index.mjs`: `role="combobox"` on the input with `aria-activedescendant`, `aria-controls`, `aria-expanded` and `aria-autocomplete`, `role="listbox"` on the list, `role="option"` with `aria-selected` on items, `role="group"` with `aria-labelledby`, and `role="separator"`. Focus stays in the input and arrows move the active descendant. The README claims testing with VoiceOver but lists no roles (https://github.com/dip/cmdk). `Command.Dialog` relies on Radix Dialog for focus trap and return.

### Size

`dist/index.mjs` plus two small chunks is about 13 KB raw and 5.4 KB gzipped, without Radix (tarball measurement, unminified).

### Fit for Michigo

The need is one sidebar search field with a ⌘K hint. cmdk would add Radix Dialog just for the overlay. See the alternatives section.

## What Base UI ships

Base UI is at 1.9.0 (2026-10-09), peers `react ^17 || ^18 || ^19`, and its repo is active (last push 2026-11-18, 475 open issues; npm and https://api.github.com/repos/mui/base-ui). Its component list is at https://base-ui.com/llms.txt.

### Dialog and Alert Dialog

Dialog traps focus, makes the background inert, returns focus on close, and offers `initialFocus` and `finalFocus`. Nested dialogs are supported, and the docs recommend opening a child alert dialog for confirmations (https://base-ui.com/react/components/dialog.md). A separate Alert Dialog component exists (https://base-ui.com/react/components/alert-dialog.md). That covers the 14 confirmation dialogs with no extra library. I did not read the Alert Dialog page, so its role and Escape behavior are unverified.

### Toast

`Toast.createToastManager()` gives a manager usable outside React, and `useToastManager()` gives `add`, `close`, `update`, `promise` (with loading, success and error states), `actionProps` for undo buttons, `limit` (default 3), and `timeout` (default 5000 ms). Stacking, swipe and `priority` (`low` polite, `high` urgent) are supported, and F6 moves focus into the toast region (https://base-ui.com/react/components/toast.md). The fetch was truncated (the last 64K characters of the page are unread), so ARIA role details are unverified.

### Autocomplete and Combobox

Autocomplete has `items`, groups (`Autocomplete.Group`, `GroupLabel`), a built-in filter with `useFilter()`, a custom `filter` (match-sorter is named as an example), `filter={null}` for server-side search, `limit`, `autoHighlight`, and `Autocomplete.Status` (https://base-ui.com/react/components/autocomplete.md). Combobox adds multi-select chips but restricts the value to listed items, and the docs point to Autocomplete for search widgets (https://base-ui.com/react/components/combobox.md). I found no command palette example on either page in the part I read (about the first 100K characters of each), so an Autocomplete inside a Dialog would be our own composition. Not verified: whether a documented example exists later in the pages.

### Drawer

Drawer extends Dialog with swipe gestures, `snapPoints`, and `swipeDirection` of `down`, `up`, `left` or `right`. The docs show a right-side panel, modal by default, and `modal={false}` turns off the focus trap. The part of the page I read does not say whether it is stable (https://base-ui.com/react/components/drawer.md).

### Popover and Menu

Both exist in the component list (https://base-ui.com/llms.txt). I did not read their pages, as no decision here hinges on them.

## Alternatives for a ⌘K search field

### Base UI Autocomplete in a Dialog

Closest fit to the stack: the same primitives, grouping and filtering shipped, no Radix. The cost is composing the open shortcut and a Dialog around an Autocomplete, which is a small amount of own code.

### React Aria Autocomplete

Adobe documents a command palette example with Autocomplete, SearchField and Menu inside a Modal, opened with Ctrl/Cmd+J, and supports virtual focus (https://react-aria.adobe.com/Autocomplete). It would add a second headless library, so it is only worth it if Base UI's Autocomplete falls short.

### kbar

Not researched beyond the registry. It is a full command palette framework with its own action registry. Its health and fit were not verified, so I do not recommend it without more work.

### Own code

An input, a filtered list and the ARIA combobox pattern are doable but are exactly what Base UI already implements and tests. Not recommended.

## Not verified

- True minified sizes from bundlephobia. All sizes above are unminified tarball files, gzipped.
- Screen reader behavior of any library, and the ARIA roles of Base UI Toast and Alert Dialog (page text truncated or not read).
- Whether Base UI Drawer is considered stable.
- kbar maintenance and fit.
- The issue counts come from the GitHub field `open_issues_count`, which includes pull requests.

## Recommendations

- Vaul: skip. It is self-declared unmaintained, pulls Radix, and solves a mobile gesture problem the side panel does not have. Use Base UI Dialog, or Base UI Drawer with `swipeDirection="right"` if the panel ever needs swipe.
- Sonner: replace with Base UI Toast. Sonner is the only healthy one of the three, but Base UI covers a manager, promise toasts, actions, stacking and swipe, and it avoids a second styling model.
- cmdk: replace with Base UI Autocomplete (grouping, filtering and keyboard handling are shipped) inside a Base UI Dialog for the ⌘K overlay. It avoids four Radix packages, and cmdk's last release is eight months old. Revisit React Aria Autocomplete only if Base UI's Autocomplete cannot do the palette.
