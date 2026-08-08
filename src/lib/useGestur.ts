import { useEffect, useRef, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Gestur sentuh: geser ke kanan untuk kembali, dan tarik untuk menyegarkan.
//
// Gestur berbagi layar dengan menggulir, jadi aturan utamanya satu: SEBUAH
// GESTUR TIDAK BOLEH MERAMPAS SENTUHAN YANG SEBENARNYA DIMAKSUDKAN UNTUK HAL
// LAIN. Semua keputusan di bawah berasal dari aturan itu.
//
// GESER KANAN = KEMBALI
//   * Harus dimulai dari tepi kiri (28 px pertama). Tanpa syarat ini, setiap
//     geseran mendatar di tengah layar akan memicu kembali — padahal di tengah
//     layar ada carousel, tab yang bisa digeser, dan slider.
//   * Arahnya harus jelas mendatar (dua kali lebih jauh mendatar daripada
//     menegak), supaya gulir menyerong tidak salah dibaca.
//   * Dibatalkan bila jari menyentuh lebih dari satu, karena itu cubit-zum.
//
// TARIK = SEGARKAN
//   Diminta "geser ke atas untuk menyegarkan". Ditafsirkan sebagai geseran di
//   BATAS GULIR, bukan geseran ke atas di sembarang tempat — geseran ke atas di
//   tengah halaman adalah cara orang menggulir ke bawah, dan merampasnya akan
//   membuat halaman mustahil dibaca. Karena itu keduanya diterima, dan
//   keduanya hanya di ujung:
//     * tarik ke bawah saat sudah di paling atas (kebiasaan yang dikenal luas)
//     * dorong ke atas saat sudah di paling bawah (yang diminta)
//   Ambangnya 90 px supaya lenting karet iOS tidak menyegarkan tanpa sengaja.
// ─────────────────────────────────────────────────────────────────────────────

const LEBAR_TEPI = 28
const JARAK_KEMBALI = 70
const JARAK_SEGARKAN = 90

export interface OpsiGestur {
  /** Dipanggil saat geseran kembali selesai. */
  onKembali?: () => void
  /** Dipanggil saat tarikan segarkan selesai. */
  onSegarkan?: () => void
  /** Matikan seluruh gestur (mis. saat modal terbuka). */
  mati?: boolean
}

/** Seberapa jauh tarikan segarkan sudah berjalan, 0–1, untuk umpan balik visual. */
export function useGestur({ onKembali, onSegarkan, mati }: OpsiGestur) {
  const [tarikan, setTarikan] = useState(0)
  // Callback disimpan di ref agar pendengar tidak perlu dipasang ulang tiap
  // render — memasang ulang listener sentuh di tengah gestur membatalkannya.
  const cb = useRef({ onKembali, onSegarkan })
  cb.current = { onKembali, onSegarkan }

  useEffect(() => {
    if (mati) return

    let x0 = 0, y0 = 0, aktif = false
    let mode: 'belum' | 'kembali' | 'segarkan' | 'batal' = 'belum'

    const diPalingAtas = () => window.scrollY <= 2
    const diPalingBawah = () =>
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2

    const mulai = (e: TouchEvent) => {
      if (e.touches.length !== 1) { aktif = false; return }
      const t = e.touches[0]
      x0 = t.clientX; y0 = t.clientY
      aktif = true; mode = 'belum'
    }

    const gerak = (e: TouchEvent) => {
      if (!aktif) return
      if (e.touches.length !== 1) { aktif = false; setTarikan(0); return }
      const t = e.touches[0]
      const dx = t.clientX - x0
      const dy = t.clientY - y0

      if (mode === 'belum') {
        // Arah ditetapkan sekali di awal, lalu tidak berubah. Membiarkannya
        // berganti di tengah membuat gestur terasa "meleset" saat jari
        // bergoyang sedikit.
        if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 2) {
          mode = dx > 0 && x0 <= LEBAR_TEPI ? 'kembali' : 'batal'
        } else if (Math.abs(dy) > 10) {
          const tarikBawah = dy > 0 && diPalingAtas()
          const dorongAtas = dy < 0 && diPalingBawah()
          mode = tarikBawah || dorongAtas ? 'segarkan' : 'batal'
        }
      }

      if (mode === 'segarkan') {
        setTarikan(Math.min(1, Math.abs(dy) / JARAK_SEGARKAN))
      }
    }

    const selesai = (e: TouchEvent) => {
      if (!aktif) { setTarikan(0); return }
      aktif = false
      const t = e.changedTouches[0]
      const dx = t.clientX - x0
      const dy = t.clientY - y0

      if (mode === 'kembali' && dx >= JARAK_KEMBALI) cb.current.onKembali?.()
      else if (mode === 'segarkan' && Math.abs(dy) >= JARAK_SEGARKAN) cb.current.onSegarkan?.()

      setTarikan(0)
      mode = 'belum'
    }

    const batal = () => { aktif = false; setTarikan(0) }

    // passive: pendengar ini tidak pernah memanggil preventDefault, jadi gulir
    // asli peramban tetap berjalan mulus dan tidak ada peringatan konsol.
    const opsi = { passive: true } as AddEventListenerOptions
    window.addEventListener('touchstart', mulai, opsi)
    window.addEventListener('touchmove', gerak, opsi)
    window.addEventListener('touchend', selesai, opsi)
    window.addEventListener('touchcancel', batal, opsi)
    return () => {
      window.removeEventListener('touchstart', mulai)
      window.removeEventListener('touchmove', gerak)
      window.removeEventListener('touchend', selesai)
      window.removeEventListener('touchcancel', batal)
    }
  }, [mati])

  return tarikan
}

export default useGestur
