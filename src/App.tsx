import { lazy, Suspense, useCallback } from 'react'
import { HashRouter, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom'
import { HostedGiftPage, InlineGiftPage } from './gift/GiftPage'
import SceneStage from './gift/SceneStage'
import { useGifts } from './store/useGifts'

// the studio is only for whoever built the gift; a recipient should never pay
// to download it, so it loads on demand
const StudioApp = lazy(() => import('./studio/StudioApp'))

/**
 * Two audiences, one bundle.
 *
 * `/` is the studio. Everything under `/g` and `/v` is a published gift — the
 * routes a partner opens. HashRouter keeps those links working on GitHub
 * Pages, which has no way to rewrite unknown paths onto index.html, and it is
 * also what keeps a hosted gift's decryption key out of every server log.
 */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/v/:data" element={<InlineGiftPage />} />
        <Route path="/g/:id/:key" element={<HostedGiftPage />} />
        {/* the long form links published before the repo was dropped from the path */}
        <Route path="/g/:owner/:repo/:id/:key" element={<HostedGiftPage />} />
        <Route path="/preview" element={<PreviewPage />} />
        <Route
          path="*"
          element={
            <Suspense fallback={<Loading />}>
              <StudioApp />
            </Suspense>
          }
        />
      </Routes>
    </HashRouter>
  )
}

/** The studio's own window onto a draft, rendered from the local store. */
function PreviewPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const gift = useGifts(useCallback((s) => s.byId(params.get('gift') ?? ''), [params]))

  const close = () => navigate('/')

  if (!gift || gift.scenes.length === 0) {
    return (
      <div className="gift-root">
        <div className="skin skin-red" style={{ opacity: 1 }} aria-hidden />
        <div className="gift-stage">
          <p className="gift-hand" style={{ fontSize: 24 }}>
            אין מה להציג עדיין
          </p>
        </div>
      </div>
    )
  }
  return (
    <>
      <SceneStage scenes={gift.scenes} onDone={close} />
      <button
        onClick={close}
        aria-label="סגור תצוגה מקדימה"
        style={{
          position: 'fixed',
          top: 14,
          left: 14,
          zIndex: 9999,
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'rgba(0,0,0,.45)',
          color: '#fff',
          border: 'none',
          fontSize: 18,
          cursor: 'pointer',
          display: 'grid',
          placeItems: 'center',
          backdropFilter: 'blur(6px)',
        }}
      >
        ✕
      </button>
    </>
  )
}

function Loading() {
  return (
    <div className="h-full grid place-items-center text-muted text-sm">טוען…</div>
  )
}
