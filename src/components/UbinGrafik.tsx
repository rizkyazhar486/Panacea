import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getWorkouts } from '../lib/workoutStore'
import { deretMetrik } from '../lib/riwayatVitals'
import { useStore } from '../lib/store'

// ─────────────────────────────────────────────────────────────────────────────
// Ubin berbentuk GRAFIK, bukan kalimat.
//
// Bentuknya sama untuk semuanya: satu angka besar, satu satuan, dan tujuh
// batang. Tujuh batang karena satu pekan adalah satuan waktu yang benar-benar
// dijalani orang — bukan karena tujuh muat di layar.
//
// TIDAK ADA KALIMAT DI DALAM UBIN. Sebuah ubin menjawab satu pertanyaan:
// "berapa, dan bagaimana pekan ini berjalan". Jawaban yang perlu kalimat
// bukan milik dasbor, melainkan milik halaman yang dituju ubin itu.
//
// UBIN TANPA DATA TIDAK DIGAMBAR SAMA SEKALI. Tujuh batang kosong terlihat
// seperti tujuh hari yang gagal, padahal artinya hanya "belum ada yang
// tercatat".
// ─────────────────────────────────────────────────────────────────────────────

const HARI = 864e5

function kunci(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Tujuh hari terakhir, hari ini di kanan. */
function tujuhHari(nilai: Map<string, number>): number[] {
  const kini = Date.now()
  return Array.from({ length: 7 }, (_, i) => nilai.get(kunci(new Date(kini - (6 - i) * HARI))) ?? 0)
}

function Batang({ deret, nada }: { deret: number[]; nada: string }) {
  const maks = Math.max(...deret, 1)
  return (
    <div className="mt-2 flex h-9 items-end gap-[3px]">
      {deret.map((v, i) => (
        <span
          key={i}
          className={`flex-1 rounded-[2px] ${v > 0 ? nada : 'bg-neutral-200 dark:bg-white/10'}`}
          style={{ height: v > 0 ? `${Math.max(12, (v / maks) * 100)}%` : '12%' }}
        />
      ))}
    </div>
  )
}

function Ubin({
  ke, judul, nilai, satuan, deret, nada, cahaya,
}: {
  ke: string; judul: string; nilai: string; satuan: string; deret: number[]; nada: string; cahaya?: boolean
}) {
  return (
    <Link to={ke} className="kaca flex flex-col rounded-3xl p-3 transition active:scale-[0.98]">
      <span className="t-mikro truncate font-black uppercase tracking-wide text-neutral-500">{judul}</span>
      <span className="flex items-baseline gap-1">
        <span className={`t-angka font-black leading-none tabular-nums ${cahaya ? 'nyala' : 'text-ink dark:text-white'}`}>{nilai}</span>
        <span className="t-mikro font-bold text-neutral-400">{satuan}</span>
      </span>
      <Batang deret={deret} nada={nada} />
    </Link>
  )
}

/**
 * Wilayah mana yang SUDAH digambarkan sebagai grafik.
 *
 * Dipakai papan widget untuk membuang ubin teks yang mengulang wilayah yang
 * sama. Tanpa ini, "Latihan" muncul dua kali dalam satu layar: sekali sebagai
 * tujuh batang, sekali sebagai kalimat — dan yang kedua hanya menambah
 * panjang halaman.
 */
export function wilayahBergrafik(state: { foods?: unknown[]; sleepLogs?: unknown[] }): string[] {
  const ada: string[] = []
  if (getWorkouts().length) ada.push('latihan')
  if (deretMetrik('sleepH').length || (state.sleepLogs ?? []).length) ada.push('tidur')
  if ((state.foods ?? []).length) ada.push('gizi')
  return ada
}

export function UbinGrafik() {
  const { state } = useStore()

  const latihan = useMemo(() => {
    const m = new Map<string, number>()
    for (const w of getWorkouts()) {
      const t = w.mulai.slice(0, 10)
      m.set(t, (m.get(t) ?? 0) + Math.round((w.durasi ?? 0) / 60))
    }
    return tujuhHari(m)
  }, [])

  const tidur = useMemo(() => {
    const m = new Map<string, number>()
    for (const t of deretMetrik('sleepH')) m.set(t.tanggal, t.nilai)
    for (const s of state.sleepLogs ?? []) if (s?.date && s.hours > 0) m.set(s.date, s.hours)
    return tujuhHari(m)
  }, [state.sleepLogs])

  const langkah = useMemo(() => {
    const m = new Map<string, number>()
    for (const t of deretMetrik('steps')) m.set(t.tanggal, t.nilai)
    return tujuhHari(m)
  }, [])

  const gizi = useMemo(() => {
    const m = new Map<string, number>()
    for (const f of state.foods ?? []) if (f?.date) m.set(f.date, (m.get(f.date) ?? 0) + (f.kcal ?? 0))
    return tujuhHari(m)
  }, [state.foods])

  const ubin: { ke: string; judul: string; nilai: string; satuan: string; deret: number[]; nada: string }[] = []

  const menitPekan = latihan.reduce((a, b) => a + b, 0)
  if (menitPekan > 0) ubin.push({ ke: '/latihan', judul: 'Latihan', nilai: String(menitPekan), satuan: 'mnt / 7 hari', deret: latihan, nada: 'bg-brand' })

  const malam = tidur.filter((x) => x > 0)
  if (malam.length) ubin.push({ ke: '/pola-tidur', judul: 'Tidur', nilai: (malam.reduce((a, b) => a + b, 0) / malam.length).toFixed(1), satuan: 'jam rata-rata', deret: tidur, nada: 'bg-indigo-400' })

  const hariLangkah = langkah.filter((x) => x > 0)
  if (hariLangkah.length) ubin.push({ ke: '/tubuh', judul: 'Langkah', nilai: Math.round(hariLangkah.reduce((a, b) => a + b, 0) / hariLangkah.length).toLocaleString('id-ID'), satuan: 'per hari', deret: langkah, nada: 'bg-cyan-400' })

  const hariGizi = gizi.filter((x) => x > 0)
  if (hariGizi.length) ubin.push({ ke: '/nutrition', judul: 'Gizi', nilai: Math.round(hariGizi.reduce((a, b) => a + b, 0) / hariGizi.length).toLocaleString('id-ID'), satuan: 'kkal / hari', deret: gizi, nada: 'bg-amber-400' })

  if (!ubin.length) return null

  return (
    <section>
      <h2 className="t-kecil mb-2 font-black uppercase tracking-wide text-neutral-500">Tujuh hari</h2>
      <div className="grid grid-cols-2 gap-fluid">
        {ubin.map((u, i) => <Ubin key={u.judul} {...u} cahaya={i === 0} />)}
      </div>
    </section>
  )
}

export default UbinGrafik
