# Features

## Bookmark Management (FR-1 to FR-11)

- Browse full bookmark tree with live updates
- Search and filter across title, URL, folders, and domains
- Create, rename, move, and delete bookmarks and folders
- Drag and drop reorganization
- Multi-select with checkboxes and bulk actions
- 10-second undo for deletes

## Cleanup Tools (FR-12 to FR-14)

- Duplicate detection by normalized URL (strip tracking params)
- Dead link checker (concurrent, 8s per URL, progress bar)
- Empty folder detection and cleanup

## Tags & Notes (FR-15 to FR-17)

- Add tags and short notes to bookmarks
- Store in chrome.storage.local keyed by bookmark ID
- Filter and search by tag
- Clean up notes when bookmark is removed

## Import/Export (FR-18 to FR-19)

- Export to JSON (including tags and notes)
- Export to standard Netscape HTML format
- Import from JSON and HTML with preview
- Imported items go into "Imported <date>" folder

## Extension Hub (FR-28 to FR-38)

- List all installed extensions with full details
- Search and filter extensions by name and state
- Enable/disable extensions (with policy management detection)
- Remove extensions (handle policy-managed ones)
- Bulk disable and bulk remove (queued, user-stopable)
- Never include Clearmark itself in bulk actions
- Show permission warnings in details drawer
- Live list updates from management events
- "Install list" with Chrome Web Store URLs
- Export/import installed extension list
- First-use explanation of management permission

## Popup (FR-20 to FR-22)

- Quick search box with top 10 results
- "Add current page" with folder picker
- "Open full manager" button

## Settings & Uninstall (FR-23 to FR-27)

- Options page with theme (light/dark/system) and default sort
- "Remove extension" with Chrome confirmation dialog
- Configurable uninstall URL for feedback page
- Bookmarks never deleted by uninstall