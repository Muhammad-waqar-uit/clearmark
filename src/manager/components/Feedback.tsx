import type { ReactNode } from 'react'

export function ProgressBar({ done, total }: { done: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label="Progress"
    >
      <div
        className="h-full rounded-full bg-brand-600 transition-[width]"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

type NoticeProps = {
  tone?: 'info' | 'success' | 'error'
  children: ReactNode
}

export function Notice({ tone = 'info', children }: NoticeProps) {
  const tones = {
    info: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300',
    success:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
    error:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300',
  } as const

  return (
    <p className={`rounded-md border px-3 py-2 text-xs ${tones[tone]}`} role="status">
      {children}
    </p>
  )
}

type BulkBarProps = {
  count: number
  onMove: () => void
  onTag: () => void
  onDelete: () => void
  onClear: () => void
}

/** Appears above the list while bookmarks are selected. */
export function BulkBar({ count, onMove, onTag, onDelete, onClear }: BulkBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-brand-200 bg-brand-50 px-3 py-2 text-sm dark:border-brand-700 dark:bg-brand-700/20">
      <span className="font-medium text-brand-700 dark:text-brand-100">
        {count} selected
      </span>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <button type="button" className="btn" onClick={onMove}>
          Move to folder
        </button>
        <button type="button" className="btn" onClick={onTag}>
          Add tag
        </button>
        <button type="button" className="btn btn-danger" onClick={onDelete}>
          Delete
        </button>
        <button type="button" className="btn btn-ghost" onClick={onClear}>
          Clear
        </button>
      </div>
    </div>
  )
}

type UndoToastProps = {
  message: string
  onUndo: () => void
  onDismiss: () => void
}

/** Bottom-centre snackbar with a 10 second undo action. */
export function UndoToast({ message, onUndo, onDismiss }: UndoToastProps) {
  return (
    <div
      className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">
        <span>{message}</span>
        <button
          type="button"
          className="rounded px-2 py-1 text-xs font-semibold text-brand-300 hover:bg-white/10 dark:text-brand-700 dark:hover:bg-slate-900/10"
          onClick={onUndo}
        >
          Undo
        </button>
        <button
          type="button"
          className="rounded px-1.5 py-1 text-xs text-slate-400 hover:bg-white/10"
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
