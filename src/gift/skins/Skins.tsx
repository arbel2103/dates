import DriftingHearts from '../fx/DriftingHearts'
import ScallopBand from '../fx/ScallopBand'
import Sparks from '../fx/Sparks'
import type { Skin } from '../../lib/types'

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
    </div>
  )
}
