/** Core data types for the extension */

/** Metadata stored in chrome.storage.local for each bookmark */
export type BookmarkMeta = {
  tags: string[]
  note?: string
}

/** A "wanted" extension from the install list */
export type WantedExtension = {
  id: string // Chrome Web Store extension id
  name: string
  addedAt: number
}

/** Top-level storage structure */
export type Storage = {
  meta: Record<string, BookmarkMeta> // key is the browser bookmark id
  wantedExtensions: WantedExtension[] // the "install list" (FR-36)
  settings: {
    theme: 'light' | 'dark' | 'system'
    defaultSort: 'title' | 'dateAdded' | 'url'
    uninstallUrl?: string
  }
}

/** Bookmark node from the manager UI */
export type ManagerBookmark = {
  id: string
  title: string
  url: string
  folderPath: string
  dateAdded: number
  favicon: string
  tags: string[]
  note?: string
}

/** Popup UI state */
export type PopupState = {
  showSearch: boolean
  searchQuery: string
  selectedFolder: string | null
}

/** Options page state */
export type OptionsState = {
  theme: 'light' | 'dark' | 'system'
  defaultSort: 'title' | 'dateAdded' | 'url'
  uninstallUrl: string
}