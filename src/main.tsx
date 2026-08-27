import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/*
 * Offline support (PWA) — production only, so it never fights dev HMR.
 *
 * Keeping the home-screen app current takes three things: a worker whose bytes
 * change per deploy (stamped at build time), somewhere to notice a new one, and
 * a reload once it takes over. The check runs whenever the app comes back to
 * the foreground, because an installed app is resumed rather than reloaded —
 * on iOS especially, that resume is the only moment an update can be caught
 * without the user going back to Safari.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  // was this tab already under a worker? if not, the first install claiming it
  // is not an update, and reloading for it would be a pointless round trip
  const hadController = Boolean(navigator.serviceWorker.controller)

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(import.meta.env.BASE_URL + 'sw.js')
      .then((reg) => {
        const check = () => reg.update().catch(() => {})
        check()
        setInterval(check, 60_000)
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') check()
        })
        window.addEventListener('focus', check)
      })
      .catch(() => {})
  })

  // a new worker has taken over: the code in this tab is now the old build
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return
    reloading = true
    window.location.reload()
  })
}
