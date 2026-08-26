import { useMemo, useState } from 'react'
import EnvelopeScene from './scenes/EnvelopeScene'
import GalleryScene from './scenes/GalleryScene'
import InviteScene from './scenes/InviteScene'
import LetterScene from './scenes/LetterScene'
import PuzzleScene from './scenes/PuzzleScene'
import WheelScene from './scenes/WheelScene'
import { SkinLayer } from './skins/Skins'
import { SKIN_FOR } from './skins/skinFor'
import type { Scene, Skin } from '../lib/types'
import './gift.css'

const FADE_MS = 480

/**
 * Runs a gift from the first scene to the last.
 *
 * Both worlds are mounted whenever the skin changes, and the new one is faded
 * up over the old one — that dissolve from the red room into the night sky is
 * the transition itself, not a cut between two pages.
 */
export default function SceneStage({ scenes, onDone }: { scenes: Scene[]; onDone?: () => void }) {
  const [index, setIndex] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const scene = scenes[Math.min(index, scenes.length - 1)]
  const skin: Skin = SKIN_FOR[scene.type] ?? 'red'

  // every world the gift visits stays mounted; only their opacity changes, so
  // the change of skin is a dissolve rather than one page replacing another
  const worlds = useMemo(() => {
    const seen = new Set<Skin>()
    for (const s of scenes) seen.add(SKIN_FOR[s.type] ?? 'red')
    return [...seen]
  }, [scenes])

  const advance = () => {
    if (leaving) return
    if (index >= scenes.length - 1) {
      onDone?.()
      return
    }
    setLeaving(true)
    window.setTimeout(() => {
      setIndex((n) => n + 1)
      setLeaving(false)
    }, FADE_MS)
  }

  return (
    <div className="gift-root">
      {worlds.map((world) => (
        <SkinLayer key={world} skin={world} opacity={world === skin ? 1 : 0} />
      ))}

      <div key={index} className={leaving ? 'gift-fade-out' : 'gift-fade-in'} style={{ position: 'absolute', inset: 0 }}>
        <SceneBody scene={scene} onDone={advance} />
      </div>
    </div>
  )
}

function SceneBody({ scene, onDone }: { scene: Scene; onDone: () => void }) {
  switch (scene.type) {
    case 'envelope':
      return <EnvelopeScene scene={scene} onDone={onDone} />
    case 'letter':
      return <LetterScene scene={scene} onDone={onDone} />
    case 'puzzle':
      return <PuzzleScene scene={scene} onDone={onDone} />
    case 'gallery':
      return <GalleryScene scene={scene} onDone={onDone} />
    case 'wheel':
      return <WheelScene scene={scene} />
    case 'invite':
      return <InviteScene scene={scene} />
  }
}
