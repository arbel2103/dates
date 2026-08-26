/**
 * Wheel geometry and spin maths.
 *
 * Angles here are clockwise from twelve o'clock, which is where the pointer
 * sits — so "the angle of a slice" and "how far the wheel must turn for the
 * pointer to land on it" are the same number read in opposite directions.
 */

/** The pastel run from the reference: soft, distinct, and never garish. */
export const SLICE_COLORS = [
  '#ECC9CA',
  '#FCDF90',
  '#D9C8EA',
  '#C5CCE3',
  '#CADDC9',
  '#F6D5C0',
  '#CFE7E3',
  '#EAD9C4',
]

export const sliceColor = (index: number): string =>
  SLICE_COLORS[index % SLICE_COLORS.length]

export const sliceAngle = (count: number): number => 360 / Math.max(1, count)

/** The centre of slice `index`, in degrees clockwise from the pointer. */
export const sliceCenter = (index: number, count: number): number =>
  index * sliceAngle(count) + sliceAngle(count) / 2

export interface SlicePath {
  /** SVG path for the wedge, centred on (0,0) */
  d: string
  /** where the label sits, and how far it is rotated to run along the wedge */
  label: { x: number; y: number; rotate: number }
  /** where the emoji sits, out towards the rim */
  emoji: { x: number; y: number; rotate: number }
}

const polar = (radius: number, degrees: number) => {
  const rad = ((degrees - 90) * Math.PI) / 180
  return { x: radius * Math.cos(rad), y: radius * Math.sin(rad) }
}

export function slicePath(index: number, count: number, radius: number): SlicePath {
  const span = sliceAngle(count)
  const from = index * span
  const to = from + span
  const a = polar(radius, from)
  const b = polar(radius, to)
  const large = span > 180 ? 1 : 0
  const mid = from + span / 2

  const at = (r: number, rotate: number) => {
    const p = polar(radius * r, mid)
    return { x: p.x, y: p.y, rotate }
  }

  return {
    d: `M 0 0 L ${a.x.toFixed(3)} ${a.y.toFixed(3)} A ${radius} ${radius} 0 ${large} 1 ${b.x.toFixed(3)} ${b.y.toFixed(3)} Z`,
    // the label runs along the radius, reading outward-to-inward like the
    // reference; +90 turns the baseline from vertical onto the spoke
    label: at(0.62, mid + 90),
    emoji: at(0.86, mid + 90),
  }
}

export interface SpinPlan {
  /** absolute rotation to animate the wheel to, in degrees */
  rotation: number
  /** which slice ends up under the pointer */
  index: number
}

/**
 * Plan a spin that ends with `index` under the pointer.
 *
 * The wheel is only ever rotated forwards, from wherever it currently sits, so
 * repeat spins never snap backwards. The landing point is jittered inside the
 * winning slice: stopping dead centre every time is the tell that a wheel is
 * decorative rather than random.
 */
export function planSpin(
  index: number,
  count: number,
  currentRotation: number,
  turns = 5,
  random: () => number = Math.random,
): SpinPlan {
  const span = sliceAngle(count)
  // stay clear of the dividers, so the pointer never lands ambiguously
  const jitter = (random() - 0.5) * span * 0.7
  const target = 360 - (sliceCenter(index, count) + jitter)
  const spun = currentRotation + (turns + random()) * 360
  // round up to the next multiple of 360 that also lands on the target angle
  const rotation = spun - ((spun % 360) + 360 - target) % 360 + 360
  return { rotation, index }
}

/** Which slice a given rotation leaves under the pointer. */
export function landedIndex(rotation: number, count: number): number {
  const span = sliceAngle(count)
  const under = (((360 - (rotation % 360)) % 360) + 360) % 360
  return Math.floor(under / span) % count
}

/** Pick a winner: the rigged one when set, otherwise an honest draw. */
export function pickWinner(
  ids: string[],
  rigged?: string,
  random: () => number = Math.random,
): number {
  if (rigged) {
    const forced = ids.indexOf(rigged)
    if (forced >= 0) return forced
  }
  return Math.floor(random() * ids.length) % Math.max(1, ids.length)
}

/**
 * Break a slice label so it fits inside its wedge.
 *
 * A wedge is widest at the rim and pinches to nothing at the hub, so a long
 * label set on one line runs straight out past the edge. Two lines and a
 * slightly smaller face keep it inside the paint, which is how the reference
 * handles "ערב משחקי אווזים".
 */
export function wrapLabel(label: string, perLine = 11): string[] {
  const text = label.trim()
  if (text.length <= perLine) return [text]

  const words = text.split(/\s+/)
  if (words.length === 1) return [text]

  // split at the word boundary closest to the middle, so neither line dominates
  const target = text.length / 2
  let best = 1
  let bestGap = Infinity
  for (let i = 1; i < words.length; i++) {
    const gap = Math.abs(words.slice(0, i).join(' ').length - target)
    if (gap < bestGap) {
      bestGap = gap
      best = i
    }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')]
}

/** The face size a label needs to stay inside its wedge. */
export function labelSize(lines: string[], count: number): number {
  const longest = Math.max(...lines.map((l) => l.length))
  const base = count > 6 ? 13 : 15
  if (longest <= 10) return base
  return Math.max(10, Math.round(base * (10 / longest)))
}
