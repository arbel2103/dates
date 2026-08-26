import { describe, expect, it } from 'vitest'
import { landedIndex, pickWinner, planSpin, sliceCenter, slicePath } from '../wheel'

/** A stand-in for Math.random that walks a fixed sequence. */
const sequence = (...values: number[]) => {
  let i = 0
  return () => values[i++ % values.length]
}

describe('planSpin', () => {
  it('always lands the pointer on the slice it was asked for', () => {
    let rotation = 0
    for (let n = 0; n < 500; n++) {
      const count = 2 + (n % 7)
      const index = n % count
      const plan = planSpin(index, count, rotation)
      expect(landedIndex(plan.rotation, count)).toBe(index)
      rotation = plan.rotation
    }
  })

  it('only ever turns forwards, so repeat spins never snap back', () => {
    let rotation = 0
    for (let n = 0; n < 200; n++) {
      const plan = planSpin(n % 5, 5, rotation)
      expect(plan.rotation).toBeGreaterThan(rotation)
      rotation = plan.rotation
    }
  })

  it('turns at least the requested number of times', () => {
    const plan = planSpin(0, 5, 0, 5, sequence(0.5))
    expect(plan.rotation).toBeGreaterThanOrEqual(5 * 360)
  })

  it('does not stop dead centre every time', () => {
    const centred = planSpin(1, 4, 0, 5, sequence(0.5)).rotation % 360
    const offset = planSpin(1, 4, 0, 5, sequence(0.9, 0.5)).rotation % 360
    expect(offset).not.toBeCloseTo(centred, 5)
  })
})

describe('sliceCenter', () => {
  it('splits the circle evenly from twelve o’clock', () => {
    expect(sliceCenter(0, 4)).toBe(45)
    expect(sliceCenter(3, 4)).toBe(315)
  })
})

describe('slicePath', () => {
  it('draws a closed wedge from the hub', () => {
    const path = slicePath(0, 5, 150)
    expect(path.d.startsWith('M 0 0')).toBe(true)
    expect(path.d.endsWith('Z')).toBe(true)
  })

  it('puts the emoji further out than the label', () => {
    const path = slicePath(0, 4, 150)
    expect(Math.hypot(path.emoji.x, path.emoji.y)).toBeGreaterThan(
      Math.hypot(path.label.x, path.label.y),
    )
  })
})

describe('pickWinner', () => {
  it('honours a rigged option', () => {
    expect(pickWinner(['a', 'b', 'c'], 'c', sequence(0.1))).toBe(2)
  })

  it('ignores a rigged id that is no longer on the wheel', () => {
    expect(pickWinner(['a', 'b'], 'gone', sequence(0.9))).toBe(1)
  })

  it('stays in range', () => {
    for (let n = 0; n < 100; n++) {
      const winner = pickWinner(['a', 'b', 'c'])
      expect(winner).toBeGreaterThanOrEqual(0)
      expect(winner).toBeLessThan(3)
    }
  })
})
