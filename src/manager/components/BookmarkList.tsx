import { useEffect, useRef, useState } from 'react'
import { domainOf } from '../../lib/bookmarks'
import type { BookmarkMeta } from '../../lib/types'
import { DRAG_TYPE } from '../drag'
import type { BookmarkWithMeta, ViewMode } from '../filters'
import { EmptyState, LetterAvatar } from './ui'

type BookmarkListProps = {
  items: BookmarkWithMeta[]
  selected: Set<string>
  onToggle: (id: string) => void
  onToggleAll: (ids: string[], checked: boolean) => void
  onEdit: (bookmark: BookmarkWithMeta) => void
  onDelete: (ids: string[]) => void
  onOpen: (url: string) => void
  onSaveMeta: (id: string, meta: BookmarkMeta) => Promise<void>
  view: ViewMode
}

function formatDate(timestamp: number): string {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Scrollable bookmark list with multi-select and inline tags/notes editing. */
export function BookmarkList({
  items,
  selected,
  onToggle,
  onToggleAll,
  onEdit,
  onDelete,
  onOpen,
  onSaveMeta,
  view,
}: BookmarkListProps) {
  const allRef = useRef<HTMLInputElement>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftTags, setDraftTags] = useState('')
  const [draftNote, setDraftNote] = useState('')

  const allSelected = items.length > 0 && items.every((item) => selected.has(item.id))
  const someSelected = items.some((item) => selected.has(item.id))

  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = someSelected && !allSelected
  }, [someSelected, allSelected])

  const startEditing = (bookmark: BookmarkWithMeta): void => {
    setEditingId(bookmark.id)
    setDraftTags(bookmark.meta.tags.join(', '))
    setDraftNote(bookmark.meta.note ?? '')
  }

  const saveEditing = async (id: string): Promise<void> => {
    const tags = Array.from(
      new Set(
        draftTags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      )
    )
    const note = draftNote.trim()
    await onSaveMeta(id, { tags, note: note || undefined })
    setEditingId(null)
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No bookmarks match"
        hint="Try clearing the search or filters, or pick a different folder."
      />
    )
  }

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-500 dark:text-slate-400">
        <input
          ref={allRef}
          type="checkbox"
          className="h-4 w-4 accent-brand-600"
          checked={allSelected}
          onChange={(event) => onToggleAll(items.map((item) => item.id), event.target.checked)}
          aria-label="Select all shown bookmarks"
        />
        <span>Select all</span>
      </div>

      <ul className="flex-1 space-y-1 overflow-auto pb-2" aria-label="Bookmarks">
        {items.map((bookmark) => {
          const isSelected = selected.has(bookmark.id)
          const isEditing = editingId === bookmark.id
          const host = domainOf(bookmark.url)

          return (
            <li key={bookmark.id}>
              <div
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData(DRAG_TYPE, bookmark.id)
                  event.dataTransfer.effectAllowed = 'move'
                }}
                className={`flex items-center gap-2 rounded-md border px-2 py-1.5 transition ${
                  isSelected
                    ? 'border-brand-400 bg-brand-50 dark:border-brand-700 dark:bg-brand-700/20'
                    : 'border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800/60'
                }`}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 accent-brand-600"
                  checked={isSelected}
                  onChange={() => onToggle(bookmark.id)}
                  aria-label={`Select ${bookmark.title}`}
                />
                <LetterAvatar label={host || bookmark.title} seed={bookmark.url} />

                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    className="block max-w-full truncate text-left text-sm font-medium text-slate-800 hover:text-brand-600 hover:underline dark:text-slate-100 dark:hover:text-brand-300"
                    onClick={() => onOpen(bookmark.url)}
                    title={`${bookmark.title}\n${bookmark.url}`}
                  >
                    {bookmark.title}
                  </button>
                  {view === 'list' ? (
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{bookmark.url}</p>
                  ) : null}
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400 dark:text-slate-500">
                    {bookmark.folderPath ? (
                      <span className="truncate" title={bookmark.folderPath}>
                        📁 {bookmark.folderPath}
                      </span>
                    ) : null}
                    {bookmark.meta.tags.map((tag) => (
                      <span key={tag} className="chip">
                        #{tag}
                      </span>
                    ))}
                    {bookmark.meta.note ? (
                      <span title={bookmark.meta.note}>📝 note</span>
                    ) : null}
                    {view === 'list' && bookmark.dateAdded > 0 ? (
                      <time dateTime={new Date(bookmark.dateAdded).toISOString()}>
                        {formatDate(bookmark.dateAdded)}
                      </time>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    className="btn btn-ghost px-1.5 py-1"
                    onClick={() => onEdit(bookmark)}
                    aria-label={`Edit ${bookmark.title}`}
                    title="Edit bookmark"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost px-1.5 py-1"
                    onClick={() => (isEditing ? setEditingId(null) : startEditing(bookmark))}
                    aria-label={`Edit tags and note for ${bookmark.title}`}
                    title="Tags and note"
                  >
                    🏷️
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost px-1.5 py-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                    onClick={() => onDelete([bookmark.id])}
                    aria-label={`Delete ${bookmark.title}`}
                    title="Delete bookmark"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {isEditing ? (
                <div className="ml-8 mr-2 mt-1 rounded-md border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900/60">
                  <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor={`tags-${bookmark.id}`}>
                    Tags (comma separated)
                  </label>
                  <input
                    id={`tags-${bookmark.id}`}
                    className="input mb-2"
                    value={draftTags}
                    onChange={(event) => setDraftTags(event.target.value)}
                    placeholder="design, read later"
                  />
                  <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor={`note-${bookmark.id}`}>
                    Note
                  </label>
                  <textarea
                    id={`note-${bookmark.id}`}
                    className="input mb-2 min-h-[60px] resize-y"
                    value={draftNote}
                    onChange={(event) => setDraftNote(event.target.value)}
                    placeholder="Why did you save this?"
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" className="btn" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => void saveEditing(bookmark.id)}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
