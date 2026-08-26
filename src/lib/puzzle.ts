/**
 * Jigsaw geometry.
 *
 * A piece is a square whose four edges are either flat (the board's border), a
 * tab, or the matching blank. Neighbours share one edge value with opposite
 * signs, which is what makes the cut lines meet exactly and the assembled
 * picture look like one photo rather than a grid.
 */
export type Edge = -1 | 0 | 1

export interface Piece {
  id: number
  row: number
  col: number
  /** clockwise from the top: top, right, bottom, left */
  edges: [Edge, Edge, Edge, Edge]
  /**
   * How the piece lies while it is still loose. Where it lies is decided by
   * the scene, which is the only thing that knows how much screen there is —
   * a piece the thumb cannot reach is an unsolvable puzzle.
   */
  scatter: { rotate: number; jitter: number; lane: number }
}

/* The knob, as fractions of the cell: a true circle on a narrow neck, which is
   what makes a cut read as jigsaw rather than as a wavy grid. */
const KNOB_R = 0.15
const KNOB_OUT = 0.185
/** where the neck meets the circle, in degrees (0 = along the edge, 90 = out) */
const ARC_FROM = 214
const ARC_TO = -34

const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/**
 * Lay out the pieces. `seed` keeps a board stable across re-renders — the
 * pieces must not leap to new spots every time React repaints.
 */
export function buildPieces(rows: number, cols: number, seed = 1): Piece[] {
  const rand = mulberry32(seed)
  // decide the shared edges first, so neighbours can simply read them back
  const vertical: Edge[][] = [] // vertical.[row][col] = edge between col and col+1
  const horizontal: Edge[][] = [] // horizontal.[row][col] = edge between row and row+1
  for (let r = 0; r < rows; r++) {
    vertical[r] = []
    for (let c = 0; c < cols - 1; c++) vertical[r][c] = rand() < 0.5 ? -1 : 1
  }
  for (let r = 0; r < rows - 1; r++) {
    horizontal[r] = []
    for (let c = 0; c < cols; c++) horizontal[r][c] = rand() < 0.5 ? -1 : 1
  }

  const pieces: Piece[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const top: Edge = r === 0 ? 0 : (-horizontal[r - 1][c] as Edge)
      const right: Edge = c === cols - 1 ? 0 : vertical[r][c]
      const bottom: Edge = r === rows - 1 ? 0 : horizontal[r][c]
      const left: Edge = c === 0 ? 0 : (-vertical[r][c - 1] as Edge)
      pieces.push({
        id: r * cols + c,
        row: r,
        col: c,
        edges: [top, right, bottom, left],
        scatter: {
          rotate: (rand() - 0.5) * 32,
          jitter: rand(),
          lane: rand(),
        },
      })
    }
  }
  return pieces
}

/**
 * The outline of one piece, in a coordinate space where the cell is `size`
 * units square and (0,0) is the cell's top-left — tabs stick out beyond that,
 * which is why the rendered piece is padded on every side.
 */
export function piecePath(edges: [Edge, Edge, Edge, Edge], size: number): string {
  const parts = ['M 0 0']
  parts.push(edgePath(edges[0], [0, 0], [size, 0], [0, -1], size))
  parts.push(edgePath(edges[1], [size, 0], [size, size], [1, 0], size))
  parts.push(edgePath(edges[2], [size, size], [0, size], [0, 1], size))
  parts.push(edgePath(edges[3], [0, size], [0, 0], [-1, 0], size))
  parts.push('Z')
  return parts.join(' ')
}

/**
 * One edge, drawn in its own frame: `along` runs from the start corner to the
 * end corner and `out` runs along the outward normal, both as fractions of the
 * cell. The sign of `kind` flips `out`, so a tab and the blank that receives it
 * are the same curve mirrored — which is why neighbours meet exactly.
 */
function edgePath(
  kind: Edge,
  from: [number, number],
  to: [number, number],
  normal: [number, number],
  size: number,
): string {
  if (kind === 0) return `L ${to[0]} ${to[1]}`

  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const point = (along: number, out: number): [number, number] => [
    from[0] + dx * along + normal[0] * out * size * kind,
    from[1] + dy * along + normal[1] * out * size * kind,
  ]
  // a direction in edge-space, mapped the same way but without the origin
  const vector = (along: number, out: number): [number, number] => [
    dx * along + normal[0] * out * size * kind,
    dy * along + normal[1] * out * size * kind,
  ]
  const fmt = (v: [number, number]) => `${v[0].toFixed(2)} ${v[1].toFixed(2)}`
  const add = (a: [number, number], b: [number, number], k: number): [number, number] => [
    a[0] + b[0] * k,
    a[1] + b[1] * k,
  ]

  const rad = (deg: number) => (deg * Math.PI) / 180
  const onCircle = (deg: number) =>
    point(0.5 + KNOB_R * Math.cos(rad(deg)), KNOB_OUT + KNOB_R * Math.sin(rad(deg)))
  // travelling clockwise in this frame means decreasing the angle
  const tangent = (deg: number) => vector(Math.sin(rad(deg)), -Math.cos(rad(deg)))

  const enter = onCircle(ARC_FROM)
  const out: string[] = []

  // shoulder, then a neck that tucks in before flaring to the knob
  const shoulder = 0.5 - KNOB_R - 0.11
  out.push(`L ${fmt(point(shoulder, 0))}`)
  // the first handle stays flat on the edge so the shoulder has no kink in it
  out.push(
    `C ${fmt(point(shoulder + 0.07, 0))} ${fmt(point(shoulder, 0.055))} ${fmt(enter)}`,
  )

  // the circle itself, as three cubic arcs — exact enough to read as round
  const sweep = ARC_FROM - ARC_TO
  const steps = 3
  const step = sweep / steps
  const handle = KNOB_R * (4 / 3) * Math.tan(rad(step) / 4)
  for (let i = 0; i < steps; i++) {
    const a = ARC_FROM - step * i
    const b = a - step
    const c1 = add(onCircle(a), tangent(a), handle)
    const c2 = add(onCircle(b), tangent(b), -handle)
    out.push(`C ${fmt(c1)} ${fmt(c2)} ${fmt(onCircle(b))}`)
  }

  out.push(
    `C ${fmt(point(1 - shoulder, 0.055))} ${fmt(point(1 - shoulder - 0.07, 0))} ${fmt(point(1 - shoulder, 0))}`,
  )
  out.push(`L ${to[0]} ${to[1]}`)
  return out.join(' ')
}

/** How far outside its cell a piece's artwork can reach. */
export const tabOverhang = (size: number): number => size * (KNOB_OUT + KNOB_R) * 1.08

/**
 * A piece snaps when its centre is close enough to its slot. The threshold is
 * generous — this is a love letter, not a dexterity test — but not so generous
 * that two neighbouring slots compete for the same drop.
 */
export const SNAP_RATIO = 0.42

export const isNear = (dx: number, dy: number, cell: number): boolean =>
  Math.hypot(dx, dy) <= cell * SNAP_RATIO

export const formatClock = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
