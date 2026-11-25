---
paths:
  - "**/package.json"
  - "pnpm-workspace.yaml"
  - "apps/desktop/vite.config.ts"
  - ".nvmrc"
  - ".github/dependabot.yml"
---

# Dependencies

## The app puts everything in `devDependencies`

Vite bundles `devDependencies`, and electron-builder copies only `dependencies` into the packaged app. An empty `dependencies` keeps the app small and avoids pnpm symlink problems.

`dependencies` is for what cannot be bundled: native modules, or `electron-updater` when it lands. The native Lindera binding is the first such entry. The Vite build of the Electron main process does not leave `dependencies` external by itself, so list each entry in `rolldownOptions.external` of the main build in `apps/desktop/vite.config.ts`. Without it, the build fails on the native `.node` file.

## Install scripts

A new dependency with an install script goes in `allowBuilds` in `pnpm-workspace.yaml`. Otherwise pnpm fails the install and says so.

## Node version pinning

Electron 44 bundles Node 24, so `.nvmrc` and `@types/node` are both pinned to 24. The shared packages run inside Electron main, and typing them against a newer Node would let code compile that crashes in the packaged app. Bump both when Electron bumps its bundled Node.

- Node 24.22.1 is the floor, because earlier versions have known security vulnerabilities.
- Node 25 is the ceiling, because Electron does not bundle a newer Node yet.
- `engines` in the root `package.json` sets both (`>=24.22.1 <25`), and `engineStrict` in `pnpm-workspace.yaml` fails the install outside that range.
- Dependabot ignores `@types/node` 25 and later for the same reason. Raise the ceiling there and in `engines` together.
- The packaged app runs on the Node that Electron bundles, so `electron` only moves forward, to a release with the same or a newer Node.
