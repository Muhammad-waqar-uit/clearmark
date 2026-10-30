import { useCallback, useEffect, useRef, useState } from 'react'

type WindowedListOptions = {
  /** Number of items in the list. */
  count: number
  /** Row height used until a row has actually been measured. */
  estimate: number
  /** Extra rows rendered above and below the viewport. */
  overscan?: number
  /** Set false to render every row, for example while a row is being edited. */
  enabled?: boolean
}

export type WindowedList = {
  /** Attach to the scrolling element. */
  scrollRef: (node: HTMLElement | null) => void
  /** Register a row so its real height can be measured. */
  rowRef: (index: number) => (node: HTMLElement | null) => void
  /** First visible index (inclusive). */
  start: number
  /** Last visible index (exclusive). */
  end: number
  /** Height to reserve above the first rendered row. */
  padTop: number
  /** Height to reserve below the last rendered row. */
  padBottom: number
  /** True when the list is short enough (or unmeasurable) to render in full. */
  disabled: boolean
}

/**
 * Minimal windowing for a scroll container with variable-height rows.
 *
 * Only the rows near the viewport are rendered, with padding above and below
 * standing in for the rest. Heights start from `estimate` and are replaced by
 * real measurements as rows mount, so wrapped tags or an open tag editor do not
 * shift the scroll position.
 *
 * When the container has no measurable height — jsdom, a hidden tab, or the
 * first render before layout — the hook disables itself and every row is
 * rendered, because reserving space for rows it cannot measure would hide them.
 */
export function useWindowedList({
  count,
  estimate,
  overscan = 6,
  enabled = true,
}: WindowedListOptions): WindowedList {
  const [node, setNode] = useState<HTMLElement | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewport, setViewport] = useState(0)
  const heights = useRef<number[]>([])
  const rowNodes = useRef(new Map<number, HTMLElement>())
  const [, forceRemeasure] = useState(0)

  const scrollRef = useCallback((next: HTMLElement | null) => {
    setNode(next)
  }, [])

  useEffect(() => {
    if (!node) return

    const syncViewport = (): void => {
      setViewport(node.clientHeight)
      setScrollTop(node.scrollTop)
    }
    syncViewport()

    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(syncViewport)
    observer?.observe(node)

    /** rAF-throttled so scrolling does not queue a render per wheel tick. */
    let frame = 0
    const onScroll = (): void => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        setScrollTop(node.scrollTop)
      })
    }

    node.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      node.removeEventListener('scroll', onScroll)
      observer?.disconnect()
    }
  }, [node])

  // Fold real row heights back into the model after every render, so the next
  // slice is placed against what is actually on screen.
  useEffect(() => {
    if (!node || rowNodes.current.size === 0) return
    let changed = false
    for (const [index, element] of rowNodes.current) {
      if (!element.isConnected) continue
      const measured = element.getBoundingClientRect().height
      if (measured > 0 && Math.abs((heights.current[index] ?? 0) - measured) > 1) {
        heights.current[index] = measured
        changed = true
      }
    }
    if (changed) forceRemeasure((value) => value + 1)
  })

  const rowRef = useCallback(
    (index: number) => (element: HTMLElement | null) => {
      if (element) rowNodes.current.set(index, element)
      else rowNodes.current.delete(index)
    },
    []
  )

  const disabled = !enabled || viewport <= 0 || count <= 0
  if (disabled) {
    return {
      scrollRef,
      rowRef,
      start: 0,
      end: count,
      padTop: 0,
      padBottom: 0,
      disabled: true,
    }
  }

  const { start, end, padTop, padBottom } = rangeFor({
    heights: heights.current,
    count,
    estimate,
    scrollTop,
    viewport,
    overscan,
  })

  return { scrollRef, rowRef, start, end, padTop, padBottom, disabled: false }
}

export type Range = { start: number; end: number; padTop: number; padBottom: number }

/**
 * Which rows to render for a given scroll position, plus the spacer heights
 * that stand in for the rows outside the range. Pure so it can be tested
 * without a DOM.
 */
export function rangeFor({
  heights,
  count,
  estimate,
  scrollTop,
  viewport,
  overscan = 6,
}: {
  heights: number[]
  count: number
  estimate: number
  scrollTop: number
  viewport: number
  overscan?: number
}): Range {
  if (count <= 0) return { start: 0, end: 0, padTop: 0, padBottom: 0 }

  // Prefix sums let any row's offset be read in constant time.
  const offsets = new Array<number>(count + 1)
  offsets[0] = 0
  for (let index = 0; index < count; index += 1) {
    offsets[index + 1] = offsets[index] + (heights[index] ?? estimate)
  }

  const limit = scrollTop + viewport
  let first = 0
  while (first < count - 1 && offsets[first + 1] <= scrollTop) first += 1
  let last = first
  while (last < count - 1 && offsets[last + 1] < limit) last += 1

  const start = Math.max(0, first - overscan)
  const end = Math.min(count, Math.max(start + 1, last + 1 + overscan))

  return {
    start,
    end,
    padTop: offsets[start],
    padBottom: Math.max(0, offsets[count] - offsets[end]),
  }
}
