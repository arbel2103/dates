import { useMemo } from 'react'
import { generate } from './random'

/**
 * The night sky. Stars thin out towards the bottom of the screen, where the
 * hills are — a uniform scatter reads as noise rather than as a sky.
 */
export default function Stars({ count = 90, seed = 21 }: { count?: number; seed?: number }) {
  const stars = useMemo(
    () =>
      generate(count, seed, (rand) => {
        const top = Math.pow(rand(), 1.5) * 88
        return {
          left: rand() * 100,
          top,
          size: 1 + rand() * 2.2,
          dur: 2.2 + rand() * 4,
          delay: rand() * 5,
          opacity: 0.35 + rand() * 0.55,
        }
      }),
    [count, seed],
  )

  return (
    <>
      {stars.map((s, i) => (
        <span
          key={i}
          className="spark"
          style={
            {
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
              '--dur': `${s.dur}s`,
              '--delay': `${s.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </>
  )
}
