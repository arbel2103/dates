import type { SceneType, Skin } from '../../lib/types'

/** Which world each kind of scene belongs to. */
export const SKIN_FOR: Record<SceneType, Skin> = {
  envelope: 'red',
  letter: 'red',
  puzzle: 'red',
  gallery: 'red',
  wheel: 'paper',
  date: 'paper',
}
