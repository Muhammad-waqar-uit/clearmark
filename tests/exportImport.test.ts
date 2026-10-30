import { describe, expect, it } from 'vitest'
import {
  exportToHtml,
  exportToJson,
  importedFolderName,
  parseBackup,
  parseJsonBackup,
  parseNetscapeHtml,
  summarizeImport,
} from '../src/lib/exportImport'
import { parseExtensionId, parseWantedList, wantedToJson } from '../src/lib/extensions'
import type { FlatBookmark, FlatFolder } from '../src/lib/types'

const CHROME_EXPORT = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="1700000000" LAST_MODIFIED="1700000000">Work</H3>
    <DL><p>
        <DT><A HREF="https://example.com/a?utm_source=feed" ADD_DATE="1700000000">Example A</A>
        <DT><H3>Nested</H3>
        <DL><p>
            <DT><A HREF="https://example.com/b">Example B</A>
        </DL><p>
    </DL><p>
    <DT><A HREF="https://example.com/top">Top level</A>
</DL><p>
`

function folder(overrides: Partial<FlatFolder> & { id: string; title: string }): FlatFolder {
  return {
    parentId: '0',
    depth: 0,
    path: overrides.title,
    pathIds: [overrides.id],
    ...overrides,
  }
}

function bookmark(
  overrides: Partial<FlatBookmark> & { id: string; title: string; url: string }
): FlatBookmark {
  return {
    parentId: '1',
    folderPath: 'Bookmarks bar',
    folderPathIds: ['1'],
    dateAdded: 1_700_000_000_000,
    ...overrides,
  }
}

describe('parseNetscapeHtml', () => {
  it('reads folders, nested folders and bookmarks', () => {
    const root = parseNetscapeHtml(CHROME_EXPORT)

    expect(root.children).toHaveLength(2)
    const work = root.children?.[0]
    expect(work?.title).toBe('Work')
    expect(work?.children?.map((child) => child.title)).toEqual(['Example A', 'Nested'])

    const nested = work?.children?.[1]
    expect(nested?.children?.[0]).toEqual({
      title: 'Example B',
      url: 'https://example.com/b',
    })
    expect(root.children?.[1]).toEqual({ title: 'Top level', url: 'https://example.com/top' })
  })

  it('summarizes the parsed tree', () => {
    expect(summarizeImport(parseNetscapeHtml(CHROME_EXPORT))).toEqual({ bookmarks: 3, folders: 2 })
  })

  it('rejects files without a bookmark list', () => {
    expect(() => parseNetscapeHtml('<p>nope</p>')).toThrow(/bookmark list/i)
  })
})

describe('exportToHtml', () => {
  const folders = [
    folder({ id: '1', title: 'Bookmarks bar' }),
    folder({ id: '10', title: 'Work & Play', parentId: '1', depth: 1, path: 'Bookmarks bar / Work & Play', pathIds: ['1', '10'] }),
  ]
  const bookmarks = [
    bookmark({ id: '100', title: 'Edge <case>', url: 'https://example.com/?q="1"', parentId: '10', folderPath: 'Bookmarks bar / Work & Play', folderPathIds: ['1', '10'] }),
  ]

  it('escapes markup and keeps the folder structure', () => {
    const html = exportToHtml(folders, bookmarks, {})
    expect(html).toContain('<!DOCTYPE NETSCAPE-Bookmark-file-1>')
    expect(html).toContain('Work &amp; Play')
    expect(html).toContain('Edge &lt;case&gt;')
    expect(html).toContain('HREF="https://example.com/?q=&quot;1&quot;"')
  })

  it('round-trips through the parser', () => {
    const html = exportToHtml(folders, bookmarks, {})
    const parsed = parseNetscapeHtml(html)
    expect(summarizeImport(parsed)).toEqual({ bookmarks: 1, folders: 2 })
    const work = parsed.children?.[0].children?.[0]
    expect(work?.title).toBe('Work & Play')
  })
})

describe('JSON export and import', () => {
  it('includes tags, notes and folder paths', () => {
    const json = exportToJson(
      [
        bookmark({ id: '100', title: 'Docs', url: 'https://docs.test', parentId: '10', folderPath: 'Bookmarks bar / Work', folderPathIds: ['1', '10'] }),
      ],
      { '100': { tags: ['work', 'docs'], note: 'read later' } },
      1_700_000_000_000
    )
    const data = JSON.parse(json) as {
      app: string
      bookmarks: Array<{ title: string; folder: string; tags: string[]; note: string }>
    }

    expect(data.app).toBe('clearmark')
    expect(data.bookmarks[0]).toMatchObject({
      title: 'Docs',
      folder: 'Bookmarks bar / Work',
      tags: ['work', 'docs'],
      note: 'read later',
    })
  })

  it('rebuilds the folder nesting on parse', () => {
    const json = exportToJson(
      [
        bookmark({ id: '100', title: 'Docs', url: 'https://docs.test', parentId: '10', folderPath: 'Work / Deep', folderPathIds: ['1', '10'] }),
        bookmark({ id: '101', title: 'Home', url: 'https://home.test', folderPath: '', folderPathIds: [] }),
      ],
      {}
    )
    const root = parseJsonBackup(json)
    expect(root.children).toHaveLength(2)

    const work = root.children?.[0]
    expect(work?.title).toBe('Work')
    expect(work?.children?.[0].title).toBe('Deep')
    expect(work?.children?.[0].children?.[0].url).toBe('https://docs.test')
    expect(root.children?.[1].url).toBe('https://home.test')
  })

  it('rejects invalid backups', () => {
    expect(() => parseJsonBackup('{')).toThrow(/not valid JSON/i)
    expect(() => parseJsonBackup('{"bookmarks": "nope"}')).toThrow(/Expected "bookmarks"/i)
    expect(() => parseJsonBackup('{"bookmarks": []}')).toThrow(/does not contain any bookmarks/i)
  })

  it('detects the format from the file name and content', () => {
    expect(parseBackup(CHROME_EXPORT).children).toHaveLength(2)
    expect(parseBackup('{"bookmarks":[{"title":"X","url":"https://x.test"}]}').children).toHaveLength(1)
  })

  it('names the import folder by date', () => {
    expect(importedFolderName(new Date('2026-10-30T12:00:00Z'))).toBe('Imported 2026-10-30')
  })
})

describe('extension list helpers', () => {
  it('accepts ids and store links', () => {
    const id = 'abcdefghijklmnopabcdefghijklmnop'
    expect(parseExtensionId(id)).toBe(id)
    expect(parseExtensionId(`https://chromewebstore.google.com/detail/some-name/${id}?hl=en`)).toBe(id)
    expect(parseExtensionId('not-an-id')).toBeNull()
    expect(parseExtensionId('')).toBeNull()
  })

  it('parses plain text and JSON lists, de-duplicated', () => {
    const id = 'abcdefghijklmnopabcdefghijklmnop'
    const fromText = parseWantedList(`${id}\n${id}\n junk`)
    expect(fromText).toHaveLength(1)
    expect(fromText[0].id).toBe(id)

    const fromJson = parseWantedList(wantedToJson(fromText))
    expect(fromJson.map((entry) => entry.id)).toEqual([id])
  })
})
