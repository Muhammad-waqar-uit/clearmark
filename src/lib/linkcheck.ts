import type { LinkCheckResult, LinkStatus } from './types'

/** Map an HTTP status code to a link status. */
export function classifyStatus(status: number): LinkStatus {
  if (status >= 200 && status < 300) return 'ok'
  if (status >= 300 && status < 400) return 'redirected'
  return 'broken'
}

/** Check one URL. Returns `broken` for network errors and timeouts. */
export async function checkUrl(url: string, timeoutMs = 8000): Promise<LinkStatus> {
  const run = async (method: 'HEAD' | 'GET'): Promise<Response> => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      return await fetch(url, {
        method,
        signal: controller.signal,
        cache: 'no-store',
        redirect: 'follow',
        credentials: 'omit',
      })
    } finally {
      clearTimeout(timer)
    }
  }

  try {
    let response = await run('HEAD')
    if (response.status === 405 || response.status === 501 || response.status === 403) {
      response = await run('GET')
    }
    const status = classifyStatus(response.status)
    if (status === 'ok' && response.redirected) return 'redirected'
    return status
  } catch {
    return 'broken'
  }
}

export type LinkCheckOptions = {
  concurrency?: number
  timeoutMs?: number
  onProgress?: (done: number, total: number) => void
  shouldStop?: () => boolean
}

/**
 * Check many bookmarks with a fixed number of parallel requests.
 * Checks that have not started when `shouldStop` returns true are skipped.
 */
export async function checkBookmarks(
  bookmarks: Array<{ id: string; url: string }>,
  { concurrency = 5, timeoutMs = 8000, onProgress, shouldStop }: LinkCheckOptions = {}
): Promise<LinkCheckResult[]> {
  const results: LinkCheckResult[] = []
  let cursor = 0
  let done = 0

  const worker = async (): Promise<void> => {
    while (cursor < bookmarks.length) {
      if (shouldStop?.()) return
      const index = cursor
      cursor += 1
      const bookmark = bookmarks[index]
      const status = await checkUrl(bookmark.url, timeoutMs)
      results.push({ id: bookmark.id, url: bookmark.url, status })
      done += 1
      onProgress?.(done, bookmarks.length)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, bookmarks.length) }, () => worker())
  )
  return results
}

/**
 * Ask for the host permission needed to check links. Calling `request` first
 * keeps the call inside the click's user gesture, and it resolves `true`
 * immediately when the permission was already granted.
 */
export async function ensureLinkCheckPermission(): Promise<boolean> {
  try {
    return await chrome.permissions.request({ origins: ['<all_urls>'] })
  } catch {
    return false
  }
}
