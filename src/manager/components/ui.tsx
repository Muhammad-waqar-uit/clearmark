import { useEffect, type ReactNode } from 'react'

type ModalProps = {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

/** Accessible dialog used for create, edit and move flows. */
export function Modal({ title, onClose, children, footer }: ModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="card w-full max-w-md p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <button type="button" className="btn btn-ghost px-2" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>
        {children}
        {footer ? <div className="mt-5 flex justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  )
}

const AVATAR_COLORS = [
  'bg-brand-100 text-brand-700 dark:bg-brand-700/30 dark:text-brand-100',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-700/30 dark:text-emerald-100',
  'bg-amber-100 text-amber-700 dark:bg-amber-700/30 dark:text-amber-100',
  'bg-rose-100 text-rose-700 dark:bg-rose-700/30 dark:text-rose-100',
  'bg-sky-100 text-sky-700 dark:bg-sky-700/30 dark:text-sky-100',
  'bg-purple-100 text-purple-700 dark:bg-purple-700/30 dark:text-purple-100',
]

/** Deterministic letter tile, used instead of remote favicon requests. */
export function LetterAvatar({ label, seed }: { label: string; seed?: string }) {
  const source = seed ?? label
  const index = Array.from(source).reduce((total, char) => total + char.charCodeAt(0), 0) % AVATAR_COLORS.length
  return (
    <span
      aria-hidden="true"
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs font-semibold ${AVATAR_COLORS[index]}`}
    >
      {label.slice(0, 1).toUpperCase()}
    </span>
  )
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</p>
      {hint ? <p className="max-w-sm text-xs text-slate-400 dark:text-slate-500">{hint}</p> : null}
    </div>
  )
}
