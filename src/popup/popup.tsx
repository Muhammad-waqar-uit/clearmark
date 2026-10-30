import { useEffect, useMemo, useState } from 'react'
import {
  createBookmark,
  flattenBookmarks,
  flattenFolders,
  getBookmarkTree,
  getDefaultParentId,
} from '../lib/bookmarks'
import { applyTheme } from '../lib/theme'
import { getStorage } from '../lib/storage'
import type { FlatBookmark, FlatFolder } from '../lib/types'

const MAX_RESULTS = 10

/** Quick search, "add current page" and a shortcut into the full manager. */
export function Popup() {
  const [bookmarks, setBookmarks] = useState<FlatBookmark[]>([])
  const [folders, setFolders] = useState<FlatFolder[]>([])
  const [query, setQuery] = useState('')
  const [folderId, setFolderId] = useState('')
  const [page, setPage] = useState<{ title: string; url: string } | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void (async () => {
      const [tree, stored, current] = await Promise.all([
        getBookmarkTree(),
        getStorage(),
        chrome.tabs.query({ active: true, currentWindow: true }),
      ])
      if (!active) return

      setBookmarks(flattenBookmarks(tree))
      const allFolders = flattenFolders(tree)
      setFolders(allFolders)
      const bar = allFolders.find((folder) => /^bookmarks bar$/i.test(folder.title))
      setFolderId(bar?.id ?? (await getDefaultParentId()))

      const tab = current[0]
      if (tab?.url && /^https?:/i.test(tab.url)) {
        setPage({ title: tab.title?.trim() || tab.url, url: tab.url })
      }

      applyTheme(stored.settings.theme)
    })()
    return () => {
      active = false
    }
  }, [])

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const list = needle
      ? bookmarks.filter(
          (bookmark) =>
            bookmark.title.toLowerCase().includes(needle) ||
            bookmark.url.toLowerCase().includes(needle)
        )
      : bookmarks
    return list.slice(0, MAX_RESULTS)
  }, [bookmarks, query])

  const openBookmark = (url: string): void => {
    void chrome.tabs.create({ url })
    window.close()
  }

  const addCurrentPage = (): void => {
    if (!page) return
    setError('')
    void (async () => {
      try {
        await createBookmark(folderId, page.title, page.url)
        const refreshed = await getBookmarkTree()
        setBookmarks(flattenBookmarks(refreshed))
        setMessage('Saved to your bookmarks.')
      } catch {
        setError('That page could not be saved.')
      }
    })()
  }

  const openManager = (): void => {
    void chrome.tabs.create({ url: chrome.runtime.getURL('src/manager/index.html') })
    window.close()
  }

  return (
    <div className="flex w-[360px] flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <span aria-hidden="true">🧹</span>
        <strong className="text-sm">Clearmark</strong>
        <button
          type="button"
          className="btn ml-auto px-2 py-1 text-xs"
          onClick={() => void chrome.runtime.openOptionsPage()}
        >
          Settings
        </button>
      </div>

      <label htmlFor="popup-search" className="sr-only">
        Search bookmarks
      </label>
      <input
        id="popup-search"
        type="search"
        className="input"
        placeholder="Search bookmarks…"
        value={query}
        autoFocus
        onChange={(event) => setQuery(event.target.value)}
      />

      <ul className="max-h-56 space-y-0.5 overflow-auto" aria-label="Search results">
        {results.length === 0 ? (
          <li className="px-2 py-3 text-xs text-slate-500 dark:text-slate-400">
            No bookmarks match “{query}”.
          </li>
        ) : (
          results.map((bookmark) => (
            <li key={bookmark.id}>
              <button
                type="button"
                className="w-full truncate rounded px-2 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                title={`${bookmark.title}\n${bookmark.url}`}
                onClick={() => openBookmark(bookmark.url)}
              >
                <span className="block truncate font-medium">{bookmark.title}</span>
                <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {bookmark.folderPath || 'No folder'}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>

      <div className="rounded-md border border-slate-200 p-2 dark:border-slate-700">
        <p className="mb-1 truncate text-xs text-slate-500 dark:text-slate-400" title={page?.url ?? ''}>
          {page ? page.title : 'This tab cannot be bookmarked'}
        </p>
        <div className="flex gap-2">
          <label htmlFor="popup-folder" className="sr-only">
            Destination folder
          </label>
          <select
            id="popup-folder"
            className="select min-w-0 flex-1"
            value={folderId}
            onChange={(event) => setFolderId(event.target.value)}
          >
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {`${'— '.repeat(folder.depth)}${folder.title}`}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-primary shrink-0"
            onClick={addCurrentPage}
            disabled={!page || !folderId}
          >
            Add page
          </button>
        </div>
        {message ? <p className="mt-1 text-xs text-emerald-600">{message}</p> : null}
        {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
      </div>

      <button type="button" className="btn" onClick={openManager}>
        Open full manager
      </button>
    </div>
  )
}
