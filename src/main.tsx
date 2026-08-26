import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// offline support (PWA) — production only, so it never fights dev HMR
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(import.meta.env.BASE_URL + 'sw.js')
      .then((reg) => {
        // check for updates every 60 seconds so the home-screen app stays fresh
        setInterval(() => reg.update().catch(() => {}), 60_000)
      })
      .catch(() => {})
  })
  // when a new SW takes over, reload to get the new code
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload()
  })
}
