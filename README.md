# Clearmark

<div align="center">
  <img src="public/icons/clearmark-logo.png" alt="Clearmark logo" width="128" height="128">
</div>

<div align="center">
  <strong>A privacy-first Chrome extension for managing your bookmarks and browser extensions in one clean dashboard.</strong>
</div>

<br />

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Soon-blue?logo=google-chrome)](#)
[![Vitest](https://img.shields.io/badge/tested_with-Vitest-6E9?logo=vitest)](https://vitest.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue?logo=typescript)](https://www.typescriptlang.org)

</div>

## What it does

Bookmark cleanup and extension management — without sending your data anywhere.

| Feature | Where |
|---------|-------|
| Organize, search & edit bookmarks | Manager / Options |
| Enable, disable & configure extensions | Manager |
| Undo accidental deletions (session-wide) | Manager |
| Spot and remove duplicate bookmarks | Cleanup panel |
| Check broken / dead links in your bookmarks | Link check |
| Import from & export to HTML bookmarks file | Import / Export |
| Filter by keyword, folder, or tag | Manager |
| Drag-and-drop reordering | Bookmark list |
| Light & dark theme (follows system) | Settings |
| Full Chrome API access (bookmarks, storage, management) | Background worker |

## Screenshots

| Popup | Manager dashboard | Options / settings |
|:-----:|:-----------------:|:------------------:|
| Quick-access toolbar | Full bookmark & extension control center | Theme, import & storage settings |

## Installation

### From source

```bash
git clone https://github.com/Muhammad-waqar-uit/clearmark.git
cd clearmark
pnpm install
pnpm build
```

Load unpacked in Chrome:

1. Open `chrome://extensions`
2. Toggle **Developer mode** (top-right)
3. Click **Load unpacked** → select `dist/`

### From Chrome Web Store

Coming soon.

## Architecture

```
clearmark/
├── public/icons/           # Extension icons & assets
├── src/
│   ├── background/         # Service worker (Chrome API bridge)
│   ├── manager/            # Full-page dashboard (bookmarks + extensions)
│   ├── options/            # Settings & import/export controls
│   ├── popup/              # Toolbar popup (quick actions)
│   └── lib/                # Shared hooks, types, utilities
├── tests/                  # Vitest test suite
├── manifest.json           # MV3 manifest
└── vite.config.ts          # Multi-page build config
```

**Tech stack:** Vite 8 · React 18 · TypeScript · TailwindCSS · Vitest · PLASMIC (build tooling)

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Dev server with hot reload |
| `pnpm build` | Production build → `dist/` |
| `pnpm test` | Run test suite |
| `pnpm lint` | ESLint check |
| `pnpm format` | Prettier formatting |

## Privacy

Clearmark runs entirely on-device. It uses only Chrome's built-in APIs (`bookmarks`, `storage`, `management`, `activeTab`) — no analytics, no telemetry, no network calls outside your own actions.

## Releasing

### Automated releases
Releases are automated via GitHub Actions. When you push a tag `vX.Y.Z`, the workflow:
1. Builds the extension (`pnpm build`)
2. Creates a GitHub Release with the built ZIP artifact
3. Generates release notes from commits since last tag
4. (Optional) Publishes to Chrome Web Store if secrets are configured

### Manual release
```bash
# Bump version in package.json and manifest.json
npm version patch|minor|major  # or edit manually

# Push tag to trigger release
git push && git push --tags
```

## License

MIT
