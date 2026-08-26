import { useCallback, useEffect, useRef, useState } from 'react'
import RisingEmoji from '../fx/RisingEmoji'
import type { InviteScene as Scene } from '../../lib/types'

/** How the buttons react to each dodge. */
const SHRINK = 0.88
const MIN_SCALE = 0.35
const GROW = 1.1
const MAX_SCALE = 1.9
const JUMP = 120
/** Where the two buttons sit before anyone reaches for them. */
const SPREAD = 82

/**
 * The ask. Lines arrive one at a time, then the question — and the button that
 * says no will not be caught: it shrinks and moves away while yes grows to fill
 * the space, so there is only ever one real answer.
 */
export default function InviteScene({ scene }: { scene: Scene }) {
  const [shownLines, setShownLines] = useState(0)
  const [asked, setAsked] = useState(false)
  const [dodges, setDodges] = useState(0)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [yes, setYes] = useState(false)

  // the lines land on their own beat, then the question follows them
  useEffect(() => {
    if (shownLines >= scene.lines.length) {
      const t = window.setTimeout(() => setAsked(true), 700)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(() => setShownLines((n) => n + 1), shownLines === 0 ? 400 : 1250)
    return () => window.clearTimeout(t)
  }, [shownLines, scene.lines.length])

  const dodge = useCallback(() => {
    setDodges((n) => n + 1)
    setOffset({
      x: (Math.random() - 0.5) * 2 * JUMP,
      y: (Math.random() - 0.5) * 2 * JUMP,
    })
  }, [])

  // both buttons are placed from the centre so the growing yes and the fleeing
  // no never fight over the same spot in the flow
  const yesOffset = SPREAD - dodges * 4

  if (yes) return <Accepted scene={scene} />

  const noScale = Math.max(MIN_SCALE, SHRINK ** dodges)
  const yesScale = Math.min(MAX_SCALE, GROW ** dodges)

  return (
    <div className="gift-stage">
      <div style={{ minHeight: '30vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 18 }}>
        {scene.lines.slice(0, shownLines).map((line, i) => (
          <p key={i} className="gift-hand line-in" style={{ margin: 0, fontSize: 21, color: '#F3EEFA' }}>
            {line}
          </p>
        ))}
      </div>

      {asked && (
        <div className="line-in" style={{ marginTop: 44, width: '100%' }}>
          <h1 className="gift-display" style={{ margin: 0, fontSize: 26, fontWeight: 400, color: '#FFF7F0' }}>
            {scene.question}
          </h1>
          {scene.hint && (
            <p style={{ margin: '12px 0 0', fontSize: 13, color: '#C9A85E' }}>{scene.hint}</p>
          )}

          <div
            style={{
              position: 'relative',
              marginTop: 40,
              height: 150,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <button
              className="gift-pill"
              onClick={() => setYes(true)}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${yesOffset}px), -50%) scale(${yesScale})`,
                transition: 'transform 260ms cubic-bezier(.2,1.3,.4,1)',
                fontSize: 17,
                padding: '13px 34px',
              }}
            >
              {scene.yesLabel}
            </button>

            <RunawayButton
              label={scene.noLabel}
              scale={noScale}
              offset={dodges === 0 ? { x: -SPREAD, y: 0 } : offset}
              faded={dodges >= 4}
              onDodge={dodge}
            />
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * The button that will not be pressed. It moves on the first hint of intent —
 * a hover on a mouse, a touch anywhere near it on a phone — because on a
 * touchscreen there is no hover to warn it, and a button that only dodges
 * after being tapped has already been pressed.
 */
function RunawayButton({
  label,
  scale,
  offset,
  faded,
  onDodge,
}: {
  label: string
  scale: number
  offset: { x: number; y: number }
  faded: boolean
  onDodge: () => void
}) {
  const ref = useRef<HTMLButtonElement>(null)

  const flee = (e: React.SyntheticEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDodge()
  }

  return (
    <button
      ref={ref}
      className="gift-pill"
      onPointerEnter={flee}
      onPointerDown={flee}
      onClick={flee}
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
        transition: 'transform 220ms cubic-bezier(.3,1.2,.4,1), opacity 300ms ease',
        opacity: faded ? 0.45 : 1,
        fontSize: 17,
        padding: '13px 34px',
      }}
    >
      {label}
    </button>
  )
}

/** What follows a yes: the celebration, the plan, and the way to answer back. */
function Accepted({ scene }: { scene: Scene }) {
  return (
    <div className="gift-stage" style={{ justifyContent: 'center' }}>
      <RisingEmoji count={24} seed={57} size={14} spread={16} glyphs={['💜', '🤍', '❤️', '✨']} />

      <h1
        className="gift-display pop-in"
        style={{ margin: 0, fontSize: 30, fontWeight: 400, color: '#FFF7F0' }}
      >
        {scene.celebration}
      </h1>

      <div className="note-card gift-fade-in" style={{ marginTop: 34, animationDelay: '260ms' }}>
        <span className="washi-tape" aria-hidden />
        <p className="gift-hand" style={{ margin: '0 0 14px', fontSize: 21, textAlign: 'start' }}>
          {scene.detailsTitle}
        </p>
        {scene.details.map((detail, i) => (
          <p
            key={i}
            className="line-in"
            style={{
              margin: '0 0 6px',
              fontSize: 15,
              lineHeight: '38px',
              animationDelay: `${500 + i * 250}ms`,
            }}
          >
            {detail.emoji} {detail.text}
          </p>
        ))}
      </div>

    </div>
  )
}
