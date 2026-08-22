import { Fragment, useMemo } from 'react'
import { getWorkouts } from '../lib/workoutStore'
import { ambilRiwayat } from '../lib/riwayatVitals'
import { useStore } from '../lib/store'

// ─────────────────────────────────────────────────────────────────────────────
// Peta konsistensi — 12 pekan terakhir, satu petak per hari.
//
// MENGAPA BENTUK INI. Angka "rangkaian 23 hari" hanya memberi tahu satu hal,
// dan hal itu hilang seluruhnya begitu satu hari terlewat. Peta menyimpan
// SELURUH riwayatnya: pekan yang padat, pekan yang bolong, dan pola yang hanya
// terlihat bila dilihat berbulan-bulan — misalnya hari Minggu yang selalu
// kosong. Itu keterangan; "23" bukan.
//
// TIDAK ADA HUKUMAN DI SINI. Hari kosong digambar sebagai petak redup, bukan
// merah. Merah menjadikan hari yang terlewat sebagai vonis, dan justru itu yang
// membuat orang berhenti sama sekali alih-alih melanjutkan.
//
// EMPAT TINGKAT, BUKAN GRADASI HALUS. Mata tidak dapat membedakan lebih dari
// beberapa tingkat kepekatan pada petak sekecil ini; tingkat kelima hanya
// menambah kesan teliti tanpa menambah keterangan.
// ─────────────────────────────────────────────────────────────────────────────

const HARI = 864e5
const PEKAN = 12

function kunci(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const NAMA_HARI = ['M', 'S', 'S', 'R', 'K', 'J', 'S']
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export function PetaKonsistensi() {
  const { state } = useStore()

  // Satu hari dihitung "terisi" bila ADA JEJAK apa pun: sesi latihan, catatan
  // harian, catatan tidur, atau bacaan tubuh. Menuntut keempatnya sekaligus
  // akan menghukum orang yang memakai aplikasi ini persis sebagaimana
  // dimaksudkan — sebagian orang hanya mencatat tidur, dan itu tetap mencatat.
  const bobot = useMemo(() => {
    const peta = new Map<string, number>()
    const tambah = (t: string) => peta.set(t, (peta.get(t) ?? 0) + 1)
    for (const w of getWorkouts()) tambah(w.mulai.slice(0, 10))
    for (const s of state.sleepLogs ?? []) if (s?.date) tambah(s.date)
    for (const t of Object.keys(state.wellness ?? {})) tambah(t)
    for (const h of ambilRiwayat()) if (h?.tanggal) tambah(h.tanggal)
    return peta
  }, [state.sleepLogs, state.wellness])

  const { kolom, label, terisi } = useMemo(() => {
    const kini = new Date()
    // Kolom terakhir berakhir pada hari ini; mundur ke Minggu terdekat supaya
    // tiap kolom benar-benar satu pekan penuh.
    const akhir = new Date(kini.getTime() - kini.getDay() * HARI)
    const kolom: { tanggal: string; nilai: number }[][] = []
    const label: { i: number; teks: string }[] = []
    let bulanTerakhir = -1
    let terisi = 0

    for (let p = PEKAN - 1; p >= 0; p--) {
      const mingguAwal = new Date(akhir.getTime() - p * 7 * HARI)
      const hari: { tanggal: string; nilai: number }[] = []
      for (let h = 0; h < 7; h++) {
        const d = new Date(mingguAwal.getTime() + h * HARI)
        const t = kunci(d)
        const n = d.getTime() > kini.getTime() ? -1 : (bobot.get(t) ?? 0)
        if (n > 0) terisi += 1
        hari.push({ tanggal: t, nilai: n })
      }
      const b = mingguAwal.getMonth()
      if (b !== bulanTerakhir) {
        label.push({ i: PEKAN - 1 - p, teks: BULAN[b] })
        bulanTerakhir = b
      }
      kolom.push(hari)
    }
    return { kolom, label, terisi }
  }, [bobot])

  if (!terisi) return null

  const warna = (n: number) => {
    if (n < 0) return 'transparent'
    if (n === 0) return 'var(--petak-kosong)'
    if (n === 1) return 'var(--petak-1)'
    if (n === 2) return 'var(--petak-2)'
    return 'var(--petak-3)'
  }

  return (
    <section className="peta-konsistensi kaca rounded-3xl p-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">Konsistensi</h2>
        <span className="t-mikro tabular-nums text-neutral-400">{terisi} hari tercatat · {PEKAN} pekan</span>
      </div>

      {/* SATU KISI, BUKAN DUA KOLOM YANG DISUSUN BERDAMPINGAN.
          Percobaan pertama menaruh nama hari pada kolom terpisah dengan tinggi
          yang ditebak; pada tangkapan layar huruf S/R/J menumpuk di atas dan
          tidak lagi menunjuk barisnya. Dengan satu kisi, tinggi barisnya
          ditentukan petaknya sendiri dan nama hari tidak dapat meleset. */}
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: `12px repeat(${PEKAN}, minmax(0, 1fr))` }}
      >
        <span />
        {kolom.map((_, i) => (
          <span key={`b${i}`} className="text-[7.5px] leading-none text-neutral-500">
            {label.find((l) => l.i === i)?.teks ?? ''}
          </span>
        ))}
        {NAMA_HARI.map((nama, baris) => (
          <Fragment key={baris}>
            <span className="flex items-center text-[7.5px] leading-none text-neutral-500">
              {baris === 1 || baris === 3 || baris === 5 ? nama : ''}
            </span>
            {kolom.map((minggu) => {
              const h = minggu[baris]
              return (
                <span
                  key={h.tanggal}
                  title={`${h.tanggal}${h.nilai > 0 ? ` · ${h.nilai} catatan` : ''}`}
                  className="aspect-square w-full rounded-[2px]"
                  style={{ background: warna(h.nilai) }}
                />
              )
            })}
          </Fragment>
        ))}
      </div>

    </section>
  )
}

export default PetaKonsistensi
