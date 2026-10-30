 function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import { useCallback, useEffect, useRef, useState } from 'react'





























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
}) {
  const [node, setNode] = useState(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewport, setViewport] = useState(0)
  const heights = useRef([])
  const rowNodes = useRef(new Map())
  const [, forceRemeasure] = useState(0)

  const scrollRef = useCallback((next) => {
    setNode(next)
  }, [])

  useEffect(() => {
    if (!node) return

    const syncViewport = () => {
      setViewport(node.clientHeight)
      setScrollTop(node.scrollTop)
    }
    syncViewport()

    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(syncViewport)
    _optionalChain([observer, 'optionalAccess', _ => _.observe, 'call', _2 => _2(node)])

    /** rAF-throttled so scrolling does not queue a render per wheel tick. */
    let frame = 0
    const onScroll = () => {
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
      _optionalChain([observer, 'optionalAccess', _3 => _3.disconnect, 'call', _4 => _4()])
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
      if (measured > 0 && Math.abs((_nullishCoalesce(heights.current[index], () => ( 0))) - measured) > 1) {
        heights.current[index] = measured
        changed = true
      }
    }
    if (changed) forceRemeasure((value) => value + 1)
  })

  const rowRef = useCallback(
    (index) => (element) => {
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
}






) {
  if (count <= 0) return { start: 0, end: 0, padTop: 0, padBottom: 0 }

  // Prefix sums let any row's offset be read in constant time.
  const offsets = new Array(count + 1)
  offsets[0] = 0
  for (let index = 0; index < count; index += 1) {
    offsets[index + 1] = offsets[index] + (_nullishCoalesce(heights[index], () => ( estimate)))
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
