import { useEffect, useRef, useState } from 'react'
import type { LetterScene as Scene } from '../../lib/types'

/** Punctuation is where a person writing by hand would pause. */
const PAUSE_AFTER = new Set([',', '.', '!', '?', '…', ':', '\n'])
const PAUSE_MS = 220

/**
 * The letter writes itself. The whole point is that the page is empty when it
 * opens: the recipient watches the words arrive at reading speed instead of
 * being handed a finished block of text.
 */
export default function LetterScene({
  scene,
  onDone,
}: {
  scene: Scene
  onDone: () => void
}) {
  const [shown, setShown] = useState(0)
  const done = shown >= scene.text.length
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (done) return
    const char = scene.text[shown]
    const delay = Math.max(8, scene.speed) + (PAUSE_AFTER.has(char) ? PAUSE_MS : 0)
    timer.current = window.setTimeout(() => setShown((n) => n + 1), delay)
    return () => window.clearTimeout(timer.current)
  }, [shown, done, scene.text, scene.speed])

  // a tap finishes the letter rather than skipping it — nobody should be stuck
  // watching a long letter they already know the shape of
  const reveal = () => setShown(scene.text.length)

  return (
    <div className="gift-stage" onClick={done ? undefined : reveal}>
      <div className="note-card gift-fade-in">
        <span className="washi-tape" aria-hidden />
        <p
          className="gift-hand"
          style={{
            margin: 0,
            fontSize: 22,
            lineHeight: '44px',
            textAlign: 'start',
            whiteSpace: 'pre-wrap',
            minHeight: 44 * 5,
          }}
        >
          {scene.text.slice(0, shown)}
          {!done && <span className="caret" />}
        </p>
      </div>

      {done && (
        <button className="gift-pill pop-in" style={{ marginTop: 26 }} onClick={onDone}>
          {scene.cta} ←
        </button>
      )}
    </div>
  )
}
