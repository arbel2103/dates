import { useCallback, useRef, useState } from 'react'
import GiftsPage from './pages/GiftsPage'
import IdeasPage from './pages/IdeasPage'
import JourneyPage from './pages/JourneyPage'
import SettingsPage from './pages/SettingsPage'
import WheelPage from './pages/WheelPage'

/**
 * The studio shell: a header, a horizontal snap-scroller of pages, and a tab
 * bar. Pages are all mounted at once and scrolled between rather than swapped,
 * so a half-written idea survives a glance at another tab.
 */
const PAGES = [
  { key: 'ideas', label: 'רעיונות', icon: '💡', el: <IdeasPage /> },
  { key: 'wheel', label: 'גלגל', icon: '🎡', el: <WheelPage /> },
  { key: 'journey', label: 'מסע', icon: '💌', el: <JourneyPage /> },
  { key: 'gifts', label: 'האתרים', icon: '🔗', el: <GiftsPage /> },
  { key: 'settings', label: 'הגדרות', icon: '⚙️', el: <SettingsPage /> },
]

export default function StudioApp() {
  const [index, setIndex] = useState(0)
  const scroller = useRef<HTMLDivElement>(null)
  const current = useRef(0)

  const onScroll = () => {
    const el = scroller.current
    if (!el || el.clientWidth === 0) return
    const i = Math.min(
      PAGES.length - 1,
      Math.max(0, Math.round(Math.abs(el.scrollLeft) / el.clientWidth)),
    )
    current.current = i
    setIndex(i)
  }

  const goTo = useCallback((i: number) => {
    const panel = scroller.current?.children[i] as HTMLElement | undefined
    // tapping the tab you are already on scrolls that page back to the top
    if (i === current.current && panel) {
      panel.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    panel?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    current.current = i
    setIndex(i)
  }, [])

  return (
    <div className="flex flex-col h-[100dvh]">
      <header className="sticky top-0 z-30 chrome border-b">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}favicon.svg`}
            alt=""
            className="w-8 h-8 rounded-lg shadow-soft"
          />
          <span className="font-display text-xl">דייטים</span>
          <span className="flex-1" />
          <nav className="hidden md:flex gap-1">
            {PAGES.map((p, i) => (
              <button
                key={p.key}
                onClick={() => goTo(i)}
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition ${
                  i === index ? 'bg-ink text-bg' : 'text-muted hover:text-ink hover:bg-ink/5'
                }`}
              >
                {p.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div
        ref={scroller}
        onScroll={onScroll}
        className="flex-1 flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory no-scrollbar"
      >
        {PAGES.map((p) => (
          <section
            key={p.key}
            className="min-w-full h-full overflow-y-auto overflow-x-hidden snap-start no-scrollbar"
          >
            <div className="px-4 py-6 max-w-3xl mx-auto">{p.el}</div>
          </section>
        ))}
      </div>

      <nav
        className="md:hidden chrome border-t"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex">
          {PAGES.map((p, i) => (
            <button
              key={p.key}
              onClick={() => goTo(i)}
              aria-current={i === index ? 'page' : undefined}
              className={`flex-1 min-w-0 flex flex-col items-center gap-0.5 pt-1.5 pb-1 text-[11px] font-semibold transition ${
                i === index ? 'text-accent' : 'text-muted'
              }`}
            >
              <span
                className={`px-4 py-0.5 rounded-full text-lg transition ${
                  i === index ? 'bg-accent-soft' : ''
                }`}
                aria-hidden
              >
                {p.icon}
              </span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
