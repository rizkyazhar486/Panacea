import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { bacaSurah, penyediaSekarang, renunganUntuk, tafsirUntukBahasa, QARI, type Ayat, type TafsirTersedia } from '../lib/kitab'
import '../styles/widget-concepts-v6.css'

const PILIHAN: { surah: number; ayat: number }[] = [
  { surah: 1, ayat: 5 }, { surah: 2, ayat: 153 }, { surah: 2, ayat: 186 }, { surah: 2, ayat: 216 },
  { surah: 2, ayat: 255 }, { surah: 2, ayat: 286 }, { surah: 3, ayat: 139 }, { surah: 3, ayat: 159 },
  { surah: 3, ayat: 173 }, { surah: 8, ayat: 46 }, { surah: 9, ayat: 40 }, { surah: 13, ayat: 11 },
  { surah: 13, ayat: 28 }, { surah: 14, ayat: 7 }, { surah: 16, ayat: 97 }, { surah: 17, ayat: 23 },
  { surah: 20, ayat: 114 }, { surah: 21, ayat: 87 }, { surah: 24, ayat: 35 }, { surah: 29, ayat: 69 },
  { surah: 39, ayat: 53 }, { surah: 40, ayat: 60 }, { surah: 41, ayat: 30 }, { surah: 49, ayat: 13 },
  { surah: 55, ayat: 13 }, { surah: 65, ayat: 3 }, { surah: 93, ayat: 5 }, { surah: 94, ayat: 6 },
  { surah: 103, ayat: 3 }, { surah: 112, ayat: 1 },
]

function pilihanHariIni(): { surah: number; ayat: number } {
  const d = new Date()
  const hari = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2024, 0, 1)) / 86400000)
  return PILIHAN[((hari % PILIHAN.length) + PILIHAN.length) % PILIHAN.length]
}

const TAFSIR_CADANGAN = 'en.maududi'
const QARI_DIPAKAI = 'alafasy'

interface Isi {
  namaSurah: string
  nomorSurah: number
  nomorAyat: number
  ayatId: Ayat
  ayatEn: Ayat
  gagal: string[]
}

export function UbinAyat() {
  const [isi, setIsi] = useState<Isi | null>(null)
  const [galat, setGalat] = useState('')
  const [bukaTafsir, setBukaTafsir] = useState(false)
  const [bukaEnglish, setBukaEnglish] = useState(false)
  const [tafsirDipakai, setTafsirDipakai] = useState<TafsirTersedia | null>(null)

  useEffect(() => {
    let batal = false
    const { surah, ayat } = pilihanHariIni()
    tafsirUntukBahasa('id')
      .then((t) => (batal ? null : t))
      .then((t) => {
        const pilih = t?.id ?? TAFSIR_CADANGAN
        if (!batal) setTafsirDipakai(t ?? null)
        return Promise.all([
          bacaSurah(surah, 'id.indonesian', undefined, {}),
          bacaSurah(surah, 'en.sahih', pilih, { qari: QARI_DIPAKAI }),
        ])
      })
      .then(([id, en]) => {
        if (batal) return
        const aId = id.ayat.find((a) => a.nomor === ayat)
        const aEn = en.ayat.find((a) => a.nomor === ayat)
        if (!aId || !aEn) {
          setGalat('The verse for today did not arrive complete, so nothing is shown rather than a partial one.')
          return
        }
        setIsi({ namaSurah: en.surah.nama, nomorSurah: surah, nomorAyat: ayat, ayatId: aId, ayatEn: aEn, gagal: en.gagalSebagian })
      })
      .catch((e: unknown) => { if (!batal) setGalat(e instanceof Error ? e.message : 'Could not reach the source.') })
    return () => { batal = true }
  }, [])

  if (galat) {
    return (
      <section className="pw-concept">
        <div className="flex items-center justify-between gap-2">
          <span className="t-kecil font-black uppercase tracking-wide text-neutral-500">Daily reflection</span>
          <Link to="/scripture" className="t-kecil font-bold text-brand">Open →</Link>
        </div>
        <p className="t-kecil mt-2 leading-snug text-amber-700 dark:text-amber-300">{galat}</p>
      </section>
    )
  }
  if (!isi) return null

  const tafsirInfo = tafsirDipakai
  const qariInfo = QARI.find((q) => q.id === QARI_DIPAKAI)
  const renungan = renunganUntuk(isi.nomorSurah, isi.nomorAyat)

  return (
    <section className="pw-concept pw-reflection">
      <div className="flex items-center justify-between gap-2">
        <div className="pw-reflection-ref">{isi.namaSurah} · {isi.nomorSurah}:{isi.nomorAyat}</div>
        <Link to="/scripture" className="t-kecil flex min-h-[38px] items-center font-bold text-brand">Open →</Link>
      </div>

      <p dir="rtl" lang="ar" className="pw-reflection-arabic">{isi.ayatEn.arab}</p>
      <div className="pw-reflection-divider" aria-hidden />

      <div>
        <div className="t-mikro mb-1 font-black uppercase tracking-[.12em] text-neutral-400">Indonesia · Kemenag RI</div>
        <p className="pw-reflection-translation">{isi.ayatId.terjemahan}</p>
      </div>

      <div className="pw-reflection-question">
        <b className="text-ink dark:text-white">Sit with this:</b> {renungan}
      </div>

      <div className="pw-reflection-actions">
        {isi.ayatEn.audio && (
          <audio controls preload="none" src={isi.ayatEn.audio} className="min-w-0 flex-1" aria-label={`Recitation by ${qariInfo?.nama ?? 'reciter'}`} />
        )}
        <button type="button" onClick={() => setBukaEnglish((v) => !v)} aria-expanded={bukaEnglish} className="pw-reflection-btn">
          {bukaEnglish ? 'Hide EN' : 'English'}
        </button>
        {isi.ayatEn.tafsir && (
          <button type="button" onClick={() => setBukaTafsir((v) => !v)} aria-expanded={bukaTafsir} className="pw-reflection-btn">
            {bukaTafsir ? 'Hide tafsir' : 'Tafsir'}
          </button>
        )}
      </div>

      {bukaEnglish && (
        <div>
          <div className="t-mikro mb-1 font-black uppercase tracking-[.12em] text-neutral-400">English · Saheeh International</div>
          <p className="pw-reflection-translation">{isi.ayatEn.terjemahan}</p>
        </div>
      )}

      {bukaTafsir && isi.ayatEn.tafsir && (
        <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-3">
          <div className="t-mikro font-black uppercase tracking-wide text-amber-600 dark:text-amber-300">
            Commentary · {tafsirInfo?.nama ?? isi.ayatEn.tafsir.oleh}
          </div>
          <p className="t-kecil mt-2 leading-[1.65] text-ink dark:text-neutral-200">{isi.ayatEn.tafsir.teks}</p>
          <p className="t-mikro mt-2 leading-snug text-neutral-500">
            {tafsirInfo?.tentang ? `${tafsirInfo.tentang} ` : ''}Language: {tafsirInfo?.bahasa ?? isi.ayatEn.tafsir.bahasa}.
          </p>
        </div>
      )}

      <p className="t-mikro leading-snug text-neutral-400">
        Source: {penyediaSekarang().nama}. The verse, translations, commentary and recitation are fetched and checked before display.
        {isi.gagal.length > 0 && ` Not available today: ${isi.gagal.join(', ')}.`}
      </p>
    </section>
  )
}

export default UbinAyat
