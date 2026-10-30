# Clearmark: Bookmark & Extension Manager

## Architecture Overview

Clearmark is a Chrome Extension (Manifest V3) built with:
- **TypeScript strict mode** for type safety
- **React 18** with Vite for the UI
- **Tailwind CSS** for styling
- **Plasmo framework** compatibility structure

## Module Boundaries

### `src/lib/` - Core Libraries
- `bookmarks.ts` - chrome.bookmarks.getTree() wrapper, recursive flattening
- `storage.ts` - chrome.storage.local CRUD operations
- `duplicates.ts` - URL normalization + duplicate detection algorithm
- `linkcheck.ts` - Dead link checking with concurrency control (5 at a time, 8s timeout)
- `exportImport.ts` - JSON/HTML import/export functionality
- `types.ts` - Core data types (BookmarkMeta, Storage, ManagerBookmark, etc.)
- `extensions.ts` - chrome.management wrappers (getAll, setEnabled, uninstall)

### `src/background/` - Service Worker
- Handles bookmark events (onCreated, onRemoved, onChanged, onMoved)
- Management event listeners (onInstalled, onUninstalled, onEnabled, onDisabled)
- Self-uninstall flow with confirmation dialog

### `src/popup/` - Quick Access Popup
- Search bar with top 10 results
- "Add current page" with folder picker
- "Open full manager" button

### `src/manager/` - Main Bookmark Manager
- Folder tree visualization
- Bookmark list with search and sort
- Bulk actions (move, delete)
- Duplicate detection panel
- Dead link checker
- Import/Export panel

### `src/options/` - Options Page
- Theme selection (light/dark/system)
- Default sort order (title/dateAdded/url)
- Uninstall URL configuration
- Remove extension button

### `src/` - UI Components
- Popup.tsx - Quick search popup
- Manager.tsx - Main manager page
- Options.tsx - Settings page

## Data Flow

1. **Bookmark Events**: Service worker listens to chrome.bookmarks.* events
2. **Storage**: All metadata stored in chrome.storage.local
3. **UI Updates**: React components subscribe to storage changes
4. **Search**: Debounced search across bookmark titles and URLs
5. **Duplicate Detection**: Normalized URL comparison (lowercase host, strip tracking params)
6. **Link Checking**: Concurrent URL checking with AbortController timeout

## Chrome API Usage

All chrome.* calls are wrapped in `src/lib/` to keep UI components free of direct browser API calls, as specified in the requirements.

## Key Decisions

- **No eval or remote code**: All code is static, built to dist/
- **Strict CSP**: MV3 defaults applied
- **Virtualization ready**: Designed for 20,000+ bookmarks with @tanstack/react-virtual
- **TypeScript strict**: noUnusedLocals, noUnusedParameters, explicit function returns
- **Performance**: List virtualization for smooth 20k bookmark handling