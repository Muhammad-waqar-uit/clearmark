import { useEffect, useMemo, useRef, useState } from 'react'
import {
  countExtras,
  extrasKeeping,
  extrasKeepingOldest,
  findDuplicates,
  normalizeUrl,
  type DuplicateGroup,
} from '../../lib/duplicates'
import { findEmptyFolders } from '../../lib/emptyFolders'
import { checkBookmarks, ensureLinkCheckPermission } from '../../lib/linkcheck'
import type { FlatBookmark, LinkCheckResult } from '../../lib/types'
import { EmptyState, LetterAvatar } from './ui'
import { Icon } from '../../lib/Icon'
import { Notice, ProgressBar } from './Feedback'

function formatDate(timestamp: number): string {
  if (!timestamp) return 'unknown date'
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

type DuplicatesPanelProps = {
  bookmarks: FlatBookmark[]
  onDeleteBookmarks: (ids: string[]) => Promise<void>
  onOpen: (url: string) => void
}

/** Groups bookmarks with the same normalized URL and deletes redundant copies. */
export function DuplicatesPanel({ bookmarks, onDeleteBookmarks, onOpen }: DuplicatesPanelProps) {
  const groups = useMemo(() => findDuplicates(bookmarks), [bookmarks])
  const [keep, setKeep] = useState<Record<string, string>>({})

  const keepId = (group: DuplicateGroup): string => {
    const chosen = keep[group.url]
    return chosen && group.bookmarks.some((bookmark) => bookmark.id === chosen)
      ? chosen
      : group.bookmarks[0].id
  }

  const removeGroupExtras = (group: DuplicateGroup): void => {
    void onDeleteBookmarks(extrasKeeping(group, keepId(group)))
  }

  const removeAllExtras = (): void => {
    void onDeleteBookmarks(groups.flatMap(extrasKeepingOldest))
  }

  const extras = countExtras(groups)

  if (groups.length === 0) {
    return (
      <EmptyState
        title="No duplicates found"
        hint="Bookmarks are compared with tracking parameters, www prefixes, trailing slashes and http/https ignored."
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {groups.length} duplicate group{groups.length === 1 ? '' : 's'} · {extras} redundant cop
          {extras === 1 ? 'y' : 'ies'}
        </p>
        <button type="button" className="btn btn-danger" onClick={removeAllExtras}>
          Keep oldest, delete {extras}
        </button>
      </div>

      {groups.map((group) => {
        const chosen = keepId(group)
        return (
          <section key={group.url} className="card p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <a
                href={group.url}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 truncate text-sm font-medium text-brand-700 hover:underline dark:text-brand-300"
                title={normalizeUrl(group.url)}
              >
                {group.url}
              </a>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => removeGroupExtras(group)}
              >
                Delete {group.bookmarks.length - 1}
              </button>
            </div>
            <ul className="space-y-1">
              {group.bookmarks.map((bookmark) => (
                <li
                  key={bookmark.id}
                  className="flex items-center gap-2 rounded border border-slate-200 px-2 py-1.5 dark:border-slate-700"
                >
                  <input
                    type="radio"
                    className="h-4 w-4 accent-brand-600"
                    name={`keep-${group.url}`}
                    checked={chosen === bookmark.id}
                    onChange={() =>
                      setKeep((current) => ({ ...current, [group.url]: bookmark.id }))
                    }
                    aria-label={`Keep ${bookmark.title}`}
                  />
                  <LetterAvatar label={bookmark.title} seed={bookmark.url} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-800 dark:text-slate-100">
                      {bookmark.title}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {bookmark.folderPath || 'No folder'} · added {formatDate(bookmark.dateAdded)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost px-2 py-1 text-xs"
                    onClick={() => onOpen(bookmark.url)}
                  >
                    Open
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

type DeadLinksPanelProps = {
  bookmarks: FlatBookmark[]
  onDeleteBookmarks: (ids: string[]) => Promise<void>
  onOpen: (url: string) => void
}

/** Checks every bookmark URL and lists the ones that no longer respond. */
export function DeadLinksPanel({ bookmarks, onDeleteBookmarks, onOpen }: DeadLinksPanelProps) {
  const [results, setResults] = useState<LinkCheckResult[] | null>(null)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const cancelled = useRef(false)

  // After a delete, drop stale rows so the user doesn't see removed bookmarks.
  // Keep the rest of the results alive so the user can keep deleting without re-running the check.
  const keptIds = useMemo(() => new Set(bookmarks.map((b) => b.id)), [bookmarks])
  useEffect(() => {
    setResults((prev) => (prev ? prev.filter((r) => keptIds.has(r.id)) : null))
    setProgress((prev) =>
      prev.total > 0
        ? { ...prev, total: Math.min(prev.done, bookmarks.length), done: Math.min(prev.done, bookmarks.length) }
        : prev
    )
  }, [bookmarks, keptIds])

  const start = (): void => {
    void (async () => {
      setError('')
      const granted = await ensureLinkCheckPermission()
      if (!granted) {
        setError('Chrome blocked the request. Link checking needs permission to contact the sites you saved.')
        return
      }

      cancelled.current = false
      setRunning(true)
      setResults(null)
      setProgress({ done: 0, total: bookmarks.length })

      try {
        const checked = await checkBookmarks(bookmarks, {
          concurrency: 5,
          timeoutMs: 8000,
          onProgress: (done, total) => setProgress({ done, total }),
          shouldStop: () => cancelled.current,
        })
        setResults(checked.sort((a, b) => a.url.localeCompare(b.url)))
      } catch {
        setError('The link check stopped unexpectedly. Try again with fewer bookmarks.')
      } finally {
        setRunning(false)
      }
    })()
  }

  const broken = (results ?? []).filter((result) => result.status === 'broken')
  const redirected = (results ?? []).filter((result) => result.status === 'redirected')

  const renderRow = (result: LinkCheckResult) => (
    <li
      key={result.id}
      className="flex items-center gap-2 rounded border border-slate-200 px-2 py-1.5 dark:border-slate-700"
    >
      <span
        className={`badge ${
          result.status === 'broken'
            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
        }`}
      >
        {result.status}
      </span>
      <span className="min-w-0 flex-1 truncate text-xs text-slate-600 dark:text-slate-300" title={result.url}>
        {result.url}
      </span>
      <button
        type="button"
        className="btn btn-ghost px-2 py-1 text-xs"
        onClick={() => onOpen(result.url)}
      >
        <Icon name="open" className="h-3.5 w-3.5" /> Open
      </button>
      <button
        type="button"
        className="btn btn-ghost px-2 py-1 text-xs text-red-600 dark:text-red-400"
        onClick={() => void onDeleteBookmarks([result.id])}
      >
        <Icon name="trash" className="h-3.5 w-3.5" /> Delete
      </button>
    </li>
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-primary" onClick={start} disabled={running}>
          {running ? 'Checking…' : `Check ${bookmarks.length} links`}
        </button>
        {running ? (
          <button
            type="button"
            className="btn"
            onClick={() => {
              cancelled.current = true
            }}
          >
            Stop
          </button>
        ) : null}
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Uses a HEAD request with an 8 second timeout, 5 at a time.
        </p>
      </div>

      {running || progress.total > 0 ? (
        <div className="space-y-1">
          <ProgressBar done={progress.done} total={progress.total} />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {progress.done} of {progress.total} checked
          </p>
        </div>
      ) : null}

      {error ? <Notice tone="error">{error}</Notice> : null}

      {results ? (
        <div className="space-y-3">
          <Notice tone={broken.length > 0 ? 'error' : 'success'}>
            {broken.length} broken · {redirected.length} redirected ·{' '}
            {results.length - broken.length - redirected.length} healthy
          </Notice>

          {broken.length > 0 ? (
            <section className="card p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Broken links</h3>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => void onDeleteBookmarks(broken.map((result) => result.id))}
                >
                  Delete all {broken.length}
                </button>
              </div>
              <ul className="space-y-1">{broken.map(renderRow)}</ul>
            </section>
          ) : null}

          {redirected.length > 0 ? (
            <section className="card p-3">
              <h3 className="mb-2 text-sm font-semibold">Redirected links</h3>
              <ul className="space-y-1">{redirected.map(renderRow)}</ul>
            </section>
          ) : null}

          {broken.length === 0 && redirected.length === 0 ? (
            <EmptyState title="All links responded" hint="Nothing to clean up here." />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

type EmptyFoldersPanelProps = {
  tree: chrome.bookmarks.BookmarkTreeNode[]
  onDeleteFolders: (ids: string[]) => Promise<void>
}

/** Finds folders without any children so they can be removed. */
export function EmptyFoldersPanel({ tree, onDeleteFolders }: EmptyFoldersPanelProps) {
  const folders = useMemo(() => findEmptyFolders(tree), [tree])

  if (folders.length === 0) {
    return (
      <EmptyState
        title="No empty folders"
        hint="Bookmarks bar, Other bookmarks and Mobile bookmarks are never listed."
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {folders.length} empty folder{folders.length === 1 ? '' : 's'}
        </p>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => void onDeleteFolders(folders.map((folder) => folder.id))}
        >
          Delete all {folders.length}
        </button>
      </div>

      <ul className="space-y-1">
        {folders.map((folder) => (
          <li
            key={folder.id}
            className="flex items-center gap-2 rounded border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-700"
          >
            <span aria-hidden="true">📁</span>
            <span className="min-w-0 flex-1 truncate" title={folder.path}>
              {folder.path}
            </span>
            <button
              type="button"
              className="btn btn-ghost px-2 py-1 text-xs text-red-600 dark:text-red-400"
              onClick={() => void onDeleteFolders([folder.id])}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
