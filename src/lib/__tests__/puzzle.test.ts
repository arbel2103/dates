import { describe, expect, it } from 'vitest'
import { buildPieces, formatClock, isNear, piecePath } from '../puzzle'

describe('buildPieces', () => {
  it('makes one piece per cell, in reading order', () => {
    const pieces = buildPieces(3, 4)
    expect(pieces).toHaveLength(12)
    expect(pieces.map((p) => p.id)).toEqual([...Array(12).keys()])
    expect(pieces[5]).toMatchObject({ row: 1, col: 1 })
  })

  it('leaves the outer border flat, so the board is a square', () => {
    const pieces = buildPieces(3, 3)
    for (const piece of pieces) {
      if (piece.row === 0) expect(piece.edges[0]).toBe(0)
      if (piece.col === 2) expect(piece.edges[1]).toBe(0)
      if (piece.row === 2) expect(piece.edges[2]).toBe(0)
      if (piece.col === 0) expect(piece.edges[3]).toBe(0)
    }
  })

  it('gives every shared edge to both neighbours with opposite signs', () => {
    const rows = 4
    const cols = 4
    const pieces = buildPieces(rows, cols, 12)
    const at = (r: number, c: number) => pieces[r * cols + c]

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (c < cols - 1) expect(at(r, c).edges[1]).toBe(-at(r, c + 1).edges[3])
        if (r < rows - 1) expect(at(r, c).edges[2]).toBe(-at(r + 1, c).edges[0])
      }
    }
  })

  it('has no flat inner edges — every inner cut is a tab or a blank', () => {
    for (const piece of buildPieces(3, 3, 4)) {
      if (piece.row > 0) expect(piece.edges[0]).not.toBe(0)
      if (piece.col < 2) expect(piece.edges[1]).not.toBe(0)
    }
  })

  it('is stable for a given seed and different across seeds', () => {
    expect(buildPieces(3, 3, 9)).toEqual(buildPieces(3, 3, 9))
    expect(buildPieces(3, 3, 9)).not.toEqual(buildPieces(3, 3, 10))
  })
})

describe('piecePath', () => {
  it('closes the outline and starts at the cell corner', () => {
    const d = piecePath([0, 1, -1, 0], 100)
    expect(d.startsWith('M 0 0')).toBe(true)
    expect(d.trimEnd().endsWith('Z')).toBe(true)
  })

  it('draws a flat edge as a straight line and a tab as curves', () => {
    expect(piecePath([0, 0, 0, 0], 100)).not.toContain('C')
    expect(piecePath([1, 0, 0, 0], 100)).toContain('C')
  })

  it('mirrors a tab and its blank about the edge', () => {
    // the knob on a top edge reaches above the cell; the blank bites the same
    // distance below it, which is what lets the two interlock
    const tab = topEdgeY(piecePath([1, 0, 0, 0], 100))
    const blank = topEdgeY(piecePath([-1, 0, 0, 0], 100))
    expect(tab.min).toBeLessThan(0)
    expect(blank.max).toBeGreaterThan(0)
    expect(tab.min).toBeCloseTo(-blank.max, 1)
  })
})

/**
 * The y range of the top edge alone. The rest of the outline runs along the
 * cell's other three sides, and those coordinates would drown out the tab.
 */
function topEdgeY(d: string) {
  const topEdge = d.slice(0, d.indexOf('L 100 0'))
  const numbers = topEdge.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? []
  const ys = numbers.filter((_, i) => i % 2 === 1)
  return { min: Math.min(...ys), max: Math.max(...ys) }
}

describe('isNear', () => {
  it('snaps inside the threshold and not outside it', () => {
    expect(isNear(10, 10, 100)).toBe(true)
    expect(isNear(60, 0, 100)).toBe(false)
  })
})

describe('formatClock', () => {
  it('pads to mm:ss', () => {
    expect(formatClock(0)).toBe('00:00')
    expect(formatClock(9)).toBe('00:09')
    expect(formatClock(125)).toBe('02:05')
  })
})
