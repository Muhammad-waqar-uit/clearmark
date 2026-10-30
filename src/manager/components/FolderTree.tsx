import { useState } from 'react'
import type { FolderNode } from '../../lib/types'
import { DRAG_TYPE } from '../drag'

type FolderTreeProps = {
  folderTree: FolderNode[]
  counts: Record<string, number>
  totalCount: number
  selectedFolder: string
  onSelect: (folderId: string) => void
  onDropBookmark: (folderId: string, bookmarkId: string) => void
}


/** Sidebar listing every folder; bookmarks can be dragged onto a folder. */
export function FolderTree({
  folderTree,
  counts,
  totalCount,
  selectedFolder,
  onSelect,
  onDropBookmark,
}: FolderTreeProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [dragOver, setDragOver] = useState<string | null>(null)

  const toggle = (id: string): void => {
    setCollapsed((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const renderNode = (node: FolderNode, depth: number) => {
    const isOpen = !collapsed.has(node.id)
    const hasChildren = node.children.length > 0
    const isSelected = selectedFolder === node.id

    return (
      <li key={node.id}>
        <div
          className={`group flex items-center gap-1 rounded-md pr-2 text-sm ${
            isSelected
              ? 'bg-brand-600 text-white'
              : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
          } ${dragOver === node.id ? 'ring-2 ring-brand-500' : ''}`}
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
          onDragOver={(event) => {
            if (!event.dataTransfer.types.includes(DRAG_TYPE)) return
            event.preventDefault()
            setDragOver(node.id)
          }}
          onDragLeave={() => setDragOver((current) => (current === node.id ? null : current))}
          onDrop={(event) => {
            event.preventDefault()
            setDragOver(null)
            const bookmarkId = event.dataTransfer.getData(DRAG_TYPE)
            if (bookmarkId) onDropBookmark(node.id, bookmarkId)
          }}
        >
          <button
            type="button"
            className={`flex h-6 w-5 shrink-0 items-center justify-center text-xs ${
              hasChildren ? 'opacity-80' : 'invisible'
            }`}
            onClick={() => toggle(node.id)}
            aria-label={isOpen ? `Collapse ${node.title}` : `Expand ${node.title}`}
          >
            {isOpen ? '▾' : '▸'}
          </button>
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-left"
            onClick={() => onSelect(node.id)}
            aria-current={isSelected ? 'true' : undefined}
          >
            <span aria-hidden="true">📁</span>
            <span className="truncate">{node.title}</span>
          </button>
          <span
            className={`shrink-0 rounded px-1 text-[11px] ${
              isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {counts[node.id] ?? 0}
          </span>
        </div>
        {hasChildren && isOpen ? (
          <ul>{node.children.map((child) => renderNode(child, depth + 1))}</ul>
        ) : null}
      </li>
    )
  }

  return (
    <nav aria-label="Bookmark folders" className="text-sm">
      <button
        type="button"
        className={`mb-1 flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left ${
          selectedFolder === 'all'
            ? 'bg-brand-600 text-white'
            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
        }`}
        onClick={() => onSelect('all')}
        aria-current={selectedFolder === 'all' ? 'true' : undefined}
      >
        <span aria-hidden="true">🗂️</span>
        <span className="flex-1">All bookmarks</span>
        <span
          className={`rounded px-1 text-[11px] ${
            selectedFolder === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          {totalCount}
        </span>
      </button>
      <ul>{folderTree.map((node) => renderNode(node, 0))}</ul>
      {folderTree.length === 0 ? (
        <p className="px-2 py-3 text-xs text-slate-400">No folders yet.</p>
      ) : null}
    </nav>
  )
}
