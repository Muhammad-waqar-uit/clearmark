# Plan

## 9 Milestones from Scaffold to Release

### Milestone 1: Scaffold
- Initialize Vite + React + TypeScript project
- Set up Chrome MV3 manifest.json
- Configure Tailwind CSS, PostCSS, ESLint
- Add Husky pre-commit hooks
- Create project structure and base files

### Milestone 2: Bookmark Core
- Implement chrome.bookmarks.getTree() wrapper
- Build bookmark display component
- Add search and filter functionality
- Create folder tree UI

### Milestone 3: Bookmark Actions
- Add create/rename/delete bookmark flows
- Implement move bookmark between folders
- Add drag-and-drop reorganization
- Build multi-select with checkboxes

### Milestone 4: Cleanup Tools
- Implement duplicate URL detection
- Build dead link checker (concurrent, 8s timeout)
- Add empty folder detection and cleanup
- Create progress bar for bulk operations

### Milestone 5: Tags & Notes
- Add tag input and storage in chrome.storage.local
- Implement tag-based search/filter
- Add note-taking per bookmark
- Clean up notes on bookmark removal

### Milestone 6: Import/Export
- Build JSON export (with tags and notes)
- Build Netscape HTML export
- Implement JSON import with preview
- Implement HTML import with "Imported <date>" folder

### Milestone 7: Extension Hub
- List installed extensions via chrome.management
- Search and filter extensions by name/state
- Enable/disable extension flows
- Remove extension with policy detection
- Bulk disable and bulk remove (queued)
- Never include Clearmark in bulk actions

### Milestone 8: Popup & Settings
- Quick search popup with top 10 results
- "Add current page" with folder picker
- Options page: theme (light/dark/system), default sort
- Configurable uninstall URL

### Milestone 9: Polish & Release
- Write unit tests (4 Vitest tests minimum)
- Run ESLint, fix all errors
- Create documentation (ARCHITECTURE.md, FEATURES.md, LIMITATIONS.md, PLAN.md, PROGRESS.md)
- Test on clean Chrome install
- Prepare GitHub repository