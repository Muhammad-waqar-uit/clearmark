import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useBookmarks } from '../lib/useBookmarks'
import { useSettings } from '../lib/useSettings'
import {
  getStorage,
  pruneBookmarkMeta,
  removeBookmarkMeta,
  saveBookmarkMeta,
  saveManyBookmarkMeta,
} from '../lib/storage'
import {
  createBookmark,
  createFolder,
  deleteBookmarksWithUndo,
  deleteFoldersWithUndo,
  folderScope,
  getDefaultParentId,
  moveBookmark,
  renameFolder,
  restoreNodes,
  updateBookmark,
} from '../lib/bookmarks'
import type { BookmarkMeta, SortKey, Theme } from '../lib/types'
import { BookmarkList } from './components/BookmarkList'
import { BookmarkForm } from './components/BookmarkForm'
import { FolderPicker } from './components/FolderPicker'
import { FolderTree } from './components/FolderTree'
import { SearchBar } from './components/SearchBar'
import { Modal } from './components/ui'
import { BulkBar, UndoToast } from './components/Feedback'
import { DuplicatesPanel, DeadLinksPanel, EmptyFoldersPanel } from './components/CleanupPanels'
import { ExtensionHub } from './components/ExtensionHub'
import { TransferPanel } from './components/TransferPanel'
import {
  collectDomains,
  collectTags,
  filterBookmarks,
  sortBookmarks,
  type BookmarkWithMeta,
  type DateFilter,
  type ViewMode,
} from './filters'
import { useUndo } from './useUndo'

type Tab = 'bookmarks' | 'cleanup' | 'extensions' | 'transfer'

type Dialog =
  | { kind: 'create'; parentId: string }
  | { kind: 'edit'; bookmark: BookmarkWithMeta }
  | { kind: 'move'; ids: string[] }
  | { kind: 'folder'; parentId: string }
  | { kind: 'rename'; id: string; title: string }
  | { kind: 'tag'; ids: string[] }
  | null

function openUrl(url: string): void {
  void chrome.tabs.create({ url })
}

function TextPrompt({
  title,
  label,
  initial,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string
  label: string
  initial: string
  confirmLabel: string
  onConfirm: (value: string) => void
  onClose: () => void
}) {
  const [value, setValue] = useState(initial)

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onConfirm(value.trim())}
            disabled={value.trim() === ''}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="prompt-value">
        {label}
      </label>
      <input
        id="prompt-value"
        className="input"
        value={value}
        autoFocus
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && value.trim() !== '') onConfirm(value.trim())
        }}
      />
    </Modal>
  )
}

export function ManagerPage() {
  const { tree, bookmarks, folders, folderTree, counts, loading } = useBookmarks()
  const { settings, update } = useSettings()
  const [meta, setMeta] = useState<Record<string, BookmarkMeta>>({})
  const [tab, setTab] = useState<Tab>('bookmarks')
  const [selectedFolder, setSelectedFolder] = useState('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [domain, setDomain] = useState('')
  const [tag, setTag] = useState('')
  const [date, setDate] = useState<DateFilter>('any')
  const [sort, setSort] = useState<SortKey | null>(null)
  const [view, setView] = useState<ViewMode>('list')
  const [dialog, setDialog] = useState<Dialog>(null)
  const [defaultParent, setDefaultParent] = useState('')
  const undo = useUndo()

  useEffect(() => {
    void getStorage().then((storage) => setMeta(storage.meta))
    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string
    ): void => {
      if (area === 'local' && changes.meta) {
        setMeta((changes.meta.newValue as Record<string, BookmarkMeta>) ?? {})
      }
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  useEffect(() => {
    void getDefaultParentId().then(setDefaultParent)
  }, [])

  const withMeta = useMemo<BookmarkWithMeta[]>(
    () => bookmarks.map((bookmark) => ({ ...bookmark, meta: meta[bookmark.id] ?? { tags: [] } })),
    [bookmarks, meta]
  )

  const scope = useMemo(
    () => (selectedFolder === 'all' ? null : folderScope(folders, selectedFolder)),
    [folders, selectedFolder]
  )

  const visible = useMemo(() => {
    const filtered = filterBookmarks(withMeta, { query, domain, tag, date, scope })
    return sortBookmarks(filtered, sort ?? settings.defaultSort)
  }, [withMeta, query, domain, tag, date, scope, sort, settings.defaultSort])

  const domains = useMemo(() => collectDomains(bookmarks), [bookmarks])
  const tags = useMemo(() => collectTags(meta), [meta])

  const pruned = useRef(false)
  useEffect(() => {
    // Folders removed outside this page leave orphaned tags behind; clean once per load.
    if (loading || pruned.current || bookmarks.length === 0) return
    pruned.current = true
    void pruneBookmarkMeta(bookmarks.map((bookmark) => bookmark.id))
  }, [loading, bookmarks])

  useEffect(() => {
    setSelected((current) => {
      const ids = new Set(bookmarks.map((bookmark) => bookmark.id))
      const next = new Set([...current].filter((id) => ids.has(id)))
      return next.size === current.size ? current : next
    })
  }, [bookmarks])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      if (event.key === '/' && !typing) {
        event.preventDefault()
        document.getElementById('bookmark-search')?.focus()
      }
      if (event.key === 'Escape' && !typing) setSelected(new Set())
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const saveMeta = useCallback(
    async (id: string, next: BookmarkMeta): Promise<void> => {
      if (next.tags.length === 0 && !next.note) await removeBookmarkMeta(id)
      else await saveBookmarkMeta(id, next)
    },
    []
  )

  const folderTarget = selectedFolder === 'all' ? defaultParent : selectedFolder

  const toggleSelected = (id: string): void => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = (ids: string[], checked: boolean): void => {
    setSelected((current) => {
      const next = new Set(current)
      for (const id of ids) {
        if (checked) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }

  const deleteBookmarks = useCallback(
    async (ids: string[]): Promise<void> => {
      if (ids.length === 0) return
      const captured = await deleteBookmarksWithUndo(ids)
      setSelected(new Set())
      undo.offer({
        message: `Deleted ${ids.length} bookmark${ids.length === 1 ? '' : 's'}`,
        run: () => restoreNodes(captured),
      })
    },
    [undo]
  )

  const deleteFolders = useCallback(
    async (ids: string[]): Promise<void> => {
      if (ids.length === 0) return
      const removable = ids.filter((id) => {
        const folder = folders.find((entry) => entry.id === id)
        return folder !== undefined && folder.depth > 0
      })
      if (removable.length === 0) return
      const captured = await deleteFoldersWithUndo(removable)
      undo.offer({
        message: `Deleted ${removable.length} folder${removable.length === 1 ? '' : 's'}`,
        run: () => restoreNodes(captured),
      })
    },
    [folders, undo]
  )

  const moveSelected = async (ids: string[], parentId: string): Promise<void> => {
    for (const id of ids) await moveBookmark(id, parentId)
    setSelected(new Set())
  }

  const addTag = async (ids: string[], newTag: string): Promise<void> => {
    const entries: Array<[string, BookmarkMeta]> = ids.map((id) => {
      const existing = meta[id] ?? { tags: [] }
      return [id, { ...existing, tags: Array.from(new Set([...existing.tags, newTag])) }]
    })
    await saveManyBookmarkMeta(entries)
    setSelected(new Set())
  }

  const activeFolder = folders.find((folder) => folder.id === selectedFolder)

  const cycleTheme = (): void => {
    const order: Theme[] = ['light', 'dark', 'system']
    const next = order[(order.indexOf(settings.theme) + 1) % order.length]
    void update({ theme: next })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-base font-semibold">🧹 Clearmark</h1>
          <nav className="flex flex-wrap gap-1" aria-label="Sections">
            {(
              [
                ['bookmarks', 'Bookmarks'],
                ['cleanup', 'Cleanup'],
                ['extensions', 'Extensions'],
                ['transfer', 'Import & export'],
              ] as Array<[Tab, string]>
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`nav-tab ${tab === value ? 'nav-tab-active' : ''}`}
                onClick={() => setTab(value)}
                aria-current={tab === value ? 'page' : undefined}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {tab === 'bookmarks' ? (
              <>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setDialog({ kind: 'folder', parentId: folderTarget })}
                >
                  New folder
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setDialog({ kind: 'create', parentId: folderTarget })}
                >
                  New bookmark
                </button>
              </>
            ) : null}
            <button
              type="button"
              className="btn"
              onClick={cycleTheme}
              title={`Theme: ${settings.theme}`}
            >
              {settings.theme === 'dark' ? '🌙' : settings.theme === 'light' ? '☀️' : '🖥️'}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => void chrome.runtime.openOptionsPage()}
            >
              Settings
            </button>
          </div>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 gap-4 p-4">
        {tab === 'bookmarks' ? (
          <>
            <aside className="card w-64 shrink-0 overflow-auto p-2">
              <FolderTree
                folderTree={folderTree}
                counts={counts}
                totalCount={bookmarks.length}
                selectedFolder={selectedFolder}
                onSelect={setSelectedFolder}
                onDropBookmark={(folderId, bookmarkId) => {
                  const ids = selected.has(bookmarkId) ? [...selected] : [bookmarkId]
                  void moveSelected(ids, folderId)
                }}
              />
              {activeFolder ? (
                <div className="mt-3 space-y-1 border-t border-slate-200 pt-2 dark:border-slate-700">
                  <p className="truncate px-2 text-xs text-slate-500 dark:text-slate-400" title={activeFolder.path}>
                    {activeFolder.path}
                  </p>
                  <button
                    type="button"
                    className="btn w-full"
                    onClick={() => setDialog({ kind: 'folder', parentId: activeFolder.id })}
                  >
                    New subfolder
                  </button>
                  <button
                    type="button"
                    className="btn w-full"
                    onClick={() =>
                      setDialog({ kind: 'rename', id: activeFolder.id, title: activeFolder.title })
                    }
                  >
                    Rename folder
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger w-full"
                    disabled={activeFolder.depth === 0}
                    title={
                      activeFolder.depth === 0
                        ? 'Chrome does not allow removing built-in folders'
                        : 'Delete this folder and everything in it'
                    }
                    onClick={() => void deleteFolders([activeFolder.id])}
                  >
                    Delete folder
                  </button>
                </div>
              ) : null}
            </aside>

            <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
              <SearchBar
                query={query}
                onQueryChange={setQuery}
                sort={sort ?? settings.defaultSort}
                onSortChange={setSort}
                view={view}
                onViewChange={setView}
                domains={domains}
                domainFilter={domain}
                onDomainFilterChange={setDomain}
                tags={tags}
                tagFilter={tag}
                onTagFilterChange={setTag}
                dateFilter={date}
                onDateFilterChange={setDate}
                resultCount={visible.length}
              />

              {selected.size > 0 ? (
                <BulkBar
                  count={selected.size}
                  onMove={() => setDialog({ kind: 'move', ids: [...selected] })}
                  onTag={() => setDialog({ kind: 'tag', ids: [...selected] })}
                  onDelete={() => void deleteBookmarks([...selected])}
                  onClear={() => setSelected(new Set())}
                />
              ) : null}

              <div className="card min-h-0 flex-1 p-2">
                {loading ? (
                  <p className="p-4 text-sm text-slate-500 dark:text-slate-400">Loading bookmarks…</p>
                ) : (
                  <BookmarkList
                    items={visible}
                    selected={selected}
                    onToggle={toggleSelected}
                    onToggleAll={toggleAll}
                    onEdit={(bookmark) => setDialog({ kind: 'edit', bookmark })}
                    onDelete={(ids) => void deleteBookmarks(ids)}
                    onOpen={openUrl}
                    onSaveMeta={saveMeta}
                    view={view}
                  />
                )}
              </div>
            </section>
          </>
        ) : null}

        {tab === 'cleanup' ? (
          <section className="min-w-0 flex-1 space-y-4 overflow-auto">
            <div className="card p-3">
              <h2 className="mb-2 text-sm font-semibold">Duplicate bookmarks</h2>
              <DuplicatesPanel
                bookmarks={bookmarks}
                onDeleteBookmarks={deleteBookmarks}
                onOpen={openUrl}
              />
            </div>
            <div className="card p-3">
              <h2 className="mb-2 text-sm font-semibold">Dead links</h2>
              <DeadLinksPanel
                bookmarks={bookmarks}
                onDeleteBookmarks={deleteBookmarks}
                onOpen={openUrl}
              />
            </div>
            <div className="card p-3">
              <h2 className="mb-2 text-sm font-semibold">Empty folders</h2>
              <EmptyFoldersPanel tree={tree} onDeleteFolders={deleteFolders} />
            </div>
          </section>
        ) : null}

        {tab === 'extensions' ? (
          <section className="min-w-0 flex-1 overflow-auto">
            <ExtensionHub
              explained={settings.managementExplained}
              onAcknowledge={() => void update({ managementExplained: true })}
            />
          </section>
        ) : null}

        {tab === 'transfer' ? (
          <section className="min-w-0 flex-1 overflow-auto">
            <TransferPanel
              folders={folders}
              bookmarks={bookmarks}
              meta={meta}
              defaultFolderId={defaultParent}
            />
          </section>
        ) : null}
      </main>

      {dialog?.kind === 'create' ? (
        <BookmarkForm
          mode="create"
          folders={folders}
          initial={{ title: '', url: '', parentId: dialog.parentId }}
          onClose={() => setDialog(null)}
          onSave={(values) => {
            setDialog(null)
            void createBookmark(values.parentId, values.title, values.url)
          }}
        />
      ) : null}

      {dialog?.kind === 'edit' ? (
        <BookmarkForm
          mode="edit"
          folders={folders}
          initial={{
            title: dialog.bookmark.title,
            url: dialog.bookmark.url,
            parentId: dialog.bookmark.parentId,
          }}
          onClose={() => setDialog(null)}
          onSave={(values) => {
            const bookmark = dialog.bookmark
            setDialog(null)
            void updateBookmark(bookmark.id, { title: values.title, url: values.url })
          }}
        />
      ) : null}

      {dialog?.kind === 'move' ? (
        <FolderPicker
          title={`Move ${dialog.ids.length} bookmark${dialog.ids.length === 1 ? '' : 's'}`}
          confirmLabel="Move here"
          folders={folders}
          initialFolderId={defaultParent}
          onClose={() => setDialog(null)}
          onConfirm={(folderId) => {
            const ids = dialog.ids
            setDialog(null)
            void moveSelected(ids, folderId)
          }}
        />
      ) : null}

      {dialog?.kind === 'folder' ? (
        <TextPrompt
          title="New folder"
          label="Folder name"
          initial=""
          confirmLabel="Create folder"
          onClose={() => setDialog(null)}
          onConfirm={(value) => {
            const parentId = dialog.parentId
            setDialog(null)
            void createFolder(parentId, value)
          }}
        />
      ) : null}

      {dialog?.kind === 'rename' ? (
        <TextPrompt
          title="Rename folder"
          label="Folder name"
          initial={dialog.title}
          confirmLabel="Rename"
          onClose={() => setDialog(null)}
          onConfirm={(value) => {
            const id = dialog.id
            setDialog(null)
            void renameFolder(id, value)
          }}
        />
      ) : null}

      {dialog?.kind === 'tag' ? (
        <TextPrompt
          title="Add tag"
          label="Tag"
          initial=""
          confirmLabel="Add tag"
          onClose={() => setDialog(null)}
          onConfirm={(value) => {
            const ids = dialog.ids
            setDialog(null)
            void addTag(ids, value)
          }}
        />
      ) : null}

      {undo.entry ? (
        <UndoToast
          message={undo.entry.message}
          onUndo={() => void undo.undo()}
          onDismiss={undo.dismiss}
        />
      ) : null}
    </div>
  )
}

