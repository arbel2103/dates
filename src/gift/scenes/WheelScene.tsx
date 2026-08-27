import { useMemo, useRef, useState } from 'react'
import DateReveal from './DateReveal'
import { labelSize, pickWinner, planSpin, sliceColor, slicePath, wrapLabel } from '../../lib/wheel'
import type { WheelScene as Scene } from '../../lib/types'

const R = 150
const SPIN_MS = 4600
const INK = '#1F2340'
const ROSE = '#B92A49'

/**
 * The wheel. It can be flicked with a finger or simply tapped; either way the
 * result is decided up front and the animation is planned to land on it, which
 * is the only way a CSS-driven spin can be both smooth and honest.
 */
export default function WheelScene({ scene }: { scene: Scene }) {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState<number | null>(null)
  const dragRef = useRef<{ angle: number; moved: number } | null>(null)
  const wheelRef = useRef<HTMLDivElement>(null)

  const options = scene.options
  const slices = useMemo(
    () =>
      options.map((option, i) => {
        const lines = wrapLabel(option.label)
        return { ...slicePath(i, options.length, R), lines, size: labelSize(lines, options.length) }
      }),
    [options],
  )

  const spin = () => {
    if (spinning || winner !== null || options.length === 0) return
    setSpinning(true)
    const index = pickWinner(
      options.map((o) => o.id),
      scene.rigged,
    )
    const plan = planSpin(index, options.length, rotation)
    setRotation(plan.rotation)
    // the result is held back until the wheel has actually stopped, plus a beat
    window.setTimeout(() => {
      setWinner(plan.index)
      setSpinning(false)
    }, SPIN_MS + 400)
  }

  /* A flick is measured as the angle swept around the hub. Anything under a few
     degrees is treated as a tap, so a clumsy press still spins the wheel. */
  const angleFromEvent = (e: React.PointerEvent) => {
    const box = wheelRef.current?.getBoundingClientRect()
    if (!box) return 0
    const cx = box.left + box.width / 2
    const cy = box.top + box.height / 2
    return (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (spinning || winner !== null) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { angle: angleFromEvent(e), moved: 0 }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    const angle = angleFromEvent(e)
    let delta = angle - drag.angle
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    drag.angle = angle
    drag.moved += Math.abs(delta)
    setRotation((r) => r + delta)
  }

  const onPointerUp = () => {
    dragRef.current = null
    spin()
  }

  if (winner !== null) return <Result scene={scene} winner={winner} />

  return (
    <div className="gift-stage">
      <h1
        className="gift-hand"
        style={{ margin: '0 0 6px', fontSize: 30, color: INK, fontWeight: 400 }}
      >
        {scene.title}
      </h1>
      <p className="gift-hint" style={{ margin: '0 0 26px', color: ROSE }}>
        {scene.subtitle}
      </p>

      <div ref={wheelRef} style={{ position: 'relative', width: 'min(330px, 86vw)', aspectRatio: '1' }}>
        <Pointer spinning={spinning} />
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            width: '100%',
            height: '100%',
            cursor: 'grab',
            touchAction: 'none',
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(.12,.72,.16,1)` : 'none',
            filter: 'drop-shadow(0 18px 34px rgba(31,35,64,.35))',
          }}
        >
          <svg viewBox={`${-R - 6} ${-R - 6} ${(R + 6) * 2} ${(R + 6) * 2}`} style={{ display: 'block' }}>
            {slices.map((slice, i) => (
              <path key={i} d={slice.d} fill={sliceColor(i)} stroke="#FFFCF6" strokeWidth={3} />
            ))}
            <circle r={R} fill="none" stroke={INK} strokeWidth={7} />

            {slices.map((slice, i) => (
              <g key={`t${i}`}>
                <text
                  x={slice.label.x}
                  y={slice.label.y}
                  transform={`rotate(${slice.label.rotate} ${slice.label.x} ${slice.label.y})`}
                  textAnchor="middle"
                  fontFamily="'Gveret Levin', Heebo, cursive"
                  fontSize={slice.size}
                  fill={INK}
                >
                  {slice.lines.map((line, l) => (
                    <tspan
                      key={l}
                      x={slice.label.x}
                      dy={l === 0 ? (slice.lines.length - 1) * -0.5 * slice.size + slice.size * 0.34 : slice.size}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
                <text
                  x={slice.emoji.x}
                  y={slice.emoji.y}
                  transform={`rotate(${slice.emoji.rotate} ${slice.emoji.x} ${slice.emoji.y})`}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={17}
                >
                  {options[i].emoji}
                </text>
              </g>
            ))}

            <circle r={30} fill="#FFFCF6" stroke={INK} strokeWidth={3} />
            <text textAnchor="middle" dominantBaseline="central" fontSize={22} y={1}>
              ❤️
            </text>
          </svg>
        </div>
      </div>
    </div>
  )
}

/** The marker at twelve o'clock, which twitches while the wheel runs past it. */
function Pointer({ spinning }: { spinning: boolean }) {
  return (
    <svg
      viewBox="0 0 28 36"
      width={28}
      height={36}
      aria-hidden
      style={{
        position: 'absolute',
        top: -14,
        left: '50%',
        marginLeft: -14,
        zIndex: 2,
        transformOrigin: '50% 10%',
        animation: spinning ? 'pointer-tick 4600ms cubic-bezier(.12,.72,.16,1)' : 'none',
        filter: 'drop-shadow(0 3px 5px rgba(31,35,64,.4))',
      }}
    >
      <path d="M14 35 L1 6 A13 13 0 0 1 27 6 Z" fill="#B92A49" />
      <style>{`
        @keyframes pointer-tick {
          0%   { transform: rotate(0deg) }
          4%   { transform: rotate(11deg) }
          9%   { transform: rotate(-9deg) }
          16%  { transform: rotate(8deg) }
          26%  { transform: rotate(-6deg) }
          40%  { transform: rotate(5deg) }
          58%  { transform: rotate(-4deg) }
          76%  { transform: rotate(3deg) }
          90%  { transform: rotate(-2deg) }
          100% { transform: rotate(0deg) }
        }
      `}</style>
    </svg>
  )
}

/** What the wheel landed on, circled by hand. */
function Result({ scene, winner }: { scene: Scene; winner: number }) {
  const option = scene.options[winner]
  return (
    <DateReveal
      headline="🎉 מעולה!"
      lead={scene.resultLead}
      label={`${option.emoji} ${option.label}`}
      note={scene.resultNote}
    />
  )
}
