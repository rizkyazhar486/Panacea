import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { bacaSurah, penyediaSekarang, renunganUntuk, TAFSIR, QARI, type Ayat } from '../lib/kitab'

// ─────────────────────────────────────────────────────────────────────────────
// Ubin satu ayat — dibaca, didengar, dan dipahami, di beranda.
//
// SELURUH TEKSNYA DIAMBIL, TIDAK SATU HURUF PUN DITULIS DI SINI. Aturan itu
// datang dari lib/kitab.ts dan berlaku penuh di ubin ini: ayat, terjemahan,
// tafsir, dan rekaman semuanya melewati bacaSurah() yang sudah memeriksa
// keutuhan teksnya. Bila pemeriksaan gagal, ubin ini TIDAK menampilkan apa pun
// — mushaf yang meragukan lebih buruk daripada layar yang kosong.
//
// AYATNYA TETAP SEPANJANG HARI, tidak berganti tiap kali beranda dibuka.
// Ayat yang berganti tiap gulir menjadi hiasan; ayat yang menetap seharian
// dapat dikembalikan, dipikirkan, dan dibicarakan. Pilihannya ditentukan
// tanggal, sehingga dua orang pada hari yang sama membaca ayat yang sama.
//
// TERJEMAHAN INDONESIA DAN INGGRIS DITAMPILKAN BERSAMA-SAMA, karena yang
// memintanya membaca keduanya dan perbedaan di antara keduanya sering justru
// yang membuka maknanya.
//
// TENTANG TAFSIR BAHASA INDONESIA. Penyedia yang terpasang menyediakan
// TERJEMAHAN Kemenag dalam bahasa Indonesia, tetapi belum ada edisi TAFSIR
// berbahasa Indonesia yang dapat diperiksa dari lingkungan ini. Maka tafsir
// yang ditampilkan berbahasa Inggris beserta nama penyusunnya, dan
// ketidaktersediaan yang Indonesia DIKATAKAN di layar. Memasang id edisi
// tafsir Indonesia berdasarkan tebakan berarti mengirim sesuatu yang akan
// gagal diam-diam — atau lebih buruk, berhasil dengan isi yang bukan tafsir
// yang dikira pembacanya.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ayat pilihan harian.
 *
 * Semuanya ayat yang lazim dibaca untuk penguatan, dan tiap butir menyertakan
 * NOMOR SURAH DAN AYAT saja — teksnya diambil, tidak ditulis di sini.
 */
const PILIHAN: { surah: number; ayat: number }[] = [
  { surah: 1, ayat: 5 },
  { surah: 2, ayat: 153 },
  { surah: 2, ayat: 186 },
  { surah: 2, ayat: 216 },
  { surah: 2, ayat: 255 },
  { surah: 2, ayat: 286 },
  { surah: 3, ayat: 139 },
  { surah: 3, ayat: 159 },
  { surah: 3, ayat: 173 },
  { surah: 8, ayat: 46 },
  { surah: 9, ayat: 40 },
  { surah: 13, ayat: 11 },
  { surah: 13, ayat: 28 },
  { surah: 14, ayat: 7 },
  { surah: 16, ayat: 97 },
  { surah: 17, ayat: 23 },
  { surah: 20, ayat: 114 },
  { surah: 21, ayat: 87 },
  { surah: 24, ayat: 35 },
  { surah: 29, ayat: 69 },
  { surah: 39, ayat: 53 },
  { surah: 40, ayat: 60 },
  { surah: 41, ayat: 30 },
  { surah: 49, ayat: 13 },
  { surah: 55, ayat: 13 },
  { surah: 65, ayat: 3 },
  { surah: 93, ayat: 5 },
  { surah: 94, ayat: 6 },
  { surah: 103, ayat: 3 },
  { surah: 112, ayat: 1 },
]

function pilihanHariIni(): { surah: number; ayat: number } {
  const d = new Date()
  const hari = Math.floor(
    (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2024, 0, 1)) / 86400000,
  )
  return PILIHAN[((hari % PILIHAN.length) + PILIHAN.length) % PILIHAN.length]
}

const TAFSIR_DIPAKAI = 'en.maududi'
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

  useEffect(() => {
    let batal = false
    const { surah, ayat } = pilihanHariIni()

    // Dua pembacaan: satu untuk terjemahan Indonesia, satu untuk Inggris
    // beserta tafsir dan rekamannya. Keduanya melewati pemeriksaan keutuhan
    // yang sama.
    Promise.all([
      bacaSurah(surah, 'id.indonesian', undefined, {}),
      bacaSurah(surah, 'en.sahih', TAFSIR_DIPAKAI, { qari: QARI_DIPAKAI }),
    ])
      .then(([id, en]) => {
        if (batal) return
        const aId = id.ayat.find((a) => a.nomor === ayat)
        const aEn = en.ayat.find((a) => a.nomor === ayat)
        if (!aId || !aEn) {
          setGalat('The verse for today did not arrive complete, so nothing is shown rather than a partial one.')
          return
        }
        setIsi({
          namaSurah: en.surah.nama,
          nomorSurah: surah,
          nomorAyat: ayat,
          ayatId: aId,
          ayatEn: aEn,
          gagal: en.gagalSebagian,
        })
      })
      .catch((e: unknown) => {
        if (!batal) setGalat(e instanceof Error ? e.message : 'Could not reach the source.')
      })
    return () => {
      batal = true
    }
  }, [])

  if (galat) {
    return (
      <section>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">Verse of the day</h2>
          <Link to="/scripture" className="t-kecil flex min-h-[40px] items-center font-bold text-brand">Open →</Link>
        </div>
        <div className="kaca rounded-3xl p-3">
          <p className="t-kecil leading-snug text-amber-700 dark:text-amber-300">{galat}</p>
        </div>
      </section>
    )
  }

  if (!isi) return null

  const tafsirInfo = TAFSIR.find((t) => t.id === TAFSIR_DIPAKAI)
  const qariInfo = QARI.find((q) => q.id === QARI_DIPAKAI)

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">Verse of the day</h2>
        <Link to="/scripture" className="t-kecil flex min-h-[40px] items-center font-bold text-brand">Open →</Link>
      </div>

      <div className="kaca rounded-3xl p-3">
        <div className="t-mikro font-bold uppercase tracking-wide text-brand">
          {isi.namaSurah} {isi.nomorSurah}:{isi.nomorAyat}
        </div>

        {/* Teks Arab paling atas dan paling besar — ia ayatnya, sisanya
            keterangan tentangnya. */}
        <p dir="rtl" lang="ar" className="mt-2 text-right text-[20px] leading-[2] text-ink dark:text-white">
          {isi.ayatEn.arab}
        </p>

        <div className="mt-3 space-y-2">
          <div>
            <div className="t-mikro font-black uppercase tracking-wide text-neutral-400">Indonesia · Kemenag RI</div>
            <p className="t-kecil mt-0.5 leading-[1.6] text-ink dark:text-neutral-200">{isi.ayatId.terjemahan}</p>
          </div>
          <div>
            <div className="t-mikro font-black uppercase tracking-wide text-neutral-400">
              English · Saheeh International
            </div>
            <p className="t-kecil mt-0.5 leading-[1.6] text-ink dark:text-neutral-200">{isi.ayatEn.terjemahan}</p>
          </div>
        </div>

        {isi.ayatEn.audio && (
          <div className="mt-3">
            <div className="t-mikro mb-1 font-black uppercase tracking-wide text-neutral-400">
              Recitation · {qariInfo?.nama}
            </div>
            {/* Rekamannya tidak disimpan aplikasi ini; alamatnya datang dari
                penyedia yang sama dengan teksnya. */}
            <audio controls preload="none" src={isi.ayatEn.audio} className="w-full" />
          </div>
        )}

        {isi.ayatEn.tafsir && (
          <div className="mt-3">
            <button
              onClick={() => setBukaTafsir((v) => !v)}
              aria-expanded={bukaTafsir}
              className="flex min-h-[40px] w-full items-center justify-between gap-2 rounded-xl bg-brand/10 px-3 text-left"
            >
              <span className="t-mikro font-black uppercase tracking-wide text-brand-dark dark:text-brand">
                Commentary · {isi.ayatEn.tafsir.oleh}
              </span>
              <span aria-hidden className="t-mikro font-black text-brand">{bukaTafsir ? '▲' : '▼'}</span>
            </button>
            {bukaTafsir && (
              <>
                <p className="t-kecil mt-2 leading-[1.65] text-ink dark:text-neutral-200">{isi.ayatEn.tafsir.teks}</p>
                <p className="t-mikro mt-2 leading-snug text-neutral-500">
                  {tafsirInfo?.tentang} This commentary is in {isi.ayatEn.tafsir.bahasa}. The translation above is
                  available in Indonesian, but the source that serves this app does not yet carry an Indonesian
                  commentary edition that could be verified — so none is shown rather than one that was guessed at.
                </p>
              </>
            )}
          </div>
        )}

        <p className="t-mikro mt-3 leading-snug text-neutral-500">
          <b>To sit with: </b>
          {renunganUntuk(isi.nomorSurah, isi.nomorAyat)}
        </p>

        <p className="t-mikro mt-2 leading-snug text-neutral-400">
          Text from {penyediaSekarang().nama}. Nothing here is written by this app — the verse, the translations, the
          commentary and the recitation are all fetched and checked for completeness before anything is shown.
          {isi.gagal.length > 0 && ` Not available today: ${isi.gagal.join(', ')}.`}
        </p>
      </div>
    </section>
  )
}

export default UbinAyat
