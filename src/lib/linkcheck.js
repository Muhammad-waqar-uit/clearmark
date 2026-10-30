 function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

/** Map an HTTP status code to a link status. */
export function classifyStatus(status) {
  if (status >= 200 && status < 300) return 'ok'
  if (status >= 300 && status < 400) return 'redirected'
  return 'broken'
}

/** Check one URL. Returns `broken` for network errors and timeouts. */
export async function checkUrl(url, timeoutMs = 8000) {
  const run = async (method) => {
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

 






/**
 * Check many bookmarks with a fixed number of parallel requests.
 * Checks that have not started when `shouldStop` returns true are skipped.
 */
export async function checkBookmarks(
  bookmarks,
  { concurrency = 5, timeoutMs = 8000, onProgress, shouldStop } = {}
) {
  const results = []
  let cursor = 0
  let done = 0

  const worker = async () => {
    while (cursor < bookmarks.length) {
      if (_optionalChain([shouldStop, 'optionalCall', _ => _()])) return
      const index = cursor
      cursor += 1
      const bookmark = bookmarks[index]
      const status = await checkUrl(bookmark.url, timeoutMs)
      results.push({ id: bookmark.id, url: bookmark.url, status })
      done += 1
      _optionalChain([onProgress, 'optionalCall', _2 => _2(done, bookmarks.length)])
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
export async function ensureLinkCheckPermission() {
  try {
    return await chrome.permissions.request({ origins: ['<all_urls>'] })
  } catch {
    return false
  }
}
