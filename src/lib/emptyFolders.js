 function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } 





/**
 * Find folders with no children. The three permanent top-level folders
 * (Bookmarks bar, Other bookmarks, Mobile bookmarks) are ignored because the
 * browser does not allow removing them.
 */
export function findEmptyFolders(tree) {
  const result = []
  const root = tree[0]
  if (!root) return result

  const walk = (nodes, path) => {
    for (const node of nodes) {
      if (node.url) continue
      const nextPath = [...path, node.title || 'Untitled folder']
      const children = _nullishCoalesce(node.children, () => ( []))
      if (children.length === 0) {
        result.push({ id: node.id, title: node.title || 'Untitled folder', path: nextPath.join(' / ') })
        continue
      }
      walk(children, nextPath)
    }
  }

  for (const topLevel of _nullishCoalesce(root.children, () => ( []))) {
    walk(_nullishCoalesce(topLevel.children, () => ( [])), [topLevel.title || 'Bookmarks'])
  }

  return result
}
