import HandDrawnEllipse from '../fx/HandDrawnEllipse'
import RisingEmoji from '../fx/RisingEmoji'

const INK = '#1F2340'
const ROSE = '#B92A49'

/**
 * The moment the date is named: a headline, the line that introduces it, and
 * the date itself circled by hand while emoji drift up the page.
 *
 * The wheel ends here and the standalone date scene *is* this — one component
 * so that a date revealed by a spin and a date revealed by a letter are the
 * same thing on screen, down to the timings.
 */
export default function DateReveal({
  headline,
  lead,
  label,
  note,
}: {
  headline: string
  lead: string
  label: string
  note: string
}) {
  return (
    <div className="gift-stage">
      <RisingEmoji />

      {headline && (
        <h1
          className="gift-display gift-fade-in"
          style={{ margin: 0, fontSize: 34, color: ROSE, fontWeight: 400 }}
        >
          {headline}
        </h1>
      )}

      {lead && (
        <p
          className="gift-fade-in"
          style={{ margin: '18px 0 34px', fontSize: 16, color: INK, animationDelay: '260ms' }}
        >
          {lead}
        </p>
      )}

      <div style={{ position: 'relative', padding: '14px 34px', maxWidth: '100%' }}>
        <HandDrawnEllipse />
        <span
          className="gift-hand"
          style={{ position: 'relative', fontSize: 27, color: INK, display: 'block' }}
        >
          {label}
        </span>
      </div>

      {note && (
        <p
          className="gift-fade-in"
          style={{
            margin: '38px 0 0',
            fontSize: 15,
            color: INK,
            whiteSpace: 'pre-line',
            animationDelay: '1100ms',
          }}
        >
          {note}
        </p>
      )}
    </div>
  )
}
