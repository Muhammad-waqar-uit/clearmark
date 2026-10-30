 function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import { describe, expect, it } from 'vitest'
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

function folder(overrides) {
  return {
    parentId: '0',
    depth: 0,
    path: overrides.title,
    pathIds: [overrides.id],
    ...overrides,
  }
}

function bookmark(
  overrides
) {
  return {
    parentId: '1',
    folderPath: 'Bookmarks bar',
    folderPathIds: ['1'],
    dateAdded: 1700000000000,
    ...overrides,
  }
}

describe('parseNetscapeHtml', () => {
  it('reads folders, nested folders and bookmarks', () => {
    const root = parseNetscapeHtml(CHROME_EXPORT)

    expect(root.children).toHaveLength(2)
    const work = _optionalChain([root, 'access', _ => _.children, 'optionalAccess', _2 => _2[0]])
    expect(_optionalChain([work, 'optionalAccess', _3 => _3.title])).toBe('Work')
    expect(_optionalChain([work, 'optionalAccess', _4 => _4.children, 'optionalAccess', _5 => _5.map, 'call', _6 => _6((child) => child.title)])).toEqual(['Example A', 'Nested'])

    const nested = _optionalChain([work, 'optionalAccess', _7 => _7.children, 'optionalAccess', _8 => _8[1]])
    expect(_optionalChain([nested, 'optionalAccess', _9 => _9.children, 'optionalAccess', _10 => _10[0]])).toEqual({
      title: 'Example B',
      url: 'https://example.com/b',
    })
    expect(_optionalChain([root, 'access', _11 => _11.children, 'optionalAccess', _12 => _12[1]])).toEqual({ title: 'Top level', url: 'https://example.com/top' })
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
    const work = _optionalChain([parsed, 'access', _13 => _13.children, 'optionalAccess', _14 => _14[0], 'access', _15 => _15.children, 'optionalAccess', _16 => _16[0]])
    expect(_optionalChain([work, 'optionalAccess', _17 => _17.title])).toBe('Work & Play')
  })
})

describe('JSON export and import', () => {
  it('includes tags, notes and folder paths', () => {
    const json = exportToJson(
      [
        bookmark({ id: '100', title: 'Docs', url: 'https://docs.test', parentId: '10', folderPath: 'Bookmarks bar / Work', folderPathIds: ['1', '10'] }),
      ],
      { '100': { tags: ['work', 'docs'], note: 'read later' } },
      1700000000000
    )
    const data = JSON.parse(json) 




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

    const work = _optionalChain([root, 'access', _18 => _18.children, 'optionalAccess', _19 => _19[0]])
    expect(_optionalChain([work, 'optionalAccess', _20 => _20.title])).toBe('Work')
    expect(_optionalChain([work, 'optionalAccess', _21 => _21.children, 'optionalAccess', _22 => _22[0], 'access', _23 => _23.title])).toBe('Deep')
    expect(_optionalChain([work, 'optionalAccess', _24 => _24.children, 'optionalAccess', _25 => _25[0], 'access', _26 => _26.children, 'optionalAccess', _27 => _27[0], 'access', _28 => _28.url])).toBe('https://docs.test')
    expect(_optionalChain([root, 'access', _29 => _29.children, 'optionalAccess', _30 => _30[1], 'access', _31 => _31.url])).toBe('https://home.test')
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
