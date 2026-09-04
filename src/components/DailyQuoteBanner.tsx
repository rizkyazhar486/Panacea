import { useEffect, useState } from 'react'
import { kutipanHariIni } from '../lib/lifeQuotes'
import { IconX } from './icons'

// "Sesuatu untuk dibawa hari ini" — muncul sekali per hari, hari kalender
// lokal pengguna, saat sesi pertama kali masuk aplikasi. Bukan dialog yang
// memblokir (ini bukan onboarding), dan bukan achievement toast yang hilang
// dalam hitungan detik (kutipannya perlu dibaca, bukan sekadar dilihat) —
// jadi ia tetap sampai ditutup sendiri atau setelah waktu baca yang wajar.
const SEEN_KEY = 'pmd-quote-seen-date'

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

export function DailyQuoteBanner() {
  const [visible, setVisible] = useState(false)
  const quote = kutipanHariIni()

  useEffect(() => {
    try {
      const seen = localStorage.getItem(SEEN_KEY)
      if (seen === todayKey()) return
    } catch { /* localStorage tidak tersedia — tampilkan saja */ }
    const t = setTimeout(() => setVisible(true), 500)
    return () => clearTimeout(t)
  }, [])

  function dismiss() {
    setVisible(false)
    try { localStorage.setItem(SEEN_KEY, todayKey()) } catch { /* ignore */ }
  }

  if (!visible) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
      <div className="kaca pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-2xl px-4 py-3.5 shadow-2xl">
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full text-white/70 hover:bg-black/15 hover:text-white"
        >
          <IconX size={14} />
        </button>
        <div className="pr-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">Today’s reminder</p>
          <p className="mt-1.5 text-[14px] font-bold leading-snug text-white drop-shadow-sm">“{quote.quote}”</p>
          <p className="mt-1.5 text-[11px] font-semibold text-white/75">— {quote.source}</p>
        </div>
      </div>
    </div>
  )
}

export default DailyQuoteBanner
