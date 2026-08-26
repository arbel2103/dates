import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Confetti from '../fx/Confetti'
import {
  buildPieces,
  formatClock,
  isNear,
  piecePath,
  tabOverhang,
  type Piece as PieceModel,
} from '../../lib/puzzle'
import type { PuzzleScene as Scene } from '../../lib/types'

/** How far a loose piece is kept from the edge of the screen. */
const EDGE_MARGIN = 6

interface Held {
  /** how far the piece has been dragged from where it started, in pixels */
  x: number
  y: number
  done: boolean
}

interface Box {
  size: number
  left: number
  top: number
}

/**
 * Put the picture back together. Pieces start scattered around the frame and
 * are dragged home; a piece snaps once it is close enough, so nobody has to
 * fight for pixel accuracy on a phone.
 */
export default function PuzzleScene({
  scene,
  onDone,
}: {
  scene: Scene
  onDone: () => void
}) {
  const rows = Math.max(2, scene.rows)
  const cols = Math.max(2, scene.cols)
  const pieces = useMemo(() => buildPieces(rows, cols, 7), [rows, cols])
  const total = rows * cols

  const boardRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<Box>({ size: 0, left: 0, top: 0 })
  /** the top of the free space under the board, where loose pieces wait */
  const [tray, setTray] = useState(0)
  const [held, setHeld] = useState<Record<number, Held>>({})
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [seconds, setSeconds] = useState(0)
  const drag = useRef<{ id: number; dx: number; dy: number } | null>(null)

  const cell = box.size / cols
  const overhang = tabOverhang(cell)
  const placed = Object.values(held).filter((p) => p.done).length
  // being finished is simply what the board says, not a second copy of the fact
  const complete = total > 0 && placed === total

  // the board is square and sized by its column; its position on screen is what
  // the scatter clamp needs, so both are measured together
  useEffect(() => {
    const measure = () => {
      const rect = boardRef.current?.getBoundingClientRect()
      if (rect) setBox({ size: rect.width, left: rect.left, top: rect.top })
      const stats = statsRef.current?.getBoundingClientRect()
      if (stats) setTray(stats.bottom + 14)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    if (complete) return
    const t = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(t)
  }, [complete])

  /**
   * Where a loose piece waits, as an offset from its slot in board pixels.
   *
   * The reference scatters pieces in a ring around the frame, which a 390px
   * phone simply does not have room for: at three columns the board leaves
   * about forty pixels of margin, far less than a piece. So the pieces lie in
   * the open space under the board instead, in overlapping rows — the same
   * jumbled pile, in the only part of the screen big enough to hold it, and
   * every one of them within reach of a thumb.
   */
  const restOffset = useCallback(
    (piece: PieceModel) => {
      if (box.size === 0 || tray === 0) return { x: 0, y: 0 }
      // only the cell is solid; the tabs around it are mostly empty space, so
      // the piece is kept on screen by its cell rather than its full bounds
      // spaced by a whole cell so each piece is its own target; the tabs still
      // interleave, which is what makes it read as a pile rather than a grid
      const columns = Math.max(2, Math.floor((window.innerWidth - EDGE_MARGIN * 2) / (cell * 1.02)))
      const slot = piece.id % columns
      const row = Math.floor(piece.id / columns)
      const step = (window.innerWidth - EDGE_MARGIN * 2 - cell) / Math.max(1, columns - 1)

      const wantLeft = EDGE_MARGIN + slot * step + (piece.scatter.jitter - 0.5) * cell * 0.16
      const wantTop = tray + row * cell * 1.04 + (piece.scatter.lane - 0.5) * cell * 0.1

      const maxLeft = window.innerWidth - cell - EDGE_MARGIN
      const maxTop = window.innerHeight - cell - EDGE_MARGIN

      return {
        x: clamp(wantLeft, EDGE_MARGIN, maxLeft) - box.left - piece.col * cell,
        y: clamp(wantTop, EDGE_MARGIN, maxTop) - box.top - piece.row * cell,
      }
    },
    [box, cell, tray],
  )

  const onPointerDown = (id: number) => (e: React.PointerEvent) => {
    if (held[id]?.done || complete) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    const current = held[id] ?? { x: 0, y: 0 }
    drag.current = { id, dx: e.clientX - current.x, dy: e.clientY - current.y }
    setDraggingId(id)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    setHeld((s) => ({
      ...s,
      [d.id]: { x: e.clientX - d.dx, y: e.clientY - d.dy, done: false },
    }))
  }

  const onPointerUp = () => {
    const d = drag.current
    drag.current = null
    setDraggingId(null)
    if (!d) return
    setHeld((s) => {
      const cur = s[d.id]
      if (!cur) return s
      // a piece is home when its drag has cancelled out its resting offset
      const rest = restOffset(pieces[d.id])
      if (isNear(cur.x + rest.x, cur.y + rest.y, cell)) {
        return { ...s, [d.id]: { x: -rest.x, y: -rest.y, done: true } }
      }
      return s
    })
  }

  return (
    <div
      className="gift-stage"
      style={{ justifyContent: 'flex-start', paddingTop: 'max(46px, env(safe-area-inset-top))' }}
    >
      {complete && <Confetti />}

      {/* the chrome sits above the pieces: a piece drifting over the title must
          never be the reason an instruction cannot be read */}
      <h1
        className="gift-display"
        style={{
          margin: 0,
          fontSize: 21,
          fontWeight: 400,
          textShadow: '0 2px 10px rgba(80,0,8,.5)',
          position: 'relative',
          zIndex: 40,
        }}
      >
        🧩 {scene.title}
      </h1>
      <p className="gift-hint" style={{ margin: '8px 0 20px', position: 'relative', zIndex: 40 }}>
        {scene.hint}
      </p>

      <div
        className="polaroid"
        style={{ width: 'min(292px, 74vw)', transform: 'rotate(-1deg)' }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <span className="washi-tape" aria-hidden />
        <div
          ref={boardRef}
          data-board=""
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1 / 1',
            background: '#F3EBE4',
            touchAction: 'none',
          }}
        >
          {box.size > 0 &&
            pieces.map((piece) => (
              <Slot key={`slot${piece.id}`} piece={piece} cell={cell} filled={!!held[piece.id]?.done} />
            ))}

          {box.size > 0 &&
            pieces.map((piece) => {
              const rest = restOffset(piece)
              const h = held[piece.id]
              return (
                <Piece
                  key={piece.id}
                  image={scene.image}
                  piece={piece}
                  cell={cell}
                  board={box.size}
                  overhang={overhang}
                  x={rest.x + (h?.x ?? 0)}
                  y={rest.y + (h?.y ?? 0)}
                  done={h?.done ?? false}
                  dragging={draggingId === piece.id}
                  onPointerDown={onPointerDown(piece.id)}
                />
              )
            })}
        </div>
        <span className="polaroid-caption gift-hand">{scene.caption}</span>
      </div>

      <div
        ref={statsRef}
        style={{ display: 'flex', gap: 12, marginTop: 20, position: 'relative', zIndex: 40 }}
      >
        <span className="gift-stat">
          {placed} / {total}
        </span>
        <span className="gift-stat">{formatClock(seconds)}</span>
      </div>

      {complete && (
        <>
          <p
            className="gift-hand pop-in"
            style={{
              margin: '22px 0 0',
              fontSize: 38,
              color: '#B92A49',
              position: 'relative',
              zIndex: 40,
              animationDelay: '260ms',
            }}
          >
            {scene.doneText}
          </p>
          <button
            className="gift-pill pop-in"
            style={{ marginTop: 16, position: 'relative', zIndex: 40, animationDelay: '760ms' }}
            onClick={onDone}
          >
            {scene.doneCta}
          </button>
        </>
      )}
    </div>
  )
}

const clamp = (v: number, lo: number, hi: number) =>
  hi < lo ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v))

/** The outline waiting for a piece, so an empty board still reads as a puzzle. */
function Slot({ piece, cell, filled }: { piece: PieceModel; cell: number; filled: boolean }) {
  return (
    <svg
      viewBox={`0 0 ${cell} ${cell}`}
      width={cell}
      height={cell}
      aria-hidden
      style={{
        position: 'absolute',
        left: piece.col * cell,
        top: piece.row * cell,
        opacity: filled ? 0 : 1,
        overflow: 'visible',
      }}
    >
      <path d={piecePath(piece.edges, cell)} fill="none" stroke="rgba(120,90,86,.24)" strokeWidth={1} />
    </svg>
  )
}

/**
 * One piece: the picture, clipped to that piece's own outline. Every piece
 * carries the whole image at board size and shifts it, so the clip window shows
 * exactly its part — which is what makes a finished board look like an uncut
 * photograph rather than a mosaic.
 */
function Piece({
  image,
  piece,
  cell,
  board,
  overhang,
  x,
  y,
  done,
  dragging,
  onPointerDown,
}: {
  image: string
  piece: PieceModel
  cell: number
  board: number
  overhang: number
  x: number
  y: number
  done: boolean
  dragging: boolean
  onPointerDown: (e: React.PointerEvent) => void
}) {
  const clipId = `clip-${piece.id}`
  const span = cell + overhang * 2

  return (
    <svg
      viewBox={`${-overhang} ${-overhang} ${span} ${span}`}
      width={span}
      height={span}
      data-piece={piece.id}
      onPointerDown={onPointerDown}
      style={{
        position: 'absolute',
        left: piece.col * cell - overhang,
        top: piece.row * cell - overhang,
        transform: `translate(${x}px, ${y}px) rotate(${done ? 0 : piece.scatter.rotate}deg) scale(${dragging ? 1.07 : 1})`,
        transition: dragging ? 'none' : 'transform 160ms cubic-bezier(.2,1.4,.4,1)',
        cursor: done ? 'default' : 'grab',
        touchAction: 'none',
        overflow: 'visible',
        zIndex: done ? 1 : dragging ? 30 : 10,
        filter: done ? 'none' : 'drop-shadow(0 4px 7px rgba(30,0,4,.35))',
      }}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={piecePath(piece.edges, cell)} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <image
          href={image}
          x={-piece.col * cell}
          y={-piece.row * cell}
          width={board}
          height={board}
          preserveAspectRatio="xMidYMid slice"
        />
      </g>
      {!done && (
        <path d={piecePath(piece.edges, cell)} fill="none" stroke="rgba(255,255,255,.5)" strokeWidth={1} />
      )}
    </svg>
  )
}
