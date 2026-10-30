import { domainOf } from '../lib/bookmarks'
import type { BookmarkMeta, FlatBookmark, SortKey } from '../lib/types'

export type DateFilter = 'any' | '7' | '30' | '365'
export type ViewMode = 'list' | 'compact'

export type BookmarkWithMeta = FlatBookmark & { meta: BookmarkMeta }

type FilterOptions = {
  query: string
  domain: string
  tag: string
  date: DateFilter
  /** Folder ids included by the sidebar selection; null means every folder. */
  scope: Set<string> | null
  now?: number
}

/** Filter bookmarks by folder scope, text, domain, tag and age. */
export function filterBookmarks(
  bookmarks: BookmarkWithMeta[],
  { query, domain, tag, date, scope, now = Date.now() }: FilterOptions
): BookmarkWithMeta[] {
  const needle = query.trim().toLowerCase()
  const cutoff = date === 'any' ? 0 : now - Number(date) * 24 * 60 * 60 * 1000

  return bookmarks.filter((bookmark) => {
    if (scope && !bookmark.folderPathIds.some((id) => scope.has(id))) return false
    if (domain && domainOf(bookmark.url) !== domain) return false
    if (tag && !bookmark.meta.tags.includes(tag)) return false
    if (cutoff > 0 && bookmark.dateAdded < cutoff) return false
    if (!needle) return true

    return (
      bookmark.title.toLowerCase().includes(needle) ||
      bookmark.url.toLowerCase().includes(needle) ||
      bookmark.folderPath.toLowerCase().includes(needle) ||
      bookmark.meta.tags.some((item) => item.toLowerCase().includes(needle)) ||
      (bookmark.meta.note ?? '').toLowerCase().includes(needle)
    )
  })
}

/** Return a sorted copy of the list. */
export function sortBookmarks(bookmarks: BookmarkWithMeta[], sort: SortKey): BookmarkWithMeta[] {
  return [...bookmarks].sort((a, b) => {
    if (sort === 'dateAdded') return b.dateAdded - a.dateAdded
    if (sort === 'url') return a.url.localeCompare(b.url)
    return a.title.localeCompare(b.title)
  })
}

/** Unique domains present in the bookmark list. */
export function collectDomains(bookmarks: FlatBookmark[]): string[] {
  const domains = new Set<string>()
  for (const bookmark of bookmarks) {
    const domain = domainOf(bookmark.url)
    if (domain) domains.add(domain)
  }
  return Array.from(domains).sort((a, b) => a.localeCompare(b))
}

/** Unique tags across all bookmark metadata, sorted alphabetically. */
export function collectTags(meta: Record<string, BookmarkMeta>): string[] {
  const tags = new Set<string>()
  for (const entry of Object.values(meta)) {
    for (const tag of entry.tags) {
      if (tag.trim()) tags.add(tag.trim())
    }
  }
  return Array.from(tags).sort((a, b) => a.localeCompare(b))
}
