 function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } async function _asyncNullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return await rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

/** Read the full browser bookmark tree. */
export function getBookmarkTree() {
  return chrome.bookmarks.getTree()
}

/** The id of the folder new items should go into by default (Bookmarks Bar). */
export async function getDefaultParentId() {
  const tree = await getBookmarkTree()
  const root = tree[0]
  const bookmarksBar = _optionalChain([root, 'optionalAccess', _ => _.children, 'optionalAccess', _2 => _2.find, 'call', _3 => _3((node) => node.id === '1')])
  return _nullishCoalesce(_nullishCoalesce(_nullishCoalesce(_optionalChain([bookmarksBar, 'optionalAccess', _4 => _4.id]), () => ( _optionalChain([root, 'optionalAccess', _5 => _5.children, 'optionalAccess', _6 => _6[0], 'optionalAccess', _7 => _7.id]))), () => ( _optionalChain([root, 'optionalAccess', _8 => _8.id]))), () => ( '1'))
}

/** Flatten the tree into bookmark leaves with their folder path. */
export function flattenBookmarks(tree) {
  const result = []

  const walk = (
    nodes,
    path,
    pathIds
  ) => {
    for (const node of nodes) {
      if (node.url) {
        result.push({
          id: node.id,
          title: node.title || node.url,
          url: node.url,
          parentId: _nullishCoalesce(node.parentId, () => ( '')),
          folderPath: path.join(' / '),
          folderPathIds: pathIds,
          dateAdded: _nullishCoalesce(node.dateAdded, () => ( 0)),
        })
        continue
      }

      if (!node.children) continue
      const isRoot = !node.parentId
      walk(
        node.children,
        isRoot || !node.title ? path : [...path, node.title],
        isRoot ? pathIds : [...pathIds, node.id]
      )
    }
  }

  walk(tree, [], [])
  return result
}

/** Flatten the tree into folders, excluding the invisible root node. */
export function flattenFolders(tree) {
  const result = []

  const walk = (
    nodes,
    path,
    pathIds,
    depth
  ) => {
    for (const node of nodes) {
      if (node.url) continue
      if (!node.parentId) {
        walk(_nullishCoalesce(node.children, () => ( [])), path, pathIds, depth)
        continue
      }

      const nextPath = [...path, node.title || 'Untitled folder']
      const nextIds = [...pathIds, node.id]
      result.push({
        id: node.id,
        title: node.title || 'Untitled folder',
        parentId: node.parentId,
        depth,
        path: nextPath.join(' / '),
        pathIds: nextIds,
      })
      walk(_nullishCoalesce(node.children, () => ( [])), nextPath, nextIds, depth + 1)
    }
  }

  walk(tree, [], [], 0)
  return result
}

/** Build the nested folder-only tree used by the folder sidebar. */
export function buildFolderTree(tree) {
  const build = (nodes) =>
    nodes
      .filter((node) => !node.url)
      .map((node) => ({
        id: node.id,
        title: node.title || 'Untitled folder',
        children: build(_nullishCoalesce(node.children, () => ( []))),
      }))

  const root = tree[0]
  return build(root && !root.parentId ? _nullishCoalesce(root.children, () => ( [])) : tree)
}

/** Count bookmarks per folder, including all nested folders. */
export function countBookmarksByFolder(bookmarks) {
  const counts = {}
  for (const bookmark of bookmarks) {
    for (const id of bookmark.folderPathIds) {
      counts[id] = (_nullishCoalesce(counts[id], () => ( 0))) + 1
    }
  }
  return counts
}

/** Folder ids a bookmark can live in to be visible when `folderId` is selected. */
export function folderScope(folders, folderId) {
  const scope = new Set([folderId])
  const walk = (parentId) => {
    for (const folder of folders) {
      if (folder.parentId === parentId && !scope.has(folder.id)) {
        scope.add(folder.id)
        walk(folder.id)
      }
    }
  }
  walk(folderId)
  return scope
}

/** A bookmark or folder serialised so it can be recreated later (undo, backup). */
 











function toSnapshot(node) {
  if (node.url) return { title: node.title, url: node.url }
  return {
    title: node.title,
    children: (_nullishCoalesce(node.children, () => ( []))).map(toSnapshot),
  }
}

/** Capture a bookmark or folder (with everything inside it) before deletion. */
export async function captureNode(id) {
  const nodes = await chrome.bookmarks.getSubTree(id)
  const node = nodes[0]
  if (!node) return null
  return {
    snapshot: toSnapshot(node),
    parentId: await _asyncNullishCoalesce(node.parentId, async () => ( (await getDefaultParentId()))),
    index: _nullishCoalesce(node.index, () => ( 0)),
  }
}

/** Recreate a captured node inside `parentId`. */
export async function restoreNode(
  parentId,
  snapshot,
  index
) {
  if (snapshot.url) {
    await chrome.bookmarks.create({
      parentId,
      title: snapshot.title,
      url: snapshot.url,
      index,
    })
    return
  }
  const folder = await chrome.bookmarks.create({ parentId, title: snapshot.title, index })
  for (const child of _nullishCoalesce(snapshot.children, () => ( []))) {
    await restoreNode(folder.id, child)
  }
}

async function captureNodes(ids) {
  const captured = []
  for (const id of ids) {
    const node = await captureNode(id)
    if (node) captured.push(node)
  }
  return captured
}

/** Delete bookmarks but keep enough data to undo the whole batch. */
export async function deleteBookmarksWithUndo(
  ids
) {
  const captured = await captureNodes(ids)
  for (const id of ids) {
    await chrome.bookmarks.remove(id).catch(() => undefined)
  }
  return captured
}

/** Delete folders (including contents) but keep enough data to undo. */
export async function deleteFoldersWithUndo(
  ids
) {
  const captured = await captureNodes(ids)
  for (const id of ids) {
    await chrome.bookmarks.removeTree(id).catch(() => undefined)
  }
  return captured
}

/** Restore a batch captured by the delete helpers above. */
export async function restoreNodes(captured) {
  const sorted = [...captured].sort((a, b) => a.index - b.index)
  for (const item of sorted) {
    await restoreNode(item.parentId, item.snapshot, item.index)
  }
}

export async function createBookmark(
  parentId,
  title,
  url
) {
  return chrome.bookmarks.create({ parentId, title, url })
}

export async function createFolder(
  parentId,
  title
) {
  return chrome.bookmarks.create({ parentId, title })
}

export async function updateBookmark(
  id,
  changes
) {
  return chrome.bookmarks.update(id, changes)
}

export async function renameFolder(id, title) {
  await chrome.bookmarks.update(id, { title })
}

export async function moveBookmark(id, parentId) {
  await chrome.bookmarks.move(id, { parentId })
}

/** Build the hostname key used by the domain filter and duplicate view. */
export function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}
