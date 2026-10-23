import { useCallback, useEffect, useRef, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Pemutar bacaan — satu elemen audio untuk seluruh surah, bukan satu per ayat.
//
// Alasannya bukan kerapian melainkan perilaku peramban. Ponsel membatasi jumlah
// elemen audio yang boleh hidup bersamaan, dan sebuah surah bisa berisi ratusan
// ayat; memasang satu pemutar pada tiap ayat membuat halaman berhenti berbunyi
// sama sekali di tengah daftar, tanpa galat apa pun. Satu elemen yang berpindah
// sumber juga membuat "putar berurutan" menjadi hal yang wajar, bukan tambalan.
//
// SATU AYAT SELESAI, LANJUT SENDIRI. Orang yang menyalakan bacaan biasanya
// ingin mendengar surahnya, bukan menekan tombol dua ratus kali. Tetapi
// perpindahan itu HARUS berhenti begitu pengguna menekan jeda — memaksa terus
// berbunyi adalah cara tercepat membuat orang mematikan seluruh fitur.
// ─────────────────────────────────────────────────────────────────────────────

export interface Trek { nomor: number; audio: string }

export function usePemutarAyat(trek: Trek[]) {
  const [main, setMain] = useState<number | null>(null)
  const [galat, setGalat] = useState('')
  const el = useRef<HTMLAudioElement | null>(null)
  const trekRef = useRef(trek)
  trekRef.current = trek

  // Elemen dibuat sekali dan dipakai ulang seumur halaman.
  useEffect(() => {
    const a = new Audio()
    a.preload = 'none'
    el.current = a
    return () => { a.pause(); a.src = ''; el.current = null }
  }, [])

  const berhenti = useCallback(() => {
    el.current?.pause()
    setMain(null)
  }, [])

  const putar = useCallback((nomor: number) => {
    const a = el.current
    if (!a) return
    const t = trekRef.current.find((x) => x.nomor === nomor)
    if (!t) return
    if (main === nomor) { berhenti(); return }
    setGalat('')
    a.src = t.audio
    a.play().then(() => setMain(nomor)).catch(() => {
      // Kegagalan diberitahukan. Rekaman yang diam tanpa penjelasan membuat
      // orang menekan tombol berulang kali dan menyimpulkan aplikasinya rusak.
      setGalat('The recording could not be played. It is fetched from the provider, so this usually means the connection dropped.')
      setMain(null)
    })
  }, [main, berhenti])

  // Lanjut ke ayat berikutnya saat satu selesai.
  useEffect(() => {
    const a = el.current
    if (!a) return
    const selesai = () => {
      const daftar = trekRef.current
      const i = daftar.findIndex((x) => x.nomor === main)
      const lanjut = i >= 0 ? daftar[i + 1] : undefined
      if (!lanjut) { setMain(null); return }
      a.src = lanjut.audio
      a.play().then(() => setMain(lanjut.nomor)).catch(() => setMain(null))
    }
    a.addEventListener('ended', selesai)
    return () => a.removeEventListener('ended', selesai)
  }, [main])

  return { main, putar, berhenti, galat }
}

/** Tombol putar satu ayat. Kecil, tetapi tetap memenuhi ukuran sentuh minimum. */
export function TombolPutar({ aktif, onKlik, label }: {
  aktif: boolean; onKlik: () => void; label: string
}) {
  return (
    <button onClick={onKlik} aria-pressed={aktif} aria-label={label}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors ${
        aktif ? 'bg-brand text-white' : 'bg-brand-50 text-brand-dark hover:bg-brand-100'}`}>
      {aktif ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z" />
        </svg>
      )}
    </button>
  )
}

export default usePemutarAyat
