 function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }import { describe, expect, it } from 'vitest'
import { extrasKeepingOldest, findDuplicates, normalizeUrl } from '../src/lib/duplicates'
import { findEmptyFolders } from '../src/lib/emptyFolders'
import { flattenBookmarks, flattenFolders, folderScope } from '../src/lib/bookmarks'
import { classifyStatus } from '../src/lib/linkcheck'
import { filterBookmarks, sortBookmarks } from '../src/manager/filters'


function bookmark(overrides) {
  return {
    title: _nullishCoalesce(overrides.title, () => ( overrides.url)),
    parentId: '1',
    folderPath: '',
    folderPathIds: [],
    dateAdded: 1700000000000,
    ...overrides,
  }
}

function treeNode(
  overrides
) {
  return { title: '', ...overrides }
}

describe('normalizeUrl', () => {
  it('lowercases the host, drops www and tracking parameters', () => {
    const result = normalizeUrl('https://WWW.Example.com/Path/?utm_source=news&b=2&a=1#top')
    expect(result).toBe('https://example.com/Path?b=2&a=1')
  })

  it('removes a trailing slash and treats http like https', () => {
    expect(normalizeUrl('http://example.com/')).toBe('https://example.com/')
    expect(normalizeUrl('https://example.com/docs/')).toBe('https://example.com/docs')
  })

  it('keeps distinct paths apart and survives invalid input', () => {
    expect(normalizeUrl('https://example.com/a')).not.toBe(normalizeUrl('https://example.com/b'))
    expect(normalizeUrl('not a url')).toBe('not a url')
  })
})

describe('findDuplicates', () => {
  it('groups bookmarks that differ only by tracking noise', () => {
    const groups = findDuplicates([
      bookmark({ id: '1', url: 'https://example.com/page?utm_source=a', dateAdded: 30 }),
      bookmark({ id: '2', url: 'https://www.example.com/page/', dateAdded: 10 }),
      bookmark({ id: '3', url: 'https://other.test/', dateAdded: 20 }),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0].bookmarks.map((item) => item.id)).toEqual(['2', '1'])
    expect(extrasKeepingOldest(groups[0])).toEqual(['1'])
  })

  it('returns nothing when every URL is unique', () => {
    const groups = findDuplicates([
      bookmark({ id: '1', url: 'https://a.test/' }),
      bookmark({ id: '2', url: 'https://b.test/' }),
    ])
    expect(groups).toEqual([])
  })
})

describe('flattenBookmarks and flattenFolders', () => {
  const tree = [
    treeNode({
      id: '0',
      children: [
        treeNode({
          id: '1',
          title: 'Bookmarks bar',
          parentId: '0',
          children: [
            treeNode({ id: '10', title: 'Work', parentId: '1', children: [
              treeNode({ id: '100', title: 'Docs', url: 'https://docs.test', parentId: '10', dateAdded: 5 }),
            ] }),
          ],
        }),
      ],
    }),
  ]

  it('records the folder path for each bookmark', () => {
    const [entry] = flattenBookmarks(tree)
    expect(entry.title).toBe('Docs')
    expect(entry.folderPath).toBe('Bookmarks bar / Work')
    expect(entry.folderPathIds).toEqual(['1', '10'])
  })

  it('lists folders with depth and excludes the invisible root', () => {
    const folders = flattenFolders(tree)
    expect(folders.map((folder) => folder.title)).toEqual(['Bookmarks bar', 'Work'])
    expect(folders[1].depth).toBe(1)
  })

  it('scopes a folder selection to its descendants', () => {
    const folders = flattenFolders(tree)
    expect([...folderScope(folders, '1')].sort()).toEqual(['1', '10'])
    expect([...folderScope(folders, '10')]).toEqual(['10'])
  })
})

describe('findEmptyFolders', () => {
  it('skips built-in top-level folders and their non-empty children', () => {
    const tree = [
      treeNode({
        id: '0',
        children: [
          treeNode({
            id: '1',
            title: 'Bookmarks bar',
            parentId: '0',
            children: [
              treeNode({ id: '10', title: 'Empty', parentId: '1', children: [] }),
              treeNode({ id: '11', title: 'Full', parentId: '1', children: [
                treeNode({ id: '110', title: 'Site', url: 'https://a.test', parentId: '11' }),
              ] }),
            ],
          }),
          treeNode({ id: '2', title: 'Other bookmarks', parentId: '0', children: [] }),
        ],
      }),
    ]

    const empty = findEmptyFolders(tree)
    expect(empty.map((folder) => folder.id)).toEqual(['10'])
    expect(empty[0].path).toBe('Bookmarks bar / Empty')
  })
})

describe('classifyStatus', () => {
  it('maps HTTP codes onto link states', () => {
    expect(classifyStatus(200)).toBe('ok')
    expect(classifyStatus(204)).toBe('ok')
    expect(classifyStatus(301)).toBe('redirected')
    expect(classifyStatus(404)).toBe('broken')
    expect(classifyStatus(500)).toBe('broken')
  })
})

describe('filterBookmarks and sortBookmarks', () => {
  const now = 1700000000000
  const items = [
    { ...bookmark({ id: '1', title: 'Alpha', url: 'https://alpha.test/a', dateAdded: now }), meta: { tags: ['work'] } },
    { ...bookmark({ id: '2', title: 'Beta', url: 'https://beta.test/b', dateAdded: now - 10 * 86400000, folderPath: 'Reading' }), meta: { tags: [] } },
    { ...bookmark({ id: '3', title: 'Gamma', url: 'https://gamma.test/c', dateAdded: now - 40 * 86400000 }), meta: { tags: [], note: 'later' } },
  ]

  it('matches title, url, folder, tag and note text', () => {
    expect(filterBookmarks(items, { query: 'alpha', domain: '', tag: '', date: 'any', scope: null, now }).map((item) => item.id)).toEqual(['1'])
    expect(filterBookmarks(items, { query: 'reading', domain: '', tag: '', date: 'any', scope: null, now }).map((item) => item.id)).toEqual(['2'])
    expect(filterBookmarks(items, { query: '', domain: '', tag: 'work', date: 'any', scope: null, now }).map((item) => item.id)).toEqual(['1'])
    expect(filterBookmarks(items, { query: '', domain: 'gamma.test', tag: '', date: 'any', scope: null, now }).map((item) => item.id)).toEqual(['3'])
  })

  it('filters by age and folder scope', () => {
    const recent = filterBookmarks(items, { query: '', domain: '', tag: '', date: '7', scope: null, now })
    expect(recent.map((item) => item.id)).toEqual(['1'])

    const scoped = filterBookmarks(items, {
      query: '',
      domain: '',
      tag: '',
      date: 'any',
      scope: new Set(['missing']),
      now,
    })
    expect(scoped).toEqual([])
  })

  it('sorts without mutating the input', () => {
    const sorted = sortBookmarks(items, 'title')
    expect(sorted.map((item) => item.title)).toEqual(['Alpha', 'Beta', 'Gamma'])
    expect(items[0].title).toBe('Alpha')
    expect(sortBookmarks(items, 'dateAdded').map((item) => item.id)).toEqual(['1', '2', '3'])
  })
})

describe('folder tree typing', () => {
  it('keeps nested folder nodes', () => {
    const nodes = [{ id: '1', title: 'Bar', children: [{ id: '2', title: 'Work', children: [] }] }]
    expect(nodes[0].children[0].title).toBe('Work')
  })
})
