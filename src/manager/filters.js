 function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }import { domainOf } from '../lib/bookmarks'


 














/** Filter bookmarks by folder scope, text, domain, tag and age. */
export function filterBookmarks(
  bookmarks,
  { query, domain, tag, date, scope, now = Date.now() }
) {
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
      (_nullishCoalesce(bookmark.meta.note, () => ( ''))).toLowerCase().includes(needle)
    )
  })
}

/** Return a sorted copy of the list. */
export function sortBookmarks(bookmarks, sort) {
  return [...bookmarks].sort((a, b) => {
    if (sort === 'dateAdded') return b.dateAdded - a.dateAdded
    if (sort === 'url') return a.url.localeCompare(b.url)
    return a.title.localeCompare(b.title)
  })
}

/** Unique domains present in the bookmark list. */
export function collectDomains(bookmarks) {
  const domains = new Set()
  for (const bookmark of bookmarks) {
    const domain = domainOf(bookmark.url)
    if (domain) domains.add(domain)
  }
  return Array.from(domains).sort((a, b) => a.localeCompare(b))
}

/** Unique tags across all bookmark metadata, sorted alphabetically. */
export function collectTags(meta) {
  const tags = new Set()
  for (const entry of Object.values(meta)) {
    for (const tag of entry.tags) {
      if (tag.trim()) tags.add(tag.trim())
    }
  }
  return Array.from(tags).sort((a, b) => a.localeCompare(b))
}
