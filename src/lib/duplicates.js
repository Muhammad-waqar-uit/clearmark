

const TRACKING_PARAM = /^(utm_|ga_|mc_|pk_|piwik_)/i
const SINGLE_TRACKING = new Set(['fbclid', 'gclid', 'msclkid', 'yclid', 'dclid', 'igshid', 'ref', 'ref_src'])

/**
 * Normalize a URL so equal pages compare equal:
 * lowercase host, drop `www.`, drop fragments, drop tracking params,
 * drop a trailing slash and upgrade http to https.
 */
export function normalizeUrl(raw) {
  try {
    const url = new URL(raw.trim())
    url.hash = ''
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, '')
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, '')

    const kept = []
    for (const [key, value] of url.searchParams.entries()) {
      if (TRACKING_PARAM.test(key) || SINGLE_TRACKING.has(key.toLowerCase())) continue
      kept.push([key, value])
    }
    url.search = ''
    for (const [key, value] of kept) url.searchParams.append(key, value)

    if (url.protocol === 'http:') url.protocol = 'https:'
    return url.toString()
  } catch {
    return raw.trim()
  }
}

 






/** Group bookmarks whose URLs differ only by tracking noise, case or slash. */
export function findDuplicates(bookmarks) {
  const groups = new Map()

  for (const bookmark of bookmarks) {
    if (!bookmark.url) continue
    const key = normalizeUrl(bookmark.url)
    const existing = groups.get(key)
    if (existing) existing.push(bookmark)
    else groups.set(key, [bookmark])
  }

  const duplicates = []
  for (const [url, list] of groups) {
    if (list.length > 1) {
      duplicates.push({
        url,
        bookmarks: [...list].sort((a, b) => a.dateAdded - b.dateAdded),
      })
    }
  }

  return duplicates.sort((a, b) => b.bookmarks.length - a.bookmarks.length)
}

/** Ids to delete when the oldest copy is kept (the default cleanup choice). */
export function extrasKeepingOldest(group) {
  return group.bookmarks.slice(1).map((bookmark) => bookmark.id)
}

/** Ids to delete when `keepId` is the copy the user wants to keep. */
export function extrasKeeping(group, keepId) {
  return group.bookmarks.filter((bookmark) => bookmark.id !== keepId).map((bookmark) => bookmark.id)
}

/** Total number of redundant copies across every group. */
export function countExtras(groups) {
  return groups.reduce((total, group) => total + group.bookmarks.length - 1, 0)
}
