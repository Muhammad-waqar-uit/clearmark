/** Hook that provides bookmarks from chrome.bookmarks.getTree() */
import { useEffect, useState } from 'react'
import { getAllBookmarks } from './bookmarks'

/** Returns the full bookmark tree and a reload function */
export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<chrome.bookmarks.BookmarkTreeNode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllBookmarks().then((bm) => {
      setBookmarks(bm)
      setLoading(false)
    })
  }, [])

  return { bookmarks, loading, reload: () => getAllBookmarks().then(setBookmarks) }
}