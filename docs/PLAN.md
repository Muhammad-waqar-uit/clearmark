# Plan

## 9 milestones from scaffold to release

### Milestone 1: Scaffold — done
- [x] Vite + React + TypeScript project, strict mode
- [x] Chrome MV3 `manifest.json`
- [x] Tailwind CSS + PostCSS
- [x] ESLint (React 18 JSX runtime + TypeScript rules)
- [x] Husky pre-commit hook
- [x] Generated icon set (16/32/48/128)

### Milestone 2: Bookmark core — done
- [x] `chrome.bookmarks.getTree()` wrapper and flattening helpers
- [x] Folder tree sidebar with per-folder counts
- [x] Bookmark list with list/compact views
- [x] Search across title, URL, folder, tags and notes
- [x] Domain, tag and date-added filters, plus sorting
- [x] Live updates from bookmark events

### Milestone 3: Bookmark actions — done
- [x] Create, edit and delete bookmarks
- [x] Create, rename and delete folders
- [x] Move bookmarks with a folder picker or drag-and-drop
- [x] Multi-select with checkboxes and select-all
- [x] Bulk move, bulk tag and bulk delete
- [x] 10 second undo, including folder contents

### Milestone 4: Cleanup tools — done
- [x] Duplicate detection on normalized URLs
- [x] Per-group keeper choice and "keep oldest" cleanup
- [x] Dead link checker: HEAD then GET, 5 concurrent, 8 s timeout, stoppable, progress bar
- [x] Empty folder detection and cleanup
- [x] Progress feedback for long operations

### Milestone 5: Tags & notes — done
- [x] Tag input per bookmark, stored in `chrome.storage.local`
- [x] Tag-based search and filter
- [x] Note field per bookmark
- [x] Metadata cleaned up when a bookmark is removed

### Milestone 6: Import & export — done
- [x] JSON export including folder paths, tags and notes
- [x] Netscape HTML export
- [x] JSON import with preview
- [x] HTML import with preview and "Imported YYYY-MM-DD" folder

### Milestone 7: Extension hub — done
- [x] List installed extensions via `chrome.management`
- [x] Search and filter by name and state
- [x] Enable/disable with policy detection
- [x] Remove with Chrome's confirmation dialog
- [x] Bulk disable and bulk remove, queued with progress and stop
- [x] Clearmark never included in bulk actions
- [x] Permission warnings in the details dialog
- [x] Live list updates from management events
- [x] Saved install list with Chrome Web Store links, export and import
- [x] First-use explanation of the `management` permission

### Milestone 8: Popup & settings — done
- [x] Quick search with the top 10 results
- [x] "Add page" with a folder picker
- [x] Options page: theme (light/dark/system), default sort
- [x] Configurable uninstall URL, applied by the service worker
- [x] Self-removal with Chrome's confirmation dialog

### Milestone 9: Polish & release — done
- [x] Vitest unit tests and jsdom UI smoke tests (35 tests)
- [x] ESLint clean, typecheck clean, production build
- [x] Documentation: ARCHITECTURE, FEATURES, LIMITATIONS, PLAN, PROGRESS
- [ ] Manual test on a clean Chrome profile (needs a human)
- [ ] Chrome Web Store submission (listing, screenshots, privacy form)
