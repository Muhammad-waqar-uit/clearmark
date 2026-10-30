import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  buildFolderTree,
  countBookmarksByFolder,
  flattenBookmarks,
  flattenFolders,
  getBookmarkTree,
} from './bookmarks'

/** Live bookmark tree with flattened bookmarks, folders and per-folder counts. */
export function useBookmarks() {
  const [tree, setTree] = useState<chrome.bookmarks.BookmarkTreeNode[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async (): Promise<void> => {
    try {
      const next = await getBookmarkTree()
      setTree(next)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()

    const listener = (): void => {
      void reload()
    }
    chrome.bookmarks.onCreated.addListener(listener)
    chrome.bookmarks.onRemoved.addListener(listener)
    chrome.bookmarks.onChanged.addListener(listener)
    chrome.bookmarks.onMoved.addListener(listener)
    chrome.bookmarks.onChildrenReordered.addListener(listener)
    chrome.bookmarks.onImportEnded.addListener(listener)

    return () => {
      chrome.bookmarks.onCreated.removeListener(listener)
      chrome.bookmarks.onRemoved.removeListener(listener)
      chrome.bookmarks.onChanged.removeListener(listener)
      chrome.bookmarks.onMoved.removeListener(listener)
      chrome.bookmarks.onChildrenReordered.removeListener(listener)
      chrome.bookmarks.onImportEnded.removeListener(listener)
    }
  }, [reload])

  const bookmarks = useMemo(() => flattenBookmarks(tree), [tree])
  const folders = useMemo(() => flattenFolders(tree), [tree])
  const folderTree = useMemo(() => buildFolderTree(tree), [tree])
  const counts = useMemo(() => countBookmarksByFolder(bookmarks), [bookmarks])

  return { tree, bookmarks, folders, folderTree, counts, loading, reload }
}
