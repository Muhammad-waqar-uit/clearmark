import { useCallback, useEffect, useRef, useState } from 'react'

 




/** Holds a single time-limited undo action (10 seconds by default). */
export function useUndo(timeout = 10000) {
  const [entry, setEntry] = useState(null)
  const timer = useRef(null)

  const stopTimer = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  const dismiss = useCallback(() => {
    stopTimer()
    setEntry(null)
  }, [stopTimer])

  const offer = useCallback(
    (next) => {
      stopTimer()
      setEntry(next)
      timer.current = window.setTimeout(() => setEntry(null), timeout)
    },
    [stopTimer, timeout]
  )

  const undo = useCallback(async () => {
    const current = entry
    dismiss()
    if (current) await current.run()
  }, [entry, dismiss])

  useEffect(() => stopTimer, [stopTimer])

  return { entry, offer, undo, dismiss }
}
