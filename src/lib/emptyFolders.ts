export type EmptyFolder = {
  id: string
  title: string
  path: string
}

/**
 * Find folders with no children. The three permanent top-level folders
 * (Bookmarks bar, Other bookmarks, Mobile bookmarks) are ignored because the
 * browser does not allow removing them.
 */
export function findEmptyFolders(tree: chrome.bookmarks.BookmarkTreeNode[]): EmptyFolder[] {
  const result: EmptyFolder[] = []
  const root = tree[0]
  if (!root) return result

  const walk = (nodes: chrome.bookmarks.BookmarkTreeNode[], path: string[]): void => {
    for (const node of nodes) {
      if (node.url) continue
      const nextPath = [...path, node.title || 'Untitled folder']
      const children = node.children ?? []
      if (children.length === 0) {
        result.push({ id: node.id, title: node.title || 'Untitled folder', path: nextPath.join(' / ') })
        continue
      }
      walk(children, nextPath)
    }
  }

  for (const topLevel of root.children ?? []) {
    walk(topLevel.children ?? [], [topLevel.title || 'Bookmarks'])
  }

  return result
}
