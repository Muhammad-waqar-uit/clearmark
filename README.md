# Clearmark

<div align="center">
  <img src="public/icons/clearmark-logo.png" alt="Clearmark logo" width="128" height="128">
</div>

A lightweight, privacy-first Chrome extension for managing your bookmarks and browser extensions in one clean dashboard.

## Features

- **Unified bookmark manager** — organize, search, and edit bookmarks from the popup or the full-page manager.
- **Extension management** — view, enable, disable, and configure installed extensions at a glance.
- **Undo support** — accidental deletions are recoverable within the active session.
- **Light & dark themes** — auto-detects your system preference; toggle anytime in settings.
- **Persistent storage** — all changes sync to Chrome's local storage across sessions.
- **Privacy-first** — no analytics, no telemetry, no external requests. Your data stays on your machine.

## Screenshots

| Popup | Manager |
|:-----:|:-------:|
| Quick access to bookmarks and extensions | Full-featured management dashboard |

## Installation

### From source

```bash
git clone https://github.com/Muhammad-waqar-uit/clearmark.git
cd clearmark
pnpm install
pnpm build
```

Load the `dist/` folder in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** and select the `dist/` directory

### From Chrome Web Store

Coming soon.

## Project structure

```
clearmark/
├── public/icons/           # Extension icons & assets
├── src/
│   ├── background/         # Service worker (background logic)
│   ├── manager/            # Full-page bookmark & extension manager
│   ├── options/            # Settings page
│   ├── popup/              # Popup UI
│   └── styles/             # Shared Tailwind + custom CSS
├── tests/                  # Vitest test suite
├── manifest.json           # Extension manifest
└── vite.config.ts          # Build configuration
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Vite dev server with hot reload |
| `pnpm build` | Production build to `dist/` |
| `pnpm test` | Run Vitest suite |
| `pnpm lint` | ESLint check |
| `pnpm format` | Prettier formatting |

## License

MIT
