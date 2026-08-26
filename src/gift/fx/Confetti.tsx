import { useMemo } from 'react'
import { generate } from './random'

/** The paper burst when the picture becomes whole again. */
export default function Confetti({
  count = 60,
  seed = 41,
  colors = ['#7C6BE8', '#FFFFFF', '#C9C1F5', '#B9A6F2'],
}: {
  count?: number
  seed?: number
  colors?: string[]
}) {
  const bits = useMemo(
    () =>
      generate(count, seed, (rand) => ({
        color: colors[Math.floor(rand() * colors.length)],
        left: rand() * 100,
        width: 5 + rand() * 6,
        height: 9 + rand() * 12,
        dur: 1.6 + rand() * 1.4,
        delay: rand() * 0.7,
        sway: (rand() - 0.5) * 180,
        spin: (rand() - 0.5) * 1080,
      })),
    [count, seed, colors],
  )

  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {bits.map((b, i) => (
        <span
          key={i}
          className="confetti-bit"
          style={
            {
              left: `${b.left}%`,
              width: b.width,
              height: b.height,
              background: b.color,
              '--dur': `${b.dur}s`,
              '--delay': `${b.delay}s`,
              '--sway': `${b.sway}px`,
              '--spin': `${b.spin}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
