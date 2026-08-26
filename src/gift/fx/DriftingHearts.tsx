import { useMemo } from 'react'
import { generate } from './random'

/** Translucent hearts rising the whole height of the red world, forever. */
export default function DriftingHearts({ count = 14, seed = 11 }: { count?: number; seed?: number }) {
  const hearts = useMemo(
    () =>
      generate(count, seed, (rand) => ({
        left: rand() * 100,
        size: 14 + rand() * 30,
        dur: 6 + rand() * 8,
        delay: -rand() * 12,
        peak: 0.1 + rand() * 0.12,
        sway: (rand() - 0.5) * 90,
        spin: (rand() - 0.5) * 60,
      })),
    [count, seed],
  )

  return (
    <>
      {hearts.map((h, i) => (
        <svg
          key={i}
          className="drifting-heart"
          viewBox="0 0 32 30"
          width={h.size}
          height={h.size}
          aria-hidden
          style={
            {
              left: `${h.left}%`,
              '--dur': `${h.dur}s`,
              '--delay': `${h.delay}s`,
              '--peak': h.peak,
              '--sway': `${h.sway}px`,
              '--spin': `${h.spin}deg`,
            } as React.CSSProperties
          }
        >
          <path
            d="M16 29S1 19.6 1 10.9C1 6 4.9 2.2 9.7 2.2c2.8 0 5.2 1.5 6.3 3.4 1.1-1.9 3.5-3.4 6.3-3.4C27.1 2.2 31 6 31 10.9 31 19.6 16 29 16 29Z"
            fill="currentColor"
          />
        </svg>
      ))}
    </>
  )
}
