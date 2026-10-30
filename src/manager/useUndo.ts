import { useCallback, useEffect, useRef, useState } from 'react'

export type UndoEntry = {
  message: string
  run: () => Promise<void>
}

/** Holds a single time-limited undo action (10 seconds by default). */
export function useUndo(timeout = 10_000) {
  const [entry, setEntry] = useState<UndoEntry | null>(null)
  const timer = useRef<number | null>(null)

  const stopTimer = useCallback((): void => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  const dismiss = useCallback((): void => {
    stopTimer()
    setEntry(null)
  }, [stopTimer])

  const offer = useCallback(
    (next: UndoEntry): void => {
      stopTimer()
      setEntry(next)
      timer.current = window.setTimeout(() => setEntry(null), timeout)
    },
    [stopTimer, timeout]
  )

  const undo = useCallback(async (): Promise<void> => {
    const current = entry
    dismiss()
    if (current) await current.run()
  }, [entry, dismiss])

  useEffect(() => stopTimer, [stopTimer])

  return { entry, offer, undo, dismiss }
}
