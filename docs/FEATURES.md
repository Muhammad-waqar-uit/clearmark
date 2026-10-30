# Features

## Bookmark manager

- **Browse** every bookmark in a folder tree sidebar with counts that include nested
  folders. "All bookmarks" shows the whole tree.
- **Search** title, URL, folder path, tags and notes as you type (`/` focuses the box).
- **Filter** by domain, tag and age (7 / 30 / 365 days).
- **Sort** by title, newest first or URL; the default comes from settings.
- **Two views**: list (URL, folder, date) and compact (title only).
- **Live updates**: changes made anywhere in Chrome appear immediately.

## Bookmark actions

- **Create** a bookmark with title, URL and destination folder.
- **Edit** title and URL in a dialog.
- **Delete** a bookmark, a multi-selection, or a folder with its contents.
- **Move** with a folder picker or by dragging a bookmark onto a folder in the sidebar.
  Dragging one selected bookmark moves the whole selection.
- **Multi-select** with checkboxes, select-all for the current results, bulk move,
  bulk "add tag" and bulk delete.
- **Undo** deletes for 10 seconds; deleted folders come back with their children.

## Cleanup

- **Duplicates**: URLs are compared after lowercasing the host, dropping `www.`,
  fragments, tracking parameters (`utm_*`, `fbclid`, `ref`…), trailing slashes and
  upgrading `http` to `https`. Pick the copy to keep per group, or keep the oldest in
  every group at once.
- **Dead links**: checks every bookmark with a `HEAD` request (falls back to `GET` on
  405/501/403), 5 at a time, 8 second timeout, with progress and a stop button.
  Broken and redirected links are listed separately and can be deleted or opened.
- **Empty folders**: lists folders with no children. The three built-in top-level
  folders are never listed or deleted.

## Tags and notes

- Every bookmark can have tags and one note, stored locally by bookmark id.
- Inline editor on each row; tags appear as chips and a note shows as 📝.
- Tag filter in the search bar; tags and notes are included in text search.
- Bulk "add tag" applies a tag to every selected bookmark.
- Deleting a bookmark removes its tags and notes.

## Import and export

- **Export JSON**: array of bookmarks with title, URL, folder path, tags, note and
  date added.
- **Export HTML**: standard Netscape bookmark file, importable by Chrome, Firefox and
  Edge. Tags are written as `TAGS="…"` attributes.
- **Import**: JSON or HTML, with a preview of how many bookmarks and folders were
  found. Choose a destination folder or let Clearmark create
  `Imported YYYY-MM-DD`.

## Extension hub

- Lists installed extensions with icon, version, description and on/off state.
- Search by name, description or id; filter to enabled or disabled.
- Details dialog with install type, permissions, site access and Chrome's permission
  warnings.
- Enable or disable one extension, or queue bulk enable/disable with progress.
- Remove one extension (Chrome asks for confirmation) or queue a bulk removal.
- Policy-managed and protected items are labelled `managed` and skipped by bulk
  actions. Clearmark never includes itself.
- Saved **install list**: add by store URL or 32-character id, open up to 10 store
  pages, export the list as JSON, import a JSON or plain-text list.
- One-time explanation of why the `management` permission is needed (reset from
  settings).

## Popup

- Search with the top 10 matches; clicking a result opens it and closes the popup.
- Shows the current tab; one click saves it into the selected folder.
- Opens the full manager or the options page.

## Settings

- Theme: light, dark or system, applied to every extension page.
- Default sort order for the manager.
- Uninstall feedback URL, kept in sync by the service worker.
- "Show explanation again" for the management permission.
- Remove Clearmark with Chrome's confirmation dialog. Bookmarks, tags and notes are
  left in the browser.
