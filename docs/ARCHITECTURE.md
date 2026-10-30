# Architecture

## Project Structure

```
clearmark/
├── manifest.json                  # Chrome MV3 manifest
├── package.json                   # Dependencies + scripts
├── vite.config.ts                 # Vite + React config
├── tsconfig.json                  # TypeScript strict mode
├── tailwind.config.js             # Tailwind CSS config
├── postcss.config.css             # PostCSS with Tailwind
├── .eslintrc.cjs                # ESLint config
├── .prettierrc.json             # Prettier formatting
├── .husky/                      # Git hooks (pre-commit: lint)
├── .gitignore                   # Git ignore rules
├── public/icons/                # All icon sizes (16, 32, 48, 128, 512 + logos)
├── src/                         # All source TypeScript/React files
│   ├── background/              # Service worker + bookmark events
│   ├── lib/                     # Core libraries (bookmarks, storage, etc.)
│   ├── manager/                 # Main bookmark manager UI
│   ├── popup/                   # Quick access popup
│   └── options/                 # Options page
├── tests/                       # Vitest unit tests
└── docs/                        # Documentation
    ├── ARCHITECTURE.md
    ├── FEATURES.md
    ├── LIMITATIONS.md
    ├── PLAN.md
    └── PROGRESS.md
```

## Tech Stack

- **Manifest V3** Chrome Extension
- **TypeScript** strict mode
- **React 18** with Vite
- **Tailwind CSS 3** for styling
- **Vitest** for unit testing (jsdom environment)
- **ESLint** for code quality
- **Husky** for pre-commit lint hooks

## Module Boundaries

- **Background script**: Service worker, bookmark/management events, chrome API access
- **Lib utilities**: URL normalization, duplicate detection, storage, link checking, export/import
- **Manager UI**: Folder tree, bookmark list, bulk actions, search/filter
- **Popup**: Quick search, add current page, open manager trigger
- **Options**: Theme settings (light/dark/system), default sort, uninstall URL

## API Contracts

- All chrome.* APIs accessed through typed wrappers in `src/lib/`
- Service worker communicates with popup via `chrome.runtime.sendMessage`
- Bookmark data stored in `chrome.storage.local` keyed by bookmark ID
- Extension management via `chrome.management` API