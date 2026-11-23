import { useEffect, useState } from 'react'
import { kutipanHariIni, durasiBacaMs } from '../../lib/lifeQuotes'
import { IconX, IconFlame } from '../icons'

// The daily reminder opens in place and starts its reading timer when expanded.
const SEEN_KEY = 'pmd-quote-seen-date'

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function tandaiSudahDilihat() {
  try { localStorage.setItem(SEEN_KEY, todayKey()) } catch { /* ignore */ }
}

export function DailyQuoteBanner() {
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const quote = kutipanHariIni()

  useEffect(() => {
    try {
      const seen = localStorage.getItem(SEEN_KEY)
      if (seen === todayKey()) return
    } catch { /* localStorage tidak tersedia — tampilkan saja */ }
    const t = setTimeout(() => setVisible(true), 500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!visible || !expanded) return
    const t = setTimeout(() => {
      setVisible(false)
      tandaiSudahDilihat()
    }, durasiBacaMs(`${quote.quote} ${quote.source}`))
    return () => clearTimeout(t)
  }, [visible, expanded, quote.quote, quote.source])

  function dismiss() {
    setVisible(false)
    tandaiSudahDilihat()
  }

  if (!visible) return null

  return (
    // Remain in Home's content flow so the quote cannot cover the heading or
    // primary actions on either viewport. Dismissal and the reading timer keep
    // their existing once-per-day behavior.
    <div
      data-daily-reminder="v1"
      className="relative mt-4 flex w-full justify-center px-3 sm:px-6"
    >
      <div
        className="fly-in-drop motion-reduce:animate-none! pointer-events-auto relative has-[details[open]]:min-h-[100px] w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl"
        style={{
          animation: 'fly-in-drop 0.7s cubic-bezier(0.2, 0.9, 0.25, 1.1) both',
          background:
            'radial-gradient(120% 100% at 6% -10%, rgba(255,102,0,0.55) 0%, transparent 46%),' +
            'radial-gradient(90% 90% at 105% 115%, rgba(0,210,255,0.4) 0%, transparent 50%),' +
            'radial-gradient(70% 70% at 100% -10%, rgba(157,0,255,0.3) 0%, transparent 55%),' +
            'linear-gradient(165deg, #0a0a12 0%, #07070c 55%, #050507 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Cincin tepi tipis yang berkilau perlahan — aksen, bukan isi. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl motion-reduce:animate-none!"
          style={{
            padding: 1,
            background: 'linear-gradient(120deg, #FF6600, #FFD700, #00D2FF, #9D00FF, #FF6600)',
            backgroundSize: '300% 100%',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            opacity: 0.5,
            animation: 'kaca-edge-aurora 9s linear infinite',
          }}
        />

        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-2 top-2 z-10 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/60 text-white/90 backdrop-blur-sm transition hover:bg-black/80 hover:text-white"
        >
          <IconX size={13} />
        </button>

        <details onToggle={(event) => setExpanded(event.currentTarget.open)} className="relative px-3 pr-16">
          <summary className="flex min-h-14 cursor-pointer items-center gap-2 text-sm font-semibold text-white">
            <IconFlame size={16} className="text-amber-400" aria-hidden="true" />
            Daily quote
          </summary>
          <div className="pb-3">
            <p className="text-sm leading-snug text-white"
              style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              “{quote.quote}”
            </p>
            <p className="mt-1 text-sm text-white/70">— {quote.source}</p>
          </div>
        </details>
      </div>
    </div>
  )
}

export default DailyQuoteBanner
