# Progress

Last updated: 2026-10-30

## Status: all nine milestones implemented

| # | Milestone | Status | What exists now |
|---|-----------|--------|-----------------|
| 1 | Scaffold | ✅ Done | Vite 8 + React 18 + TypeScript (strict), MV3 manifest, Tailwind 3, PostCSS, ESLint, Husky pre-commit, generated icons |
| 2 | Bookmark core | ✅ Done | `chrome.bookmarks` wrappers, folder tree sidebar with counts, flat list, search, domain/tag/date filters, sorting, list/compact views, live reload on bookmark events |
| 3 | Bookmark actions | ✅ Done | Create/edit/delete bookmarks, create/rename/delete folders, move via dialog or drag-and-drop, multi-select, bulk move/tag/delete, 10 second undo for deletes (folders restore with their contents) |
| 4 | Cleanup tools | ✅ Done | Duplicate groups by normalized URL with per-group keeper, dead link check (HEAD→GET, 5 concurrent, 8 s timeout, stoppable, progress), empty folder cleanup |
| 5 | Tags & notes | ✅ Done | Tags and notes per bookmark in `chrome.storage.local`, inline editor, tag filter, tag search, bulk "add tag", metadata removed when a bookmark is deleted by the service worker |
| 6 | Import & export | ✅ Done | JSON export with folder paths/tags/notes, Netscape HTML export, JSON and HTML import with preview and destination picker, imports default to an "Imported YYYY-MM-DD" folder |
| 7 | Extension hub | ✅ Done | Installed extension list with icons, search, enabled/disabled filter, detail dialog with permissions and warnings, enable/disable, remove, queued bulk enable/disable/remove with progress, policy/managed detection, Clearmark excluded from bulk actions, saved install list with store links, list export/import |
| 8 | Popup & settings | ✅ Done | Popup quick search (top 10), "Add page" with folder picker, manager shortcut; options page for theme, default sort, uninstall feedback URL, management explanation reset, self-removal |
| 9 | Polish & release | ✅ Done | 35 Vitest tests (unit + jsdom UI smoke tests), zero lint problems, strict typecheck, production build, documentation, generated icon set |

## Verification run

```bash
pnpm typecheck   # tsc --noEmit, no errors
pnpm lint        # eslint, 0 errors, 0 warnings
pnpm test        # 4 files, 35 tests passed
pnpm build       # dist/ with manifest.json, service-worker.js, three pages, icons
```

The build output was checked with a script that resolves every path referenced by
`dist/manifest.json` (11 paths) and confirms the service worker bundle contains no
`document`/`window` references.

## Still manual (needs a human in Chrome)

- Load `dist/` as an unpacked extension on a clean profile and click through:
  bookmark CRUD, drag-and-drop, link check permission prompt, extension
  enable/disable/remove, popup save, options save, uninstall URL.
- Publish to the Chrome Web Store (listing, screenshots, privacy justification).

## History

- Scaffold, documentation and a first draft of the manager UI were committed first.
  That draft imported modules that did not exist and did not compile.
- This pass replaced the broken draft: working libraries, manager/cleanup/extension/
  transfer panels, popup, options, tests, icons, lint/type/build fixes, docs.
