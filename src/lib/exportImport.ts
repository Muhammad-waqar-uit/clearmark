import type { BookmarkMeta, FlatBookmark, FlatFolder } from './types'

/** A folder-or-bookmark tree produced by parsing a backup file. */
export type ImportNode = {
  title: string
  url?: string
  children?: ImportNode[]
}

export type ImportSummary = {
  bookmarks: number
  folders: number
}

const TRACKING_NOTE = 'Exported by Clearmark'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Count bookmarks and folders in a parsed import. */
export function summarizeImport(node: ImportNode): ImportSummary {
  const summary: ImportSummary = { bookmarks: 0, folders: 0 }
  const walk = (current: ImportNode): void => {
    for (const child of current.children ?? []) {
      if (child.url) summary.bookmarks += 1
      else {
        summary.folders += 1
        walk(child)
      }
    }
  }
  walk(node)
  return summary
}

/** Recursively filter an import tree (used to drop duplicates on import). */
export function filterImport(
  node: ImportNode,
  predicate: (node: ImportNode) => boolean
): ImportNode {
  return {
    ...node,
    children: (node.children ?? [])
      .filter((child) => child.url === undefined || predicate(child))
      .map((child) => filterImport(child, predicate)),
  }
}

function emptyRoot(title = 'Imported bookmarks'): ImportNode {
  return { title, children: [] }
}

/**
 * JSON export. Flat list keeps the folder path so a re-import can rebuild the
 * same structure, and tags/notes travel with each bookmark.
 */
export function exportToJson(
  bookmarks: FlatBookmark[],
  meta: Record<string, BookmarkMeta>,
  exportedAt: number = Date.now()
): string {
  return JSON.stringify(
    {
      app: 'clearmark',
      version: 1,
      exportedAt: new Date(exportedAt).toISOString(),
      bookmarks: bookmarks.map((bookmark) => {
        const entry = meta[bookmark.id]
        return {
          title: bookmark.title,
          url: bookmark.url,
          folder: bookmark.folderPath,
          tags: entry?.tags ?? [],
          note: entry?.note ?? '',
          dateAdded: bookmark.dateAdded,
        }
      }),
    },
    null,
    2
  )
}

type JsonBackupEntry = {
  title?: unknown
  url?: unknown
  folder?: unknown
  tags?: unknown
  note?: unknown
}

/** Parse a Clearmark JSON backup into a folder tree. Throws on invalid input. */
export function parseJsonBackup(text: string): ImportNode {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('This file is not valid JSON.')
  }

  const entries = Array.isArray(data)
    ? (data as JsonBackupEntry[])
    : (data as { bookmarks?: unknown })?.bookmarks

  if (!Array.isArray(entries)) {
    throw new Error('No bookmark list found in this file. Expected "bookmarks".')
  }

  const root = emptyRoot()
  let usable = 0

  for (const entry of entries as JsonBackupEntry[]) {
    if (typeof entry !== 'object' || entry === null) continue
    const url = typeof entry.url === 'string' ? entry.url.trim() : ''
    if (!url) continue
    usable += 1

    const title = typeof entry.title === 'string' && entry.title.trim() ? entry.title.trim() : url
    const folder = typeof entry.folder === 'string' ? entry.folder : ''
    const parts = folder
      .split(' / ')
      .map((part) => part.trim())
      .filter(Boolean)

    let cursor = root
    for (const part of parts) {
      const children = cursor.children ?? []
      const existing = children.find((child) => child.url === undefined && child.title === part)
      if (existing) {
        cursor = existing
        continue
      }
      const created: ImportNode = { title: part, children: [] }
      children.push(created)
      cursor.children = children
      cursor = created
    }

    cursor.children ??= []
    cursor.children.push({ title, url })
  }

  if (usable === 0) throw new Error('This backup does not contain any bookmarks.')
  return root
}

/** Renders a bookmark tree in the standard Netscape bookmark file format. */
export function exportToHtml(
  folders: FlatFolder[],
  bookmarks: FlatBookmark[],
  meta: Record<string, BookmarkMeta>,
  exportedAt: number = Date.now()
): string {
  const folderIds = new Set(folders.map((folder) => folder.id))
  const childFolders = new Map<string, FlatFolder[]>()
  const childBookmarks = new Map<string, FlatBookmark[]>()

  for (const folder of folders) {
    const key = folderIds.has(folder.parentId) ? folder.parentId : ''
    const list = childFolders.get(key) ?? []
    list.push(folder)
    childFolders.set(key, list)
  }
  for (const bookmark of bookmarks) {
    const key = folderIds.has(bookmark.parentId) ? bookmark.parentId : ''
    const list = childBookmarks.get(key) ?? []
    list.push(bookmark)
    childBookmarks.set(key, list)
  }

  const lines: string[] = [
    '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
    '<!-- This is an automatically generated file.',
    `     ${TRACKING_NOTE} on ${new Date(exportedAt).toISOString().slice(0, 10)}.`,
    '     It can be read and imported by Chrome, Firefox and Edge. -->',
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    '<TITLE>Bookmarks</TITLE>',
    '<H1>Bookmarks</H1>',
    '<DL><p>',
  ]

  const renderBookmark = (bookmark: FlatBookmark, depth: number): void => {
    const pad = '    '.repeat(depth)
    const tags = meta[bookmark.id]?.tags ?? []
    const tagAttribute = tags.length > 0 ? ` TAGS="${escapeHtml(tags.join(','))}"` : ''
    lines.push(
      `${pad}<DT><A HREF="${escapeHtml(bookmark.url)}" ADD_DATE="${Math.floor(
        bookmark.dateAdded / 1000
      )}"${tagAttribute}>${escapeHtml(bookmark.title)}</A>`
    )
  }

  const selected = new Set<string>()
  const renderFolder = (folder: FlatFolder, depth: number): void => {
    if (selected.has(folder.id)) return
    selected.add(folder.id)
    const pad = '    '.repeat(depth)
    const nestedFolders = (childFolders.get(folder.id) ?? []).filter(
      (child) => !selected.has(child.id)
    )
    const nestedBookmarks = childBookmarks.get(folder.id) ?? []
    if (nestedBookmarks.length === 0 && nestedFolders.length === 0) {
      lines.push(`${pad}<DT><H3>${escapeHtml(folder.title)}</H3>`)
      lines.push(`${pad}<DL><p>`)
      lines.push(`${pad}</DL><p>`)
      return
    }
    lines.push(`${pad}<DT><H3>${escapeHtml(folder.title)}</H3>`)
    lines.push(`${pad}<DL><p>`)
    for (const child of nestedFolders) renderFolder(child, depth + 1)
    for (const bookmark of nestedBookmarks) renderBookmark(bookmark, depth + 1)
    lines.push(`${pad}</DL><p>`)
  }

  for (const folder of childFolders.get('') ?? []) renderFolder(folder, 1)
  for (const bookmark of childBookmarks.get('') ?? []) renderBookmark(bookmark, 1)

  lines.push('</DL><p>')
  return lines.join('\n')
}

function walkNetscapeList(list: Element, parent: ImportNode): void {
  for (const child of Array.from(list.children)) {
    if (child.tagName !== 'DT') continue
    const parts = Array.from(child.children)
    const heading = parts.find((part) => part.tagName === 'H3')
    const link = parts.find((part) => part.tagName === 'A')
    const sublist = parts.find((part) => part.tagName === 'DL')

    if (heading) {
      const folder: ImportNode = {
        title: heading.textContent?.trim() || 'Untitled folder',
        children: [],
      }
      parent.children ??= []
      parent.children.push(folder)
      if (sublist) walkNetscapeList(sublist, folder)
      continue
    }

    if (link) {
      const url = link.getAttribute('href')
      if (!url) continue
      parent.children ??= []
      parent.children.push({
        title: link.textContent?.trim() || url,
        url,
      })
    }
  }
}

/** Parse a Netscape bookmark HTML export into a folder tree. */
export function parseNetscapeHtml(html: string): ImportNode {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const list = doc.querySelector('dl')
  if (!list) throw new Error('No bookmark list found in this file.')

  const root = emptyRoot()
  walkNetscapeList(list, root)
  const summary = summarizeImport(root)
  if (summary.bookmarks === 0) throw new Error('This file does not contain any bookmarks.')
  return root
}

/** Detect JSON vs Netscape HTML and parse the matching format. */
export function parseBackup(text: string, fileName = ''): ImportNode {
  const looksLikeHtml =
    /<!DOCTYPE NETSCAPE-Bookmark-file/i.test(text) ||
    /<DL>/i.test(text) ||
    fileName.toLowerCase().endsWith('.html') ||
    fileName.toLowerCase().endsWith('.htm')
  return looksLikeHtml ? parseNetscapeHtml(text) : parseJsonBackup(text)
}

/** "Imported 2026-10-30" style folder name for imports. */
export function importedFolderName(date: Date = new Date()): string {
  const iso = date.toISOString().slice(0, 10)
  return `Imported ${iso}`
}
