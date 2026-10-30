/** Normalize a URL for duplicate detection:
 * - lowercase the host
 * - strip trailing slash
 * - strip common tracking params (utm_*, etc.)
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    // Lowercase hostname
    parsed.hostname = parsed.hostname.toLowerCase()
    // Remove trailing slash from path (but keep / if it's just /)
    if (parsed.pathname.length > 1) {
      parsed.pathname = parsed.pathname.replace(/\/?$/, '/')
    }
    // Actually, let's keep it simpler - just strip trailing slash and tracking params
    // Let's re-do this properly
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'src']
    const searchParams = new URLSearchParams(parsed.search)
    for (const param of trackingParams) {
      searchParams.delete(param)
    }
    parsed.search = searchParams.toString()
    // Remove trailing slash
    if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1)
    }
    return parsed.toString()
  } catch {
    return url
  }
}

/** Detect duplicate bookmarks by normalized URL */
export function findDuplicates(bookmarks: Array<chrome.bookmarks.BookmarkTreeNode>): Array<{ url: string; ids: string[] }> {
  const urlMap = new Map<string, string[]>()
  
  for (const bm of bookmarks) {
    // Only process leaf nodes (actual bookmarks, not folders)
    if (bm.children && bm.children.length > 0) continue
    if (!bm.url) continue
    
    const normalized = normalizeUrl(bm.url)
    if (!urlMap.has(normalized)) {
      urlMap.set(normalized, [])
    }
    urlMap.get(normalized)!.push(bm.id || '')
  }
  
  const duplicates: Array<{ url: string; ids: string[] }> = []
  for (const [url, ids] of urlMap) {
    if (ids.length > 1) {
      duplicates.push({ url, ids })
    }
  }
  
  return duplicates
}