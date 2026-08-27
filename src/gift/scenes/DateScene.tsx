import DateReveal from './DateReveal'
import type { DateScene as Scene } from '../../lib/types'

/** A date that was never in doubt, revealed the same way the wheel reveals one. */
export default function DateScene({ scene }: { scene: Scene }) {
  return (
    <DateReveal
      headline={scene.headline}
      lead={scene.lead}
      label={scene.label}
      note={scene.note}
    />
  )
}
