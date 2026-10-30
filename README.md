# Clearmark: Bookmark & Extension Manager

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome%20Extension-Yes-orange.svg)](https://developer.chrome.com/docs/extensions/)
[![TypeScript](https://img.shields.io/badge/TypeScript- strict-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-4.5-646CFF.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)

## 📋 Overview

Clearmark is a **Chrome Extension (Manifest V3)** that lets users manage all their bookmarks and installed browser extensions from one place. It reads the browser's native bookmark tree, offers fast search and bulk actions, and includes an extension hub to list, enable, disable, and remove installed extensions.

Built with **TypeScript strict mode**, **React 18**, **Vite**, and **Tailwind CSS**.

## 🚀 Features

All 38 Functional Requirements from the requirements document:

### Bookmark Management (FR-1 to FR-11)
- Browse full bookmark tree with live updates
- Search and filter across title, URL, folders, and domains
- Create, rename, move, and delete bookmarks and folders
- Drag and drop reorganization
- Multi-select with checkboxes and bulk actions
- 10-second undo for deletes

### Cleanup Tools (FR-12 to FR-14)
- Duplicate detection by normalized URL (strip tracking params)
- Dead link checker (concurrent, 8s per URL, progress bar)
- Empty folder detection and cleanup

### Tags & Notes (FR-15 to FR-17)
- Add tags and short notes to bookmarks
- Store in chrome.storage.local keyed by bookmark ID
- Filter and search by tag
- Clean up notes when bookmark is removed

### Import/Export (FR-18 to FR-19)
- Export to JSON (including tags and notes)
- Export to standard Netscape HTML format
- Import from JSON and HTML with preview
- Imported items go into "Imported <date>" folder

### Extension Hub (FR-28 to FR-38)
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

### Popup (FR-20 to FR-22)
- Quick search box with top 10 results
- "Add current page" with folder picker
- "Open full manager" button

### Settings & Uninstall (FR-23 to FR-27)
- Options page with theme (light/dark/system) and default sort
- "Remove extension" with Chrome confirmation dialog
- Configurable uninstall URL for feedback page
- Bookmarks never deleted by uninstall

## 📦 Installation

```bash
# Clone and install
git clone https://github.com/yourusername/clearmark.git
cd clearmark
pnpm install

# Development
pnpm dev

# Build
pnpm build

# Lint
pnpm lint

# Test
pnpm test
```

## 🏗️ Project Structure

```
clearmark/
├── manifest.json          # Chrome MV3 manifest
├── package.json           # Dependencies + scripts
├── vite.config.ts         # Vite + React config
├── tsconfig.json          # TypeScript strict mode
├── tailwind.config.js     # Tailwind CSS config
├── postcss.config.js      # PostCSS with Tailwind + Autoprefixer
├── .eslintrc.cjs        # ESLint config
├── .prettierrc.json     # Prettier formatting
├── .husky/              # Git hooks (pre-commit: lint)
├── public/icons/        # All icon sizes (16, 32, 48, 128, 512 + logos)
├── src/
│   ├── background/      # Service worker + bookmark events
│   ├── lib/           # Core libraries (bookmarks, storage, duplicates, etc.)
│   ├── manager/       # Main bookmark manager UI
│   ├── popup/         # Quick access popup
│   └── options/       # Options page
├── tests/             # Vitest unit tests
├── ARCHITECTURE.md    # Design decisions and module boundaries
├── FEATURES.md        # All 38 functional requirements
├── LIMITATIONS.md     # Known constraints and browser limits
├── PLAN.md            # 9 milestones from scaffold to release
└── PROGRESS.md        # Current status and work tracking
```

## 🛠️ Tech Stack

- **Manifest V3** Chrome Extension
- **TypeScript** strict mode (`noUnusedLocals`, `noUnusedParameters`)
- **React 18** with Vite
- **Tailwind CSS 3** for styling
- **Vitest** for unit testing (jsdom environment)
- **ESLint** for code quality (no prettier integration conflicts)
- **Husky** for pre-commit lint hooks
- **chrome.bookmarks**, **chrome.storage**, **chrome.management**, **chrome.runtime** APIs

## 📄 License

MIT - Free to use and modify. See LICENSE for details.

## 🎯 Acceptance Criteria

- Loads in Chrome via "Load unpacked" with no console errors or manifest warnings
- All bookmarks shown match the browser's own bookmark manager (chrome://bookmarks)
- Adding, editing, moving, or deleting a bookmark shows up in both places within one second
- Search returns results as user types with no visible lag on 10,000 bookmark test set
- Delete always asks for confirmation, and undo restores the item in its original folder
- Export then import round trips without losing titles, URLs, folders, tags, or notes
- The extension hub lists every installed extension, and the list updates within one second when extensions are installed, removed, enabled, or disabled elsewhere
- Disabling and enabling an extension from the hub works, and policy managed extensions show as locked
- Removing an extension from the hub opens Chrome's confirmation dialog, removes it on confirm, and leaves it untouched on cancel
- Clearmark never appears in bulk actions
- "Open in store" opens the correct Chrome Web Store page, and nothing is installed without the user clicking "Add to Chrome"
- The "Remove extension" button opens Chrome's confirmation dialog, removes the extension on confirm, and does nothing harmful on cancel
- Only the permissions listed in section 4 appear in the install prompt