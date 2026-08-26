import { useState } from 'react'
import type { EnvelopeScene as Scene } from '../../lib/types'

/**
 * The way in. A folded note on the table: nothing happens until it is touched,
 * so the recipient chooses to open the gift rather than being shown it.
 */
export default function EnvelopeScene({
  scene,
  onDone,
}: {
  scene: Scene
  onDone: () => void
}) {
  const [opening, setOpening] = useState(false)

  const open = () => {
    if (opening) return
    setOpening(true)
    window.setTimeout(onDone, 620)
  }

  return (
    <div className="gift-stage">
      <button
        onClick={open}
        aria-label={scene.hint}
        style={{
          position: 'relative',
          width: 190,
          height: 190,
          border: 'none',
          padding: 0,
          background: '#FFF4EE',
          borderRadius: 6,
          cursor: 'pointer',
          boxShadow: '0 20px 44px -16px rgba(60,0,6,.6)',
          transition: 'transform 600ms cubic-bezier(.3,.8,.3,1), opacity 600ms ease',
          transform: opening ? 'scale(1.5) rotateX(72deg)' : 'none',
          opacity: opening ? 0 : 1,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* the fold lines, and the corner turned back on itself */}
        <span style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(150,120,110,.22)' }} />
        <span style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(150,120,110,.22)' }} />
        {/* the corner is turned back on the left, as a right-handed person
            would fold a note — a physical fact, not a reading direction */}
        <span
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 42,
            height: 42,
            background: 'linear-gradient(225deg, #EFE0D0 50%, transparent 50%)',
          }}
        />
        <span style={{ position: 'absolute', top: '20%', left: 0, right: 0, fontSize: 40 }}>
          {scene.emoji}
        </span>
        <span
          className="gift-hand"
          style={{
            position: 'absolute',
            bottom: '20%',
            left: 0,
            right: 0,
            fontSize: 26,
            color: '#241B32',
          }}
        >
          {scene.note}
        </span>
      </button>

      <p className="gift-hint" style={{ marginTop: 28, opacity: opening ? 0 : 0.86, transition: 'opacity 400ms ease' }}>
        {scene.hint}
      </p>
    </div>
  )
}
