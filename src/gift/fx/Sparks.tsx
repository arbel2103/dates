import { useMemo } from 'react'
import { generate } from './random'

/** The faint dust that keeps a flat gradient from looking like a flat gradient. */
export default function Sparks({
  count = 40,
  seed = 3,
  color = '#fff',
}: {
  count?: number
  seed?: number
  color?: string
}) {
  const dots = useMemo(
    () =>
      generate(count, seed, (rand) => ({
        left: rand() * 100,
        top: rand() * 100,
        size: 1 + rand() * 2.4,
        dur: 2.6 + rand() * 3.4,
        delay: rand() * 4,
        opacity: 0.25 + rand() * 0.5,
      })),
    [count, seed],
  )

  return (
    <>
      {dots.map((d, i) => (
        <span
          key={i}
          className="spark"
          style={
            {
              left: `${d.left}%`,
              top: `${d.top}%`,
              width: d.size,
              height: d.size,
              background: color,
              opacity: d.opacity,
              '--dur': `${d.dur}s`,
              '--delay': `${d.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </>
  )
}
