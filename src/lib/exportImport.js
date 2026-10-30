 function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

/** A folder-or-bookmark tree produced by parsing a backup file. */
 










const TRACKING_NOTE = 'Exported by Clearmark'

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Count bookmarks and folders in a parsed import. */
export function summarizeImport(node) {
  const summary = { bookmarks: 0, folders: 0 }
  const walk = (current) => {
    for (const child of _nullishCoalesce(current.children, () => ( []))) {
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
  node,
  predicate
) {
  return {
    ...node,
    children: (_nullishCoalesce(node.children, () => ( [])))
      .filter((child) => child.url === undefined || predicate(child))
      .map((child) => filterImport(child, predicate)),
  }
}

function emptyRoot(title = 'Imported bookmarks') {
  return { title, children: [] }
}

/**
 * JSON export. Flat list keeps the folder path so a re-import can rebuild the
 * same structure, and tags/notes travel with each bookmark.
 */
export function exportToJson(
  bookmarks,
  meta,
  exportedAt = Date.now()
) {
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
          tags: _nullishCoalesce(_optionalChain([entry, 'optionalAccess', _ => _.tags]), () => ( [])),
          note: _nullishCoalesce(_optionalChain([entry, 'optionalAccess', _2 => _2.note]), () => ( '')),
          dateAdded: bookmark.dateAdded,
        }
      }),
    },
    null,
    2
  )
}









/** Parse a Clearmark JSON backup into a folder tree. Throws on invalid input. */
export function parseJsonBackup(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('This file is not valid JSON.')
  }

  const entries = Array.isArray(data)
    ? (data )
    : _optionalChain([(data ), 'optionalAccess', _3 => _3.bookmarks])

  if (!Array.isArray(entries)) {
    throw new Error('No bookmark list found in this file. Expected "bookmarks".')
  }

  const root = emptyRoot()
  let usable = 0

  for (const entry of entries ) {
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
      const children = _nullishCoalesce(cursor.children, () => ( []))
      const existing = children.find((child) => child.url === undefined && child.title === part)
      if (existing) {
        cursor = existing
        continue
      }
      const created = { title: part, children: [] }
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
  folders,
  bookmarks,
  meta,
  exportedAt = Date.now()
) {
  const folderIds = new Set(folders.map((folder) => folder.id))
  const childFolders = new Map()
  const childBookmarks = new Map()

  for (const folder of folders) {
    const key = folderIds.has(folder.parentId) ? folder.parentId : ''
    const list = _nullishCoalesce(childFolders.get(key), () => ( []))
    list.push(folder)
    childFolders.set(key, list)
  }
  for (const bookmark of bookmarks) {
    const key = folderIds.has(bookmark.parentId) ? bookmark.parentId : ''
    const list = _nullishCoalesce(childBookmarks.get(key), () => ( []))
    list.push(bookmark)
    childBookmarks.set(key, list)
  }

  const lines = [
    '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
    '<!-- This is an automatically generated file.',
    `     ${TRACKING_NOTE} on ${new Date(exportedAt).toISOString().slice(0, 10)}.`,
    '     It can be read and imported by Chrome, Firefox and Edge. -->',
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    '<TITLE>Bookmarks</TITLE>',
    '<H1>Bookmarks</H1>',
    '<DL><p>',
  ]

  const renderBookmark = (bookmark, depth) => {
    const pad = '    '.repeat(depth)
    const tags = _nullishCoalesce(_optionalChain([meta, 'access', _4 => _4[bookmark.id], 'optionalAccess', _5 => _5.tags]), () => ( []))
    const tagAttribute = tags.length > 0 ? ` TAGS="${escapeHtml(tags.join(','))}"` : ''
    lines.push(
      `${pad}<DT><A HREF="${escapeHtml(bookmark.url)}" ADD_DATE="${Math.floor(
        bookmark.dateAdded / 1000
      )}"${tagAttribute}>${escapeHtml(bookmark.title)}</A>`
    )
  }

  const selected = new Set()
  const renderFolder = (folder, depth) => {
    if (selected.has(folder.id)) return
    selected.add(folder.id)
    const pad = '    '.repeat(depth)
    const nestedFolders = (_nullishCoalesce(childFolders.get(folder.id), () => ( []))).filter(
      (child) => !selected.has(child.id)
    )
    const nestedBookmarks = _nullishCoalesce(childBookmarks.get(folder.id), () => ( []))
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

  for (const folder of _nullishCoalesce(childFolders.get(''), () => ( []))) renderFolder(folder, 1)
  for (const bookmark of _nullishCoalesce(childBookmarks.get(''), () => ( []))) renderBookmark(bookmark, 1)

  lines.push('</DL><p>')
  return lines.join('\n')
}

function walkNetscapeList(list, parent) {
  for (const child of Array.from(list.children)) {
    if (child.tagName !== 'DT') continue
    const parts = Array.from(child.children)
    const heading = parts.find((part) => part.tagName === 'H3')
    const link = parts.find((part) => part.tagName === 'A')
    const sublist = parts.find((part) => part.tagName === 'DL')

    if (heading) {
      const folder = {
        title: _optionalChain([heading, 'access', _6 => _6.textContent, 'optionalAccess', _7 => _7.trim, 'call', _8 => _8()]) || 'Untitled folder',
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
        title: _optionalChain([link, 'access', _9 => _9.textContent, 'optionalAccess', _10 => _10.trim, 'call', _11 => _11()]) || url,
        url,
      })
    }
  }
}

/** Parse a Netscape bookmark HTML export into a folder tree. */
export function parseNetscapeHtml(html) {
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
export function parseBackup(text, fileName = '') {
  const looksLikeHtml =
    /<!DOCTYPE NETSCAPE-Bookmark-file/i.test(text) ||
    /<DL>/i.test(text) ||
    fileName.toLowerCase().endsWith('.html') ||
    fileName.toLowerCase().endsWith('.htm')
  return looksLikeHtml ? parseNetscapeHtml(text) : parseJsonBackup(text)
}

/** "Imported 2026-10-30" style folder name for imports. */
export function importedFolderName(date = new Date()) {
  const iso = date.toISOString().slice(0, 10)
  return `Imported ${iso}`
}
