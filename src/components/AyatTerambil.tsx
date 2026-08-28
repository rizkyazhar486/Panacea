import { useEffect, useState } from 'react'
import { bacaSurah, penyediaSekarang, type Ayat } from '../lib/kitab'

// ─────────────────────────────────────────────────────────────────────────────
// Satu ayat, DIAMBIL dan diperiksa — dipakai di mana pun sebuah halaman perlu
// menunjukkan ayat yang disebutnya.
//
// Ia menempuh bacaSurah() yang sama dengan halaman kitab: teksnya diperiksa
// keutuhannya lebih dahulu, dan bila gagal TIDAK ADA yang ditampilkan. Halaman
// yang memuat komponen ini karena itu tidak pernah dapat menampilkan ayat yang
// diragukan, bahkan bila penulis halamannya lupa memikirkannya.
// ─────────────────────────────────────────────────────────────────────────────

export function AyatTerambil({ surah, ayat }: { surah: number; ayat: number }) {
  const [isi, setIsi] = useState<{ id: Ayat; en: Ayat } | null>(null)
  const [galat, setGalat] = useState('')

  useEffect(() => {
    let batal = false
    setGalat('')
    Promise.all([bacaSurah(surah, 'id.indonesian'), bacaSurah(surah, 'en.sahih')])
      .then(([id, en]) => {
        if (batal) return
        const a = id.ayat.find((x) => x.nomor === ayat)
        const b = en.ayat.find((x) => x.nomor === ayat)
        if (!a || !b) {
          setGalat('Ayat ini tidak sampai dengan utuh, jadi tidak ditampilkan.')
          return
        }
        setIsi({ id: a, en: b })
      })
      .catch((e: unknown) => {
        if (!batal) setGalat(e instanceof Error ? e.message : 'Tidak dapat menghubungi sumber.')
      })
    return () => { batal = true }
  }, [surah, ayat])

  if (galat) return <p className="mt-2 text-[11px] leading-snug text-amber-700 dark:text-amber-300">{galat}</p>
  if (!isi) return <p className="mt-2 text-[11px] font-semibold text-neutral-400">Mengambil ayat…</p>

  return (
    <div className="mt-2 border-t border-neutral-200 pt-2 dark:border-white/10">
      <p dir="rtl" lang="ar" className="text-right text-[18px] leading-[2] text-ink dark:text-white">
        {isi.en.arab}
      </p>
      <p className="mt-2 text-[12.5px] leading-[1.65] text-ink dark:text-neutral-200">{isi.id.terjemahan}</p>
      <p className="mt-1 text-[12px] leading-[1.6] text-neutral-500">{isi.en.terjemahan}</p>
      <p className="mt-1.5 text-[10px] text-neutral-400">
        Teks dari {penyediaSekarang().nama}; terjemahan Kemenag RI dan Saheeh International. Diperiksa keutuhannya
        sebelum ditampilkan.
      </p>
    </div>
  )
}

export default AyatTerambil
