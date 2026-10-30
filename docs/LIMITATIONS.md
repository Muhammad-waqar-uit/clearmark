# Limitations

## Chrome extension constraints

- **Dead link checks need a permission prompt.** They are the only feature that
  contacts third-party sites, so `<all_urls>` is an optional host permission requested
  on first use. If the user declines, no check runs.
- **Dead link results are approximate.** Many sites block `HEAD`; the checker retries
  with `GET`. Sites behind bot protection, login walls or rate limits can report 403/429
  even though a browser visit works. A network error or timeout is reported as broken.
- **No credentials are sent.** Link checks use `credentials: 'omit'`, so private pages
  will usually look broken.
- **Tag and note storage is local only.** It is not synced to the Chrome profile and is
  not part of Chrome's own bookmark sync. Exporting JSON is the way to move it.
- **`chrome.storage.local` quota** (about 10 MB) bounds how many tags and notes can be
  stored. Notes are plain text and kept short by design.
- **Metadata is keyed by bookmark id.** Bookmarks synced from another device keep their
  ids, but deleting and re-adding a bookmark loses its tags and notes.
- **Undo lasts 10 seconds and only covers this session.** Once the snackbar disappears,
  a deleted folder (with contents) cannot be restored from inside the extension.
- **Built-in folders cannot be removed.** Bookmarks bar, Other bookmarks and Mobile
  bookmarks are excluded from deletion, and Chrome does not allow renaming the root.
- **Drag-and-drop moves bookmarks only**, onto folders in the sidebar. Reordering within
  a folder is not supported.
- **The popup only reads the tab it was opened on.** It relies on `activeTab`, which is
  granted when you click the toolbar icon, so the extension never holds a standing
  browsing-history permission. Opening the popup is what grants it; the manager page
  cannot read other tabs at all.
- **The manager is a full page**, not the popup; Chrome opens it from the popup or the
  options page.

## Extension hub constraints

- **`chrome.management` cannot bypass Chrome's rules.** Extensions installed by policy
  (`mayDisable: false`, `installType: admin`) are read-only and skipped by bulk actions.
- **Removal always shows Chrome's own confirmation dialog**, one per extension. Bulk
  removal is therefore a queue, not a single click.
- **Chrome may block disabling some extensions** (for example ones required by policy,
  or the extension itself). Those failures are reported per item.
- **The install list does not install anything.** It stores ids and opens Chrome Web
  Store pages; installation stays a manual click.
- **Tap/click limit**: "Open in store" opens at most 10 tabs at a time.

## Import and export

- **HTML exports do not include notes** (the Netscape format has no field for them).
  JSON is the lossless format.
- **HTML imports create a folder tree exactly as written in the file.** Tags in
  `TAGS="…"` attributes are not read.
- **Imports never merge.** Re-importing the same file creates duplicates; run the
  duplicate cleanup afterwards.
- **A failed import keeps what was already created.** Chrome offers no transaction, so
  partial imports are possible (the UI says so).
- **Exports are downloads**, handled by Chrome's download manager; a blocked download
  leaves no file.

## UI and browser notes

- **Favicons are not requested.** Rows use a deterministic letter tile instead of remote
  favicon URLs, so the extension makes no network requests while browsing bookmarks.
- **Very large trees are windowed, not paginated.** Only the rows near the viewport are
  in the DOM, with spacer elements standing in for the rest, so opening a folder with tens
  of thousands of bookmarks stays cheap. Rows are measured as they mount, so wrapped tags
  or an open tag editor do not shift the scroll position.
- **The tag/note editor turns windowing off** while it is open (one row, so the cost is
  negligible); closing it returns the list to windowed rendering.
- **Search and filters run over every bookmark**, not just the rendered window, so a match
  far down the list is still found.
- **Dark mode uses the `dark` class** on `<html>`, applied when a page loads. System
  changes are picked up while a page is open.
- **Accessibility**: dialogs trap Escape and return focus by click, but they do not yet
  implement a full focus trap or `inert` background.

## Not implemented

- Bookmark sync or sharing between browsers.
- Folder drag-and-drop reordering.
- Scheduled or automatic link checking.
- Chrome Web Store publication metadata (screenshots, privacy justification) and the
  manual clean-profile test.
