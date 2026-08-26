import DriftingHearts from '../fx/DriftingHearts'
import Hills from '../fx/Hills'
import Moon from '../fx/Moon'
import ScallopBand from '../fx/ScallopBand'
import Sparks from '../fx/Sparks'
import Stars from '../fx/Stars'
import type { Skin } from '../../lib/types'

/**
 * The three worlds a scene can sit in. They are rendered as separate layers so
 * two can be on screen at once and cross-fade — the dissolve from the red room
 * into the night sky is the transition, not a cut.
 */
export function SkinLayer({ skin, opacity }: { skin: Skin; opacity: number }) {
  return (
    <div className={`skin skin-${skin}`} style={{ opacity }} aria-hidden>
      {skin === 'red' && (
        <>
          <Sparks count={40} seed={3} />
          <DriftingHearts count={14} seed={11} />
          <ScallopBand />
        </>
      )}
      {skin === 'night' && (
        <>
          <Stars count={90} seed={21} />
          <Moon />
          <Hills />
        </>
      )}
    </div>
  )
}
