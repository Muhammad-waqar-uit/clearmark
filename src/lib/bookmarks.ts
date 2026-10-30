import type { FlatBookmark, FlatFolder, FolderNode } from './types'

/** Read the full browser bookmark tree. */
export function getBookmarkTree(): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
  return chrome.bookmarks.getTree()
}

/** The id of the folder new items should go into by default (Bookmarks Bar). */
export async function getDefaultParentId(): Promise<string> {
  const tree = await getBookmarkTree()
  const root = tree[0]
  const bookmarksBar = root?.children?.find((node) => node.id === '1')
  return bookmarksBar?.id ?? root?.children?.[0]?.id ?? root?.id ?? '1'
}

/** Flatten the tree into bookmark leaves with their folder path. */
export function flattenBookmarks(tree: chrome.bookmarks.BookmarkTreeNode[]): FlatBookmark[] {
  const result: FlatBookmark[] = []

  const walk = (
    nodes: chrome.bookmarks.BookmarkTreeNode[],
    path: string[],
    pathIds: string[]
  ): void => {
    for (const node of nodes) {
      if (node.url) {
        result.push({
          id: node.id,
          title: node.title || node.url,
          url: node.url,
          parentId: node.parentId ?? '',
          folderPath: path.join(' / '),
          folderPathIds: pathIds,
          dateAdded: node.dateAdded ?? 0,
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
export function flattenFolders(tree: chrome.bookmarks.BookmarkTreeNode[]): FlatFolder[] {
  const result: FlatFolder[] = []

  const walk = (
    nodes: chrome.bookmarks.BookmarkTreeNode[],
    path: string[],
    pathIds: string[],
    depth: number
  ): void => {
    for (const node of nodes) {
      if (node.url) continue
      if (!node.parentId) {
        walk(node.children ?? [], path, pathIds, depth)
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
      walk(node.children ?? [], nextPath, nextIds, depth + 1)
    }
  }

  walk(tree, [], [], 0)
  return result
}

/** Build the nested folder-only tree used by the folder sidebar. */
export function buildFolderTree(tree: chrome.bookmarks.BookmarkTreeNode[]): FolderNode[] {
  const build = (nodes: chrome.bookmarks.BookmarkTreeNode[]): FolderNode[] =>
    nodes
      .filter((node) => !node.url)
      .map((node) => ({
        id: node.id,
        title: node.title || 'Untitled folder',
        children: build(node.children ?? []),
      }))

  const root = tree[0]
  return build(root && !root.parentId ? root.children ?? [] : tree)
}

/** Count bookmarks per folder, including all nested folders. */
export function countBookmarksByFolder(bookmarks: FlatBookmark[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const bookmark of bookmarks) {
    for (const id of bookmark.folderPathIds) {
      counts[id] = (counts[id] ?? 0) + 1
    }
  }
  return counts
}

/** Folder ids a bookmark can live in to be visible when `folderId` is selected. */
export function folderScope(folders: FlatFolder[], folderId: string): Set<string> {
  const scope = new Set<string>([folderId])
  const walk = (parentId: string): void => {
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
export type TreeNodeSnapshot = {
  title: string
  url?: string
  children?: TreeNodeSnapshot[]
}

export type CapturedNode = {
  snapshot: TreeNodeSnapshot
  parentId: string
  index: number
}

function toSnapshot(node: chrome.bookmarks.BookmarkTreeNode): TreeNodeSnapshot {
  if (node.url) return { title: node.title, url: node.url }
  return {
    title: node.title,
    children: (node.children ?? []).map(toSnapshot),
  }
}

/** Capture a bookmark or folder (with everything inside it) before deletion. */
export async function captureNode(id: string): Promise<CapturedNode | null> {
  const nodes = await chrome.bookmarks.getSubTree(id)
  const node = nodes[0]
  if (!node) return null
  return {
    snapshot: toSnapshot(node),
    parentId: node.parentId ?? (await getDefaultParentId()),
    index: node.index ?? 0,
  }
}

/** Recreate a captured node inside `parentId`. */
export async function restoreNode(
  parentId: string,
  snapshot: TreeNodeSnapshot,
  index?: number
): Promise<void> {
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
  for (const child of snapshot.children ?? []) {
    await restoreNode(folder.id, child)
  }
}

async function captureNodes(ids: string[]): Promise<CapturedNode[]> {
  const captured: CapturedNode[] = []
  for (const id of ids) {
    const node = await captureNode(id)
    if (node) captured.push(node)
  }
  return captured
}

/** Delete bookmarks but keep enough data to undo the whole batch. */
export async function deleteBookmarksWithUndo(
  ids: string[]
): Promise<CapturedNode[]> {
  const captured = await captureNodes(ids)
  for (const id of ids) {
    await chrome.bookmarks.remove(id).catch(() => undefined)
  }
  return captured
}

/** Delete folders (including contents) but keep enough data to undo. */
export async function deleteFoldersWithUndo(
  ids: string[]
): Promise<CapturedNode[]> {
  const captured = await captureNodes(ids)
  for (const id of ids) {
    await chrome.bookmarks.removeTree(id).catch(() => undefined)
  }
  return captured
}

/** Restore a batch captured by the delete helpers above. */
export async function restoreNodes(captured: CapturedNode[]): Promise<void> {
  const sorted = [...captured].sort((a, b) => a.index - b.index)
  for (const item of sorted) {
    await restoreNode(item.parentId, item.snapshot, item.index)
  }
}

export async function createBookmark(
  parentId: string,
  title: string,
  url: string
): Promise<chrome.bookmarks.BookmarkTreeNode> {
  return chrome.bookmarks.create({ parentId, title, url })
}

export async function createFolder(
  parentId: string,
  title: string
): Promise<chrome.bookmarks.BookmarkTreeNode> {
  return chrome.bookmarks.create({ parentId, title })
}

export async function updateBookmark(
  id: string,
  changes: { title?: string; url?: string }
): Promise<chrome.bookmarks.BookmarkTreeNode> {
  return chrome.bookmarks.update(id, changes)
}

export async function renameFolder(id: string, title: string): Promise<void> {
  await chrome.bookmarks.update(id, { title })
}

export async function moveBookmark(id: string, parentId: string): Promise<void> {
  await chrome.bookmarks.move(id, { parentId })
}

/** Build the hostname key used by the domain filter and duplicate view. */
export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}
