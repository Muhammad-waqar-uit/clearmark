# Testing Clearmark in Chrome

Automated checks cover the logic and the three React pages (see `pnpm check`). What they
cannot cover is Chrome itself: extension APIs, permission prompts, the popup frame and
Chrome's own dialogs. This file is that missing pass.

Budget about 15 minutes. Work on a **fresh Chrome profile** so the first-run permission
warnings you see are the ones a real user sees.

## 1. Build and load

```bash
cd clearmark
pnpm install
pnpm check          # typecheck, lint, tests, build
```

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select the `dist/` folder.
4. Expect: Clearmark appears with its icon, no error badge, and **no "Errors" button**.

**Expected permission warnings on load:**

| Warning | Reason |
|---------|--------|
| Read and change your bookmarks | `bookmarks` |
| Manage your apps, extensions, and themes | `management` |
| (nothing about browsing history) | the popup uses `activeTab`, not `tabs`, so no history warning should appear |
| (nothing about all sites) | `<all_urls>` is optional and only asked for during a link check |

If Chrome warns about browsing history or all sites at install time, a permission was
declared wrong — check `manifest.json`.

## 2. Popup

Click the toolbar icon.

- [ ] Popup opens at ~360px wide, search box focused.
- [ ] Typing filters the list to at most 10 results; a nonsense query shows
      "No bookmarks match …".
- [ ] Clicking a result opens that URL in a new tab and closes the popup.
- [ ] The bottom card shows the current tab's title — this proves the `activeTab` grant is
      working — and **Add page** saves it to the chosen folder ("Saved to your bookmarks."
      appears).
- [ ] **Add page** is disabled on a `chrome://` page ("This tab cannot be bookmarked").
- [ ] **Settings** opens the options page; **Open full manager** opens the manager tab.

## 3. Manager: browsing

Open the manager from the popup.

- [ ] Sidebar lists Bookmarks bar / Other bookmarks with per-folder counts; counts
      include nested folders.
- [ ] Selecting a folder shows its bookmarks *and* those of its subfolders.
- [ ] Search matches title, URL, folder name, tag and note.
- [ ] Domain, tag and date filters each narrow the list; clearing them restores it.
- [ ] Sort and the list/compact toggle change the order and density.
- [ ] Create a bookmark in Chrome (Ctrl+D on a page): the manager list updates without a
      reload.

## 4. Manager: edits

- [ ] **New bookmark** creates an entry in the chosen folder and it appears immediately.
- [ ] Editing a title/URL persists after closing and reopening the manager.
- [ ] **New folder**, **Rename** and **Delete folder** work; renaming the Bookmarks bar is
      refused with a message rather than a crash.
- [ ] Drag a bookmark row onto a sidebar folder: it moves there. Dragging onto a bookmark
      (not a folder) does nothing.
- [ ] Tick two rows: the bulk bar appears; bulk **move**, **add tag** and **delete** all
      apply to every selected row.
- [ ] Delete a bookmark, then click **Undo** within 10 seconds: it returns to its original
      folder and position. Delete a folder with contents, undo: the folder and its
      contents return. After the snackbar disappears, undo is no longer offered.

## 5. Tags and notes

- [ ] Add a tag and a note to a bookmark; reload the manager; both are still there.
- [ ] Filter by that tag: only tagged bookmarks show.
- [ ] Delete the bookmark in Chrome (not via the extension), then reload: no stale
      tag/note is offered in the tag filter.

## 6. Cleanup

- [ ] Create two bookmarks with the same URL (differing only by trailing slash or `www.`):
      they are grouped as duplicates. Choosing a different keeper and clicking the cleanup
      action removes the others.
- [ ] Start a dead link check. **Chrome shows a permission prompt for all sites** — this
      is the expected, explainable moment. Accept it.
- [ ] Progress updates while checks run, and **Stop** halts further checks within a second.
- [ ] A known-dead URL is marked broken; a known-good one is marked ok.
- [ ] Decline the permission on a fresh profile: the check does not run and a message
      explains why (no crash, no silent no-op).
- [ ] Empty folders are listed and can be removed; a folder that contains only empty
      subfolders is itself reported empty.

## 7. Extensions tab

- [ ] Installed extensions are listed with icons, on/off state and version; Clearmark is
      present but excluded from bulk actions.
- [ ] Search and the enabled/disabled filter work.
- [ ] Detail dialog shows permissions and permission warnings; it closes with Escape.
- [ ] Disable an extension, then enable it again: state changes in both Clearmark and
      `chrome://extensions`.
- [ ] A policy-installed extension (if you have one) shows as managed and its toggle is
      refused with an explanation.
- [ ] Bulk disable on two extensions runs as a queue with progress.
- [ ] **Remove** on a throwaway extension: Chrome's own confirmation dialog appears (this
      is expected — Chrome always asks).
- [ ] Save an extension to the install list, then **Open in store**: a Web Store tab opens.

## 8. Import and export

- [ ] Export JSON: the file downloads and contains folders, tags and notes.
- [ ] Export HTML: the file downloads and re-opens as bookmarks if imported by Chrome.
- [ ] Import the JSON you just exported: the preview lists the items, and importing into
      the default "Imported YYYY-MM-DD" folder creates them.
- [ ] Importing the same file twice creates duplicates (documented) — clean up with the
      duplicate tool.

## 9. Options

- [ ] Theme switch (light / dark / system) applies immediately and survives reopening
      every page.
- [ ] Changing the default sort is reflected the next time the manager opens.
- [ ] Set an uninstall URL, then read it back from `chrome://extensions` → Details.
      Clear it and confirm it is empty again.
- [ ] **Reset management explanation** clears the "why Clearmark wants this" note.
- [ ] Self-removal asks for confirmation and is refused if Chrome blocks it.

## 10. Regression sweep

Reload the extension from `chrome://extensions` and repeat steps 2, 4 and 6 once. Then
check the service worker console (the **service worker** link on the extension card) is
free of errors after bookmark edits, extension changes and an import.

## Reporting a failure

Note the step number, the browser version (`chrome://version`) and what you saw instead.
Anything that throws in a page console or the service worker console is a bug, not a
setup issue.

## What is still not covered

Even after this pass, the following are unverified: Chrome Web Store listing behaviour,
policy-managed environments, very large bookmark trees (tens of thousands of entries) and
cross-device sync of tags and notes.
