# Clearmark: Features

## Must Have (FR-1 to FR-11)

### FR-1 to FR-7: Bookmark Browsing
- **FR-1**: Load full bookmark tree with `chrome.bookmarks.getTree()` and show as folder tree on left + list on right
- **FR-2**: Show title, URL, favicon, folder path, and date added for each bookmark
- **FR-3**: Sort by title, date added, or URL. Toggle list and compact view
- **FR-4**: Live update when bookmarks change (listen to onCreated, onRemoved, onChanged, onMoved)
- **FR-5**: Instant search across title and URL as user types (debounced, under 100ms for 10,000 bookmarks)
- **FR-6**: Filter by folder, by domain, and by date range
- **FR-7**: Keyboard shortcut to focus search (/ on the manager page)

### FR-8 to FR-11: Editing & Organizing
- **FR-8**: Create, rename, edit URL, move, and delete bookmarks and folders
- **FR-9**: Drag and drop to move items between folders
- **FR-10**: Multi-select with checkboxes. Bulk move and bulk delete
- **FR-11**: Confirm before any delete. Offer 10 second "Undo" for last delete by recreating removed items

## Should Have (FR-12 to FR-14)

### FR-12: Duplicate Detection
- Duplicate detection by normalized URL (lowercase host, strip trailing slash, strip common tracking params like utm_*)
- Let user pick which copy to keep

### FR-13: Dead Link Checker
- Runs on user request only, with limited concurrency (5 at a time)
- Timeout of 8 seconds per URL
- Progress bar
- Results marked OK, redirected, or broken
- Needs optional host permission requested at runtime

### FR-14: Empty Folders
- Find empty folders and offer to delete them

## Nice to Have (FR-15 to FR-17)

### FR-15 to FR-17: Tags and Notes
- Add tags and a short note to a bookmark (stored in chrome.storage.local, keyed by bookmark id)
- Filter and search by tag
- Clean up stored tags and notes when a bookmark is removed

## Should Have (FR-18 to FR-19)

### FR-18 to FR-19: Import/Export
- **FR-18**: Export all bookmarks to JSON (including tags and notes) and to standard Netscape HTML bookmark format
- **FR-19**: Import from JSON and from Netscape HTML. Show preview with counts before applying. Imported items go into new folder named "Imported <date>"

## Must Have (FR-20 to FR-22)

### FR-20 to FR-22: Popup
- **FR-20**: Quick search box with top 10 results
- **FR-21**: "Add current page" button with folder picker
- **FR-22**: "Open full manager" button that opens manager page in new tab

## Must Have (FR-23 to FR-27)

### FR-23 to FR-27: Settings & Uninstall
- **FR-23**: Options page with theme (light, dark, system) and default sort
- **FR-24**: "Remove extension" button on options page that calls `chrome.management.uninstallSelf({ showConfirmDialog: true })`
- **FR-25**: Before calling uninstall, warn user that tags and notes stored by extension will be deleted, and offer to export first
- **FR-26**: Call `chrome.runtime.setUninstallURL(url)` in service worker so short feedback page opens after removal
- **FR-27**: Browser bookmarks themselves are never deleted by uninstalling the extension. State this clearly in UI

## Must Have (FR-28 to FR-38)

### FR-28 to FR-38: Extension Hub
- **FR-28**: List all installed extensions with `chrome.management.getAll()`. Show icon, name, version, description, enabled state, and install type (normal, development, admin, sideload). Hide themes and apps by default, with toggle to show them
- **FR-29**: Search and filter extensions by name and by state (enabled, disabled)
- **FR-30**: Enable or disable any extension with `chrome.management.setEnabled(id, bool)`. Disable switch and show "Managed by your organization" label when mayDisable is false
- **FR-31**: Remove an extension with `chrome.management.uninstall(id, { showConfirmDialog: true })`. Handle cancel without errors. Extensions managed by policy cannot be removed, hide remove button for them
- **FR-32**: Bulk disable and bulk remove. Queue one at a time, show progress, user can stop queue at any point
- **FR-33**: Never include Clearmark itself in bulk actions. Its own removal lives only on options page (FR-24)
- **FR-34**: Show permission warnings for each extension (`getPermissionWarningsById`) in details drawer
- **FR-35**: Keep list live by listening to chrome.management.onInstalled, onUninstalled, onEnabled, onDisabled
- **FR-36**: "Install list" for extensions user wants. Add by pasting Chrome Web Store URL or extension ID, or searching by name. Each entry has "Open in store" button that runs `chrome.tabs.create({ url: "https://chromewebstore.google.com/detail/<EXTENSION_ID>" })`. User clicks "Add to Chrome" themselves. Entries stored in chrome.storage.local
- **FR-37**: Export and import installed extension list as JSON (id, name, enabled state). On import, show which ones are missing and offer "Open in store" for each one
- **FR-38**: Before first use of hub, show short explanation of why management permission is needed and what Clearmark does and does not do with it