import { useEffect, useState } from 'react'
import { kutipanHariIni, durasiBacaMs } from '../lib/lifeQuotes'
import { IconX, IconFlame } from './icons'

// "Sesuatu untuk dibawa hari ini" — muncul sekali per hari, hari kalender
// lokal pengguna, saat sesi pertama kali masuk aplikasi. Bukan dialog yang
// memblokir (ini bukan onboarding), dan bukan achievement toast yang hilang
// dalam hitungan detik (kutipannya perlu dibaca, bukan sekadar dilihat) —
// jadi ia tetap sampai ditutup sendiri atau setelah waktu baca yang wajar.
//
// Desain: pelajaran dari .kaca yang membasahi SELURUH kartu dengan
// gradasi penuh spektrum — begitu setiap piksel berwarna, tombol dan
// ikon yang duduk di atasnya kehilangan latar yang stabil untuk dibaca.
// Di sini warnanya jadi AKSEN yang terkonsentrasi (satu bara api di
// pojok kiri atas, satu kilau neon di pojok kanan bawah) di atas dasar
// ruang angkasa nyaris hitam — bukan dicat rata. Tombol tutup dan avatar
// duduk di atas alasnya sendiri yang gelap solid, terlepas dari animasi
// warna di baliknya.
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
  const quote = kutipanHariIni()

  useEffect(() => {
    try {
      const seen = localStorage.getItem(SEEN_KEY)
      if (seen === todayKey()) return
    } catch { /* localStorage tidak tersedia — tampilkan saja */ }
    const t = setTimeout(() => setVisible(true), 500)
    return () => clearTimeout(t)
  }, [])

  // Menyingkir sendiri setelah waktu baca. Tanpa ini spanduknya menutupi
  // sepertiga layar pertama SETIAP halaman sampai seseorang menekan ×, dan
  // halaman yang baru dibuka kehilangan judulnya sendiri di balik kutipan.
  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => {
      setVisible(false)
      tandaiSudahDilihat()
    }, durasiBacaMs(`${quote.quote} ${quote.source}`))
    return () => clearTimeout(t)
  }, [visible, quote.quote, quote.source])

  function dismiss() {
    setVisible(false)
    tandaiSudahDilihat()
  }

  if (!visible) return null

  return (
    // Dipasang DI BAWAH bilah atas, bukan di atasnya: menutupi seluruh baris
    // navigasi dengan pengingat harian membuat menu, pencarian, profil dan
    // keluar tidak terlihat sekaligus tidak bisa ditekan sampai spanduknya
    // ditutup. Tingginya dibaca dari bilah yang sebenarnya, bukan ditebak.
    <div
      data-daily-reminder="v1"
      className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4"
      style={{ top: 'calc(var(--tinggi-bilah-atas, 0px) + 12px)' }}
    >
      <div
        className="fly-in-drop pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl"
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
          className="pointer-events-none absolute inset-0 rounded-2xl"
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
          className="absolute right-2.5 top-2.5 z-10 grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-black/60 text-white/90 backdrop-blur-sm transition hover:bg-black/80 hover:text-white"
        >
          <IconX size={13} />
        </button>

        <div className="relative flex gap-2.5 p-3 pr-9">
          <span
            aria-hidden
            className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/15 bg-black/50"
            style={{ boxShadow: '0 0 14px rgba(255,140,0,0.5)' }}
          >
            <IconFlame size={14} className="text-amber-400" />
          </span>
          <div className="min-w-0">
            {/* Baris label dibuang: "Today's reminder" tidak menambah apa pun
                di atas kutipan yang jelas-jelas sebuah kutipan, dan barisnya
                ikut mendorong kartunya melewati sepertiga layar. */}
            <p
              className="text-[13px] font-bold leading-snug text-white"
              style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            >
              “{quote.quote}”
            </p>
            <p className="mt-1 truncate text-[10px] font-semibold text-white/55">— {quote.source}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DailyQuoteBanner
