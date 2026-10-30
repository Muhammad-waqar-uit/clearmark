# Clearmark

Chrome extension (Manifest V3) to manage bookmarks and installed extensions from one place.

## Install

```bash
git clone https://github.com/Muhammad-waqar-uit/clearmark.git
cd clearmark
pnpm install
pnpm dev
```

## Scripts

- `pnpm dev` - Development mode
- `pnpm build` - Build production bundle
- `pnpm lint` - Run ESLint
- `pnpm test` - Run Vitest unit tests

## Features

All 38 Functional Requirements:
- Bookmark tree browse, search, filter
- Create/rename/move/delete bookmarks and folders
- Duplicate detection, dead link checker
- Tags and notes per bookmark
- JSON and HTML import/export
- Extension hub: list, enable/disable, remove
- Popup: quick search, add current page
- Options: theme, sort, uninstall URL

## Tech Stack

Manifest V3, TypeScript strict, React 18, Vite, Tailwind CSS, Vitest, ESLint, Husky

## License

MIT