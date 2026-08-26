import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import SceneStage from './SceneStage'
import { decodeInline, openSealed, type GiftPayload } from '../lib/giftCodec'
import { fetchGiftBlob } from '../lib/github/client'
import type { Scene } from '../lib/types'
import './gift.css'

type Status =
  | { state: 'loading' }
  | { state: 'ready'; scenes: Scene[] }
  | { state: 'error'; message: string }

/** A gift that travelled inside its own link. */
export function InlineGiftPage() {
  const { data } = useParams()
  return <Resolver load={() => decodeInline(data ?? '')} />
}

/**
 * A gift that was too big for a link. The ciphertext is fetched from the repo
 * and opened with the key from the fragment — which reached this browser and
 * no server along the way.
 */
export function HostedGiftPage() {
  const { owner, repo, id, key } = useParams()
  return (
    <Resolver
      load={async () => {
        const blob = await fetchGiftBlob(`${owner}/${repo}`, `${id}.bin`)
        return openSealed(blob, key ?? '')
      }}
    />
  )
}

function Resolver({ load }: { load: () => Promise<GiftPayload> }) {
  const [status, setStatus] = useState<Status>({ state: 'loading' })

  useEffect(() => {
    let alive = true
    load()
      .then((payload) => {
        if (!alive) return
        if (payload.scenes.length === 0) throw new Error('המתנה ריקה')
        setStatus({ state: 'ready', scenes: payload.scenes })
      })
      .catch((err: unknown) => {
        if (!alive) return
        setStatus({
          state: 'error',
          message: err instanceof Error ? err.message : 'הקישור לא תקין',
        })
      })
    return () => {
      alive = false
    }
    // the loader closes over route params, which is exactly when a reload is wanted
  }, [load])

  if (status.state === 'ready') return <SceneStage scenes={status.scenes} />

  return (
    <div className="gift-root">
      <div className="skin skin-red" style={{ opacity: 1 }} aria-hidden />
      <div className="gift-stage">
        {status.state === 'loading' ? (
          <p className="gift-hand" style={{ fontSize: 26 }}>
            רגע…
          </p>
        ) : (
          <>
            <p className="gift-hand" style={{ fontSize: 26, margin: 0 }}>
              משהו השתבש
            </p>
            <p className="gift-hint" style={{ marginTop: 12 }}>
              {status.message}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
