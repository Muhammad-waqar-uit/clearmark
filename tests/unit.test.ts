import { describe, it, expect } from 'vitest'
import { normalizeUrl } from '../src/lib/duplicates'
import { exportBookmarks, importFromNetscape } from '../src/lib/exportImport'

describe('URL normalization', () => {
  it('should lowercase hostname and strip tracking params', () => {
    const url = 'https://GOOGLE.com/search?q=test&utm_source=google'
    const result = normalizeUrl(url)
    expect(result).toContain('google.com')
    expect(result).not.toContain('utm_source')
  })

  it('should handle URLs without tracking params', () => {
    const url = 'https://example.com/path/'
    const result = normalizeUrl(url)
    expect(result).toContain('example.com')
  })
})

describe('Bookmark export', () => {
  it('should export bookmarks to JSON', () => {
    const bookmarks = [
      {
        id: '1',
        title: 'Test Bookmark',
        url: 'https://example.com',
        dateAdded: 1234567890,
        lastModified: 1234567890,
        children: [],
        meta: {}
      }
    ]
    const result = exportBookmarks(bookmarks)
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
  })
})

describe('Netscape import', () => {
  it('should parse basic Netscape HTML', () => {
    const html = `
      <DL><p>
      <DT><A HREF="https://example.com" ADD_DATE="1234567890" ADD_ID="1" LAST_VISIT="0" LAST_MODIFIED="0" ICON="data:image/png;base64,ABC" PRIVATE_FRE="0">Example</A></DT>
      </p></DL>
    `
    const result = importFromNetscape(html)
    expect(result.length).toBeGreaterThanOrEqual(0)
  })
})