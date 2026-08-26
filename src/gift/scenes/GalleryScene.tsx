import { useState } from 'react'
import type { GalleryScene as Scene } from '../../lib/types'

/**
 * A stack of polaroids to go through one at a time. The top card slides away
 * on a tap rather than a swipe: this runs inside a chat app's browser on a
 * phone, where a horizontal swipe often belongs to the app, not the page.
 */
export default function GalleryScene({
  scene,
  onDone,
}: {
  scene: Scene
  onDone: () => void
}) {
  const [index, setIndex] = useState(0)
  const [leaving, setLeaving] = useState(false)

  const next = () => {
    if (leaving) return
    setLeaving(true)
    window.setTimeout(() => {
      if (index + 1 >= scene.photos.length) onDone()
      else {
        setIndex((n) => n + 1)
        setLeaving(false)
      }
    }, 460)
  }

  // the two cards peeking out from under the top one
  const behind = scene.photos.slice(index + 1, index + 3)

  return (
    <div className="gift-stage">
      <div style={{ position: 'relative', width: 'min(300px, 78vw)' }}>
        {behind.map((_, i) => (
          <div
            key={i}
            className="polaroid"
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              transform: `rotate(${(i + 1) * (i % 2 ? 3 : -3)}deg) scale(${1 - (i + 1) * 0.03})`,
              zIndex: -i - 1,
            }}
          >
            <div style={{ paddingTop: '100%', background: '#E8DED6' }} />
          </div>
        ))}

        <button
          onClick={next}
          className="polaroid"
          style={{
            display: 'block',
            width: '100%',
            border: 'none',
            cursor: 'pointer',
            transform: leaving ? 'translateX(-130%) rotate(-18deg)' : 'rotate(-1.5deg)',
            opacity: leaving ? 0 : 1,
            transition: 'transform 460ms cubic-bezier(.4,.1,.6,1), opacity 460ms ease',
          }}
        >
          <img
            src={scene.photos[index].src}
            alt={scene.photos[index].caption ?? ''}
            style={{ display: 'block', width: '100%', aspectRatio: '1 / 1', objectFit: 'cover' }}
          />
          <span className="polaroid-caption gift-hand">
            {scene.photos[index].caption}
          </span>
        </button>
      </div>

      <p className="gift-hint" style={{ marginTop: 30 }}>
        {scene.hint} ←
      </p>
    </div>
  )
}
