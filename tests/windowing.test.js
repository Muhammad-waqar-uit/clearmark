import { describe, expect, it } from 'vitest'
import { rangeFor } from '../src/manager/useWindowedList'

const uniform = (count, height) => Array(count).fill(height)

/** Total height the rendered rows and both spacers account for. */
function coveredHeight(range, heights) {
  let total = range.padTop + range.padBottom
  for (let index = range.start; index < range.end; index += 1) total += heights[index]
  return total
}

describe('rangeFor', () => {
  it('renders everything when the list is smaller than the viewport', () => {
    const range = rangeFor({ heights: uniform(5, 50), count: 5, estimate: 50, scrollTop: 0, viewport: 600 })
    expect(range.start).toBe(0)
    expect(range.end).toBe(5)
    expect(range.padTop).toBe(0)
    expect(range.padBottom).toBe(0)
  })

  it('renders only the visible window for a long list', () => {
    const range = rangeFor({
      heights: uniform(10000, 50),
      count: 10000,
      estimate: 50,
      scrollTop: 0,
      viewport: 500,
      overscan: 0,
    })
    // 500px viewport over 50px rows is 10 rows, not 10,000.
    expect(range.end - range.start).toBeLessThanOrEqual(11)
    expect(range.start).toBe(0)
  })

  it('keeps the scroll position stable as the top moves', () => {
    const heights = uniform(10000, 50)
    const range = rangeFor({ heights, count: 10000, estimate: 50, scrollTop: 5000, viewport: 500, overscan: 0 })

    // Row 100 starts exactly at 5000px, so it is the first visible row.
    expect(range.start).toBe(100)
    expect(range.padTop).toBe(5000)
    // Everything below the rendered rows is still accounted for by the spacer.
    expect(coveredHeight(range, heights)).toBe(10000 * 50)
  })

  it('accounts for measured rows that differ from the estimate', () => {
    const heights = uniform(100, 40)
    heights[0] = 200 // one row with wrapped tags or an open editor
    const range = rangeFor({ heights, count: 100, estimate: 40, scrollTop: 0, viewport: 200, overscan: 0 })

    expect(coveredHeight(range, heights)).toBe(200 + 99 * 40)
    expect(range.start).toBe(0)
  })

  it('clamps to the end of the list when scrolled to the bottom', () => {
    const heights = uniform(100, 40)
    const range = rangeFor({ heights, count: 100, estimate: 40, scrollTop: 3900, viewport: 100, overscan: 0 })

    expect(range.end).toBe(100)
    expect(range.padBottom).toBe(0)
  })

  it('never renders an empty window for a non-empty list', () => {
    const range = rangeFor({ heights: uniform(10, 40), count: 10, estimate: 40, scrollTop: 0, viewport: 1, overscan: 0 })
    expect(range.end).toBeGreaterThan(range.start)
  })

  it('handles an empty list', () => {
    expect(rangeFor({ heights: [], count: 0, estimate: 40, scrollTop: 0, viewport: 500 })).toEqual({
      start: 0,
      end: 0,
      padTop: 0,
      padBottom: 0,
    })
  })
})
