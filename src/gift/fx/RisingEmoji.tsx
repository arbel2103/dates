import { useMemo } from 'react'
import { generate } from './random'

/**
 * The burst of hearts, envelopes and sparkles that goes up the screen when
 * something is celebrated. One-shot rather than looping: it marks a moment.
 */
export default function RisingEmoji({
  count = 22,
  seed = 31,
  size = 18,
  spread = 22,
  glyphs = ['💌', '❤️', '✨', '💖', '🎉'],
}: {
  count?: number
  seed?: number
  /** the smallest glyph; the rest are scattered up from here */
  size?: number
  spread?: number
  glyphs?: string[]
}) {
  const items = useMemo(
    () =>
      generate(count, seed, (rand) => ({
        glyph: glyphs[Math.floor(rand() * glyphs.length)],
        left: rand() * 96,
        size: size + rand() * spread,
        dur: 4.5 + rand() * 3,
        delay: rand() * 2.6,
        sway: (rand() - 0.5) * 120,
        spin: (rand() - 0.5) * 80,
        scale: 0.8 + rand() * 0.5,
      })),
    [count, seed, size, spread, glyphs],
  )

  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {items.map((it, i) => (
        <span
          key={i}
          className="rising-emoji"
          style={
            {
              left: `${it.left}%`,
              fontSize: it.size,
              '--dur': `${it.dur}s`,
              '--delay': `${it.delay}s`,
              '--sway': `${it.sway}px`,
              '--spin': `${it.spin}deg`,
              '--scale': it.scale,
            } as React.CSSProperties
          }
        >
          {it.glyph}
        </span>
      ))}
    </div>
  )
}
