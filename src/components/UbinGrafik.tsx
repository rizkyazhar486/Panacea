import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getWorkouts } from '../lib/workoutStore'
import { deretMetrik } from '../lib/riwayatVitals'
import { useStore } from '../lib/store'
import { ambilWidget } from '../lib/homeWidgets'

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

/**
 * Denyut istirahat digambar sebagai GARIS, bukan batang.
 *
 * Batang menyatakan jumlah yang menumpuk dalam satu hari — menit latihan,
 * langkah, kalori. Denyut istirahat bukan jumlah: ia satu bacaan yang
 * berjalan naik-turun, dan menggambarnya sebagai batang dari dasar nol
 * memberi kesan seolah "0 bpm" adalah titik yang bermakna.
 */
function Garis({ deret }: { deret: number[] }) {
  const isi = deret.filter((v) => v > 0)
  if (isi.length < 3) return null
  const min = Math.min(...isi)
  const maks = Math.max(...isi)
  const rentang = maks - min || 1
  const titik = deret
    .map((v, i) => (v > 0 ? `${(i / (deret.length - 1)) * 100},${28 - ((v - min) / rentang) * 24}` : null))
    .filter(Boolean)
    .join(' ')
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="mt-2 h-9 w-full text-rose-500 dark:text-rose-400" aria-hidden>
      <polyline points={titik} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function Ubin({
  ke, judul, nilai, satuan, deret, nada, cahaya, bentuk = 'batang',
}: {
  ke: string; judul: string; nilai: string; satuan: string; deret: number[]
  nada: string; cahaya?: boolean; bentuk?: 'batang' | 'garis'
}) {
  return (
    <Link to={ke} className="kaca flex flex-col rounded-3xl p-3 transition active:scale-[0.98]">
      <span className="t-mikro truncate font-black uppercase tracking-wide text-neutral-500">{judul}</span>
      <span className="flex items-baseline gap-1">
        <span className={`t-angka font-black leading-none tabular-nums ${cahaya ? 'nyala' : 'text-ink dark:text-white'}`}>{nilai}</span>
        <span className="t-mikro font-bold text-neutral-400">{satuan}</span>
      </span>
      {bentuk === 'garis' ? <Garis deret={deret} /> : <Batang deret={deret} nada={nada} />}
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
  // Sebuah wilayah hanya dianggap "sudah bergrafik" bila grafiknya BENAR-BENAR
  // tampil: datanya ada DAN widgetnya dinyalakan. Tanpa syarat kedua, mematikan
  // grafik tidur akan menghilangkan tidur dari beranda sama sekali — ubin
  // teksnya sudah telanjur dibuang karena mengira grafiknya ada.
  const nyala = ambilWidget()
  const ada: string[] = []
  if (nyala.includes('grafikLatihan') && getWorkouts().length) ada.push('latihan')
  if (nyala.includes('grafikTidur') && (deretMetrik('sleepH').length || (state.sleepLogs ?? []).length)) ada.push('tidur')
  if (nyala.includes('grafikGizi') && (state.foods ?? []).length) ada.push('gizi')
  if (nyala.includes('grafikDenyut') && deretMetrik('restingHr').length >= 3) ada.push('tubuh')
  return ada
}

export function UbinGrafik() {
  const { state } = useStore()

  // Pilihan pemakai dihormati di sini juga. Tanpa ini, mematikan sebuah widget
  // tidak mengubah apa pun di layar, dan pemilihnya berhenti dipercaya.
  const [pilihan, setPilihan] = useState<string[]>(ambilWidget)
  useEffect(() => {
    const on = () => setPilihan(ambilWidget())
    window.addEventListener('panacea:home-widgets', on)
    return () => window.removeEventListener('panacea:home-widgets', on)
  }, [])

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

  // Denyut memakai 14 hari, bukan 7: ia bergerak pelan, dan tujuh titik terlalu
  // sedikit untuk membedakan perubahan sungguhan dari ragam harian biasa.
  const denyut = useMemo(() => deretMetrik('restingHr').slice(-14).map((t) => t.nilai), [])

  const ubin: {
    id: string; ke: string; judul: string; nilai: string; satuan: string; deret: number[]
    nada: string; bentuk?: 'batang' | 'garis'
  }[] = []

  const menitPekan = latihan.reduce((a, b) => a + b, 0)
  if (menitPekan > 0) ubin.push({ id: 'grafikLatihan', ke: '/latihan', judul: 'Training', nilai: String(menitPekan), satuan: 'min / 7 days', deret: latihan, nada: 'bg-brand' })

  const malam = tidur.filter((x) => x > 0)
  if (malam.length) ubin.push({ id: 'grafikTidur', ke: '/pola-tidur', judul: 'Sleep', nilai: (malam.reduce((a, b) => a + b, 0) / malam.length).toFixed(1), satuan: 'avg hrs', deret: tidur, nada: 'bg-indigo-400' })

  const hariLangkah = langkah.filter((x) => x > 0)
  if (hariLangkah.length) ubin.push({ id: 'grafikLangkah', ke: '/tubuh', judul: 'Steps', nilai: Math.round(hariLangkah.reduce((a, b) => a + b, 0) / hariLangkah.length).toLocaleString('en-GB'), satuan: 'per day', deret: langkah, nada: 'bg-cyan-400' })

  const hariGizi = gizi.filter((x) => x > 0)
  if (hariGizi.length) ubin.push({ id: 'grafikGizi', ke: '/nutrition', judul: 'Nutrition', nilai: Math.round(hariGizi.reduce((a, b) => a + b, 0) / hariGizi.length).toLocaleString('en-GB'), satuan: 'kcal / day', deret: gizi, nada: 'bg-amber-400' })

  if (denyut.length >= 3) {
    const akhir = denyut[denyut.length - 1]
    ubin.push({
      id: 'grafikDenyut', ke: '/tubuh', judul: 'Resting HR', nilai: String(Math.round(akhir)),
      satuan: 'bpm', deret: denyut, nada: 'bg-rose-400', bentuk: 'garis',
    })
  }

  const tampil = ubin.filter((u) => pilihan.includes(u.id))
  if (!tampil.length) return null

  return (
    <section>
      <h2 className="t-kecil mb-2 font-black uppercase tracking-wide text-neutral-500">Seven days</h2>
      <div className="grid grid-cols-2 gap-fluid">
        {tampil.map((u, i) => <Ubin key={u.id} {...u} cahaya={i === 0} />)}
      </div>
    </section>
  )
}

export default UbinGrafik
