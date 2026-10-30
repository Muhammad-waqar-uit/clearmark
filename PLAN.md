# Clearmark: Plan

## Milestone 1: Scaffold
- [x] Vite + React + TypeScript project, manifest, builds to dist/, loads with "Load unpacked"
- [x] Popup and manager open
- [x] Manifest V3 with all required permissions
- [x] Icon assets (16, 32, 48, 128)

## Milestone 2: Core Manager
- [x] Folder tree visualization
- [x] Bookmark list with live updates
- [x] Live update when bookmarks change (onCreated, onRemoved, onChanged, onMoved)
- [x] Search across title and URL (debounced)
- [x] Sort by title, date added, or URL
- [x] Toggle list and compact view

## Milestone 3: Editing (CRUD)
- [x] Create bookmarks (including "Add current page")
- [x] Rename bookmarks and folders
- [x] Move bookmarks between folders
- [x] Delete bookmarks with confirmation + 10s undo
- [x] Drag and drop to move items between folders
- [x] Multi-select with checkboxes
- [x] Bulk move and bulk delete

## Milestone 4: Settings & Uninstall
- [x] Options page with theme (light, dark, system) and default sort
- [x] "Remove extension" button with confirmation dialog
- [x] Uninstall URL configuration (configurable feedback page)
- [x] State clearly that bookmarks are never deleted by uninstall

## Milestone 5: Extension Hub
- [x] List all installed extensions with management API
- [x] Search and filter extensions by name and state
- [x] Enable/disable extensions with policy management detection
- [x] Remove extensions (handle policy-managed ones)
- [x] Bulk disable and bulk remove (queue one at a time)
- [x] Never include Clearmark itself in bulk actions
- [x] Show permission warnings for each extension
- [x] Live list updates from management events
- [x] "Install list" with store links (FR-36)
- [x] Before first use, explain management permission purpose

## Milestone 6: Cleanup Tools
- [x] Duplicate detection by normalized URL
- [x] Dead link checker (concurrent, 8s timeout, 5 at a time, progress bar)
- [x] Find empty folders and offer to delete

## Milestone 7: Import/Export
- [x] Export all bookmarks to JSON (including tags and notes)
- [x] Export to standard Netscape HTML bookmark format
- [x] Import from JSON and from Netscape HTML
- [x] Show preview with counts before applying
- [x] Imported items go into new folder named "Imported <date>"

## Milestone 8: Tags and Notes
- [x] Add tags and a short note to a bookmark (stored in chrome.storage.local)
- [x] Filter and search by tag
- [x] Clean up stored tags and notes when a bookmark is removed

## Milestone 9: Polish & Release
- [x] Icons (all required sizes)
- [x] Store screenshots
- [x] Privacy policy (no data collected)
- [x] Tests (Vitest unit tests)
- [x] Acceptance criteria verification
- [x] Chrome Web Store: $5 developer registration
- [x] Prepare 128px icon, at least one 1280x800 screenshot
- [x] Privacy policy stating no data is collected