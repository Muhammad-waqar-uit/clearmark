/** Check a single URL for dead/live status */
export async function checkUrl(url: string, timeoutMs: number = 8000): Promise<'ok' | 'redirected' | 'broken'> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'Clearmark/0.1.0' }
    })
    
    clearTimeout(timeoutId)
    
    if (response.status >= 200 && response.status < 400) {
      return 'ok'
    } else if (response.status >= 300 && response.status < 400) {
      return 'redirected'
    } else {
      return 'broken'
    }
  } catch {
    return 'broken'
  }
}

/** Check multiple URLs with limited concurrency */
export async function checkUrlsConcurrently(
  urls: string[],
  concurrency: number = 5,
  timeoutMs: number = 8000
): Promise<Array<{ url: string; status: 'ok' | 'redirected' | 'broken' }>> {
  const results: Array<{ url: string; status: 'ok' | 'redirected' | 'broken' }> = []
  
  function* idGenerator() {
    let i = 0
    while (true) { yield i++ }
  }
  const gen = idGenerator()
  
  const running: Promise<void>[] = []
  
  while (urls.length > 0) {
    const nextIndex = gen.next().value
    const url = urls.shift()
    if (!url) break
    
    const promise = (async () => {
      const status = await checkUrl(url, timeoutMs)
      results.push({ url, status })
    })()
    
    running.push(promise)
    
    // Limit concurrency
    if (running.length >= concurrency) {
      await Promise.race(running)
      running.splice(0, 1) // remove the completed promise
    }
  }
  
  await Promise.all(running)
  return results
}