import { useId, useMemo } from 'react'
import { seeded } from './random'

/**
 * The ring drawn around the answer, the way someone circles a word on paper:
 * two passes that do not quite agree, each a little out of round, drawn on
 * rather than simply appearing.
 */
export default function HandDrawnEllipse({
  color = '#9E1B24',
  width = 3.5,
  duration = 700,
  seed = 5,
}: {
  color?: string
  width?: number
  duration?: number
  seed?: number
}) {
  const id = useId()
  const passes = useMemo(() => [wobblyEllipse(seed), wobblyEllipse(seed + 1)], [seed])

  return (
    <svg
      viewBox="0 0 200 100"
      preserveAspectRatio="none"
      aria-hidden
      style={{ position: 'absolute', inset: '-18% -9%', width: '118%', height: '136%' }}
    >
      {passes.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={width - i * 0.9}
          strokeLinecap="round"
          opacity={i === 0 ? 1 : 0.55}
          style={{
            strokeDasharray: 620,
            strokeDashoffset: 620,
            animation: `draw-${id.replace(/[^\w]/g, '')} ${duration}ms cubic-bezier(.3,.7,.4,1) ${i * 140}ms forwards`,
          }}
        />
      ))}
      <style>{`@keyframes draw-${id.replace(/[^\w]/g, '')} { to { stroke-dashoffset: 0 } }`}</style>
    </svg>
  )
}

/**
 * An ellipse assembled from eight points that each sit slightly off the true
 * curve — enough that the two passes never overlap exactly, which is the whole
 * tell that a hand made it.
 */
function wobblyEllipse(seed: number): string {
  const rand = seeded(seed)
  const cx = 100
  const cy = 50
  const rx = 92
  const ry = 44
  const steps = 8
  const points: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2 - 0.35
    const jitterX = (rand() - 0.5) * 7
    const jitterY = (rand() - 0.5) * 5
    points.push([cx + Math.cos(a) * rx + jitterX, cy + Math.sin(a) * ry + jitterY])
  }
  // close past the start, the way a circled word is overshot rather than met
  points.push([points[1][0] + 6, points[1][1] + 2])

  let d = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const cur = points[i]
    const mx = (prev[0] + cur[0]) / 2
    const my = (prev[1] + cur[1]) / 2
    d += ` Q ${prev[0].toFixed(1)} ${prev[1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`
  }
  return d
}
