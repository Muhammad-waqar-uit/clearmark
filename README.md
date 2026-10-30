# Clearmark

Chrome extension (Manifest V3) that manages bookmarks and installed extensions from one
place: browse and edit the bookmark tree, clean up duplicates, dead links and empty
folders, tag and note bookmarks, import/export backups, and enable, disable or remove
extensions.

## Install (unpacked)

```bash
git clone https://github.com/Muhammad-waqar-uit/clearmark.git
cd clearmark
pnpm install
pnpm build
```

Then open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked** and
select the generated `dist/` folder. The toolbar icon opens the popup; the popup links to
the full manager and to settings.

`pnpm dev` runs `vite build --watch`, so `dist/` updates on save; press the reload button
on the extension card after a rebuild.

## Scripts

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Rebuild `dist/` on every change |
| `pnpm build` | Production build into `dist/` |
| `pnpm typecheck` | `tsc --noEmit` (strict) |
| `pnpm lint` | ESLint over source, tests and config |
| `pnpm test` | Vitest (unit + jsdom UI smoke tests) |
| `pnpm icons` | Regenerate `public/icons/*.png` |
| `pnpm check` | typecheck → lint → test → build |

## Features

- Folder tree with counts, live updates, search across title/URL/folder/tag/note,
  domain, tag and date filters, sorting, list and compact views
- Create, edit, delete, move and drag bookmarks; create, rename and delete folders;
  multi-select with bulk move, tag and delete; 10 second undo
- Duplicate detection on normalized URLs, a concurrent dead link checker with progress,
  and empty folder cleanup
- Tags and notes per bookmark, stored locally
- JSON export (with tags and notes), Netscape HTML export, and previewed import of both
- Extension hub: list, search, enable/disable, remove, queued bulk actions with policy
  detection, permission warnings, and a saved install list with store links
- Popup quick search and "add current page"; options for theme, default sort and
  uninstall feedback URL

See [docs/FEATURES.md](docs/FEATURES.md) for details and
[docs/LIMITATIONS.md](docs/LIMITATIONS.md) for what the extension deliberately does not do.

## Permissions

`bookmarks`, `storage`, `tabs`, `management`, plus optional `<all_urls>` which is
requested only when you run a dead link check. Everything stays in the browser; there is
no server and no analytics page. The uninstall URL is empty unless you set one.

## Tech stack

Manifest V3, TypeScript (strict), React 18, Vite 8, Tailwind CSS 3, Vitest + jsdom,
ESLint, Husky.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Features](docs/FEATURES.md)
- [Limitations](docs/LIMITATIONS.md)
- [Plan](docs/PLAN.md)
- [Progress](docs/PROGRESS.md)
- [Requirements](docs/REQUIREMENTS.pdf)

## License

MIT
