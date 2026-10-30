import { BookmarkTreeNode, BookmarkTreeNodeType } from '@types/chrome'

/** Recursively flatten the bookmark tree into a simple list */
export function getAllBookmarks(): BookmarkTreeNode[] {
  return chrome.bookmarks.getTree().then((tree) => {
    const result: BookmarkTreeNode[] = []
    function recurse(nodes: BookmarkTreeNode[]) {
      for (const node of nodes) {
        result.push(node)
        if (node.children && node.children.length > 0) {
          recurse(node.children)
        }
      }
    }
    recurse(tree)
    return result
  })
}

/** Get the root folder (usually "Bookmark Bar" or "Other Bookmarks") */
export function getRootFolder(): Promise<BookmarkTreeNode> {
  return chrome.bookmarks.getTree().then((tree) => {
    return tree.find((node) => node.title === 'Bookmark Bar') || tree.find((node) => node.title === 'Other Bookmarks') || tree[0]
  })
}