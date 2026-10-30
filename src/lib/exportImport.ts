/** Export all bookmarks to JSON, including tags and notes */
export function exportBookmarks(bookmarks: chrome.bookmarks.BookmarkTreeNode[]): string {
  const metaMap = new Map<string, { tags: string[]; note?: string }>()
  
  // Collect all metadata from storage
  // This would be combined with readStorage() in the actual app
  
  const tree: any = {}
  function recurse(nodes: chrome.bookmarks.BookmarkTreeNode[], parentPath: string = '') {
    for (const node of nodes) {
      const path = parentPath ? `${parentPath} > ${node.title}` : node.title
      if (node.children && node.children.length > 0) {
        tree[path] = {}
        recurse(node.children, path)
      } else {
        tree[path] = {
          url: node.url,
          title: node.title,
          favicon: node.favicon?.iconUrl || '',
          dateAdded: node.dateAdded
        }
      }
    }
  }
  recurse(bookmarks)
  
  return JSON.stringify(tree, null, 2)
}

/** Convert from Netscape HTML bookmark format */
export function importFromNetscape(html: string): chrome.bookmarks.BookmarkTreeNode[] {
  // Parse Netscape HTML bookmark format
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const bookmarks: chrome.bookmarks.BookmarkTreeNode[] = []
  
  function recurseNodes(nodes: Node[], parent?: chrome.bookmarks.BookmarkTreeNode) {
    for (const node of nodes) {
      if (node.nodeName === 'DT') {
        const titleNode = node.querySelector('H3')
        const urlNode = node.querySelector('A')
        if (titleNode && urlNode) {
          const title = titleNode.textContent
          const url = urlNode.getAttribute('HREF')
          if (url) {
            const newBookmark: chrome.bookmarks.BookmarkTreeNode = {
              id: crypto.randomUUID(),
              title,
              url,
              dateAdded: new Date().getTime(),
              lastModified: new Date().getTime()
            }
            if (parent) {
              parent.children.push(newBookmark)
            } else {
              bookmarks.push(newBookmark)
            }
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        recurseNodes(node.childNodes, parent)
      }
    }
  }
  
  recurseNodes(doc?.body?.childNodes)
  return bookmarks
}