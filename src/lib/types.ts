/** Core data types for Clearmark. */

/** Metadata stored in chrome.storage.local for each bookmark. */
export type BookmarkMeta = {
  tags: string[]
  note?: string
}

/** An extension the user wants to install from the Chrome Web Store. */
export type WantedExtension = {
  id: string
  name: string
  addedAt: number
}

export type SortKey = 'title' | 'dateAdded' | 'url'
export type Theme = 'light' | 'dark' | 'system'

export type Settings = {
  theme: Theme
  defaultSort: SortKey
  uninstallUrl: string
  managementExplained: boolean
}

/** Top-level storage structure. */
export type Storage = {
  meta: Record<string, BookmarkMeta>
  wantedExtensions: WantedExtension[]
  settings: Settings
}

/** A bookmark flattened out of the browser tree. */
export type FlatBookmark = {
  id: string
  title: string
  url: string
  parentId: string
  folderPath: string
  /** Ids of every folder above the bookmark, outermost first. */
  folderPathIds: string[]
  dateAdded: number
}

/** A folder flattened out of the browser tree. */
export type FlatFolder = {
  id: string
  title: string
  parentId: string
  depth: number
  path: string
  pathIds: string[]
}

/** A folder with its children, used to render the folder tree. */
export type FolderNode = {
  id: string
  title: string
  children: FolderNode[]
}

/** Result of a dead link check. */
export type LinkStatus = 'ok' | 'redirected' | 'broken'

export type LinkCheckResult = {
  id: string
  url: string
  status: LinkStatus
}
