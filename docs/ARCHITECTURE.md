# Architecture

## Project structure

```
clearmark/
├── manifest.json              # MV3 manifest (permissions, pages, icons, worker)
├── package.json               # Scripts: dev, build, typecheck, lint, test, icons, check
├── pnpm-workspace.yaml        # pnpm build-script allow list (esbuild, parcel watcher)
├── vite.config.ts             # Multi-page build + manifest copy
├── vitest.config.ts           # jsdom test environment
├── tailwind.config.js         # Tailwind + brand palette, class-based dark mode
├── postcss.config.js
├── .eslintrc.cjs
├── scripts/generate-icons.mjs # Dependency-free PNG icon generator
├── public/icons/              # Icons copied into dist/ by Vite
├── src/
│   ├── background/service-worker.ts
│   ├── lib/                   # No React; safe to unit test
│   │   ├── types.ts           # Shared types (bookmarks, folders, settings, results)
│   │   ├── bookmarks.ts       # Tree reads, flattening, scope, capture/restore, CRUD
│   │   ├── storage.ts         # chrome.storage.local access + defaults
│   │   ├── duplicates.ts      # normalizeUrl, grouping, keeper helpers
│   │   ├── emptyFolders.ts    # Empty folder detection
│   │   ├── linkcheck.ts       # HTTP status classification, concurrent checks
│   │   ├── exportImport.ts    # Pure JSON/HTML serialization and parsing
│   │   ├── importer.ts        # Import tree into bookmarks, file download helper
│   │   ├── extensions.ts      # chrome.management wrapper, bulk queue, list helpers
│   │   ├── theme.ts           # light/dark/system application
│   │   ├── useBookmarks.ts    # Live tree hook
│   │   └── useSettings.ts     # Settings hook, keeps theme in sync
│   ├── manager/               # Full-page manager
│   │   ├── main.tsx           # Mount + styles
│   │   ├── manager.tsx        # Tabs, dialogs, selection, undo, sidebar
│   │   ├── filters.ts         # Pure filter/sort/collect helpers
│   │   ├── drag.ts            # Shared drag MIME type
│   │   ├── useUndo.ts         # 10 second undo slot
│   │   └── components/        # FolderTree, BookmarkList, BookmarkForm, FolderPicker,
│   │                          # SearchBar, CleanupPanels, ExtensionHub, TransferPanel,
│   │                          # Feedback (bulk bar, progress, toast), ui (modal, avatar)
│   ├── popup/                 # Quick search + add current page
│   ├── options/               # Settings page
│   └── styles/global.css      # Tailwind layers + component classes
├── tests/                     # Vitest: unit, serialization, jsdom UI smoke tests
└── docs/
```

## Data flow

- **Bookmarks** live in Chrome. `useBookmarks` reads the tree, flattens it into
  `FlatBookmark[]` / `FlatFolder[]`, and resubscribes to `chrome.bookmarks` events so
  every view is live. There is no bookmark copy in extension storage.
- **Metadata** (tags, notes), the extension install list and settings live in
  `chrome.storage.local` under `meta`, `wantedExtensions` and `settings`.
  Keys are bookmark ids, so metadata is removed when a bookmark disappears.
- **Service worker** reacts to bookmark removal (drop metadata), forwards change
  notifications to open pages, and keeps `chrome.runtime.setUninstallURL` in sync
  with settings.

## Module boundaries

- `src/lib/*` never imports React and never touches the DOM except `theme.ts` and the
  download helper in `importer.ts`. Parsing, filtering and duplicate logic are pure and
  unit tested.
- Chrome APIs are wrapped per area (`bookmarks.ts`, `storage.ts`, `extensions.ts`,
  `linkcheck.ts`), so UI code never calls `chrome.*` for those areas directly.
- `manager/components/*` are presentational and receive data plus callbacks. All
  mutations happen in `manager.tsx` so undo and selection state stay in one place.
- Import/export is split: `exportImport.ts` produces and consumes text,
  `importer.ts` writes to Chrome. This is what makes the formats testable in jsdom.

## Permissions

| Permission | Why |
|------------|-----|
| `bookmarks` | Read and modify the bookmark tree |
| `storage` | Tags, notes, settings, install list |
| `tabs` | Read the active tab in the popup; open bookmark/store tabs |
| `management` | List, enable/disable and remove extensions |
| `optional_host_permissions: <all_urls>` | Requested only when the user starts a dead link check |

## Build

`pnpm build` writes `dist/`:

- `manifest.json` (copied after bundling)
- `service-worker.js` (ES module)
- `src/manager/index.html`, `src/popup/index.html`, `src/options/index.html`
- `assets/*` including one shared stylesheet
- `icons/*` (from `public/`)

`base: './'` makes the generated asset URLs relative, so pages work from
`chrome-extension://` paths without absolute asset roots.
