import { useEffect, useMemo, useState } from 'react'
import { Card, SectionTitle } from '../components/ui'
import { IconChartUp } from '../components/icons'
import { useStore } from '../lib/store'
import { ambilRiwayat } from '../lib/riwayatVitals'
import { getWorkouts } from '../lib/workoutStore'
import { fmtDurasi, fmtPace } from '../lib/workoutImport'

// ─────────────────────────────────────────────────────────────────────────────
// Harian — satu hari mana pun, ditelusuri maju-mundur.
//
// APA YANG DIPISAHKAN DI SINI. Sebuah hari punya dua macam isi: yang TERUKUR
// (masuk sendiri dari perangkat) dan yang DIRASAKAN (hanya Anda yang tahu).
// Keduanya sengaja dipisah menjadi dua blok dengan judul yang menyebutkan
// asalnya, karena begitu keduanya dicampur dalam satu kisi, nilai yang
// dilaporkan sendiri mulai terbaca seolah ikut diukur alat.
//
// KOSONG BERKATA KOSONG. Hari tanpa catatan menampilkan garis "—", bukan nol.
// Nol adalah bacaan; garis adalah ketiadaan bacaan, dan model tidak boleh
// mengira keduanya sama.
//
// HARI DEPAN TIDAK DAPAT DIBUKA. Tidak ada yang dapat dicatat untuk hari yang
// belum terjadi, dan borang yang dapat diisi untuk besok akan menghasilkan data
// bertanggal salah — yang lebih buruk daripada data yang hilang, karena ia
// tetap ikut dihitung.
// ─────────────────────────────────────────────────────────────────────────────

const HARI = 86400_000

function kunci(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const NAMA_HARI = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const NAMA_BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function judulTanggal(d: Date): string {
  return `${NAMA_HARI[d.getDay()]}, ${d.getDate()} ${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`
}

interface Petak {
  label: string
  nilai: string
  satuan?: string
}

function Petak({ p }: { p: Petak }) {
  const kosong = p.nilai === '—'
  return (
    <div className={`rounded-xl p-2.5 ${kosong ? 'border border-dashed border-neutral-300 dark:border-white/15' : 'bg-black/[0.03] dark:bg-white/5'}`}>
      <span className="block truncate text-[9.5px] font-bold uppercase tracking-wide text-neutral-500">{p.label}</span>
      <span className="flex items-baseline gap-1">
        <span className={`text-[17px] font-black leading-none tabular-nums ${kosong ? 'text-neutral-300 dark:text-neutral-600' : 'text-ink dark:text-white'}`}>
          {p.nilai}
        </span>
        {p.satuan && !kosong && <span className="text-[9.5px] font-bold text-neutral-400">{p.satuan}</span>}
      </span>
    </div>
  )
}

export function Harian() {
  const { state, logWellness } = useStore()
  const [geser, setGeser] = useState(0) // 0 = hari ini, negatif = ke belakang
  const tanggalObj = useMemo(() => new Date(Date.now() + geser * HARI), [geser])
  const tgl = kunci(tanggalObj)

  const riwayat = useMemo(() => ambilRiwayat(), [])
  const sesi = useMemo(() => getWorkouts(), [])

  const hari = riwayat.find((h) => h.tanggal === tgl)
  const sesiHari = sesi.filter((w) => w.mulai.slice(0, 10) === tgl)
  const w = state.wellness?.[tgl]
  const tidurLog = (state.sleepLogs ?? []).find((s) => s.date === tgl)

  const [tenaga, setTenaga] = useState<number | null>(null)
  const [catatan, setCatatan] = useState('')
  useEffect(() => {
    setTenaga(w?.tenaga ?? null)
    setCatatan(w?.catatan ?? '')
  }, [tgl, w?.tenaga, w?.catatan])

  // Panah kiri/kanan menelusuri hari. Halaman ini isinya satu hari, jadi papan
  // ketik yang memindahkan hari adalah yang diharapkan orang.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return
      if (e.key === 'ArrowLeft') setGeser((g) => g - 1)
      if (e.key === 'ArrowRight') setGeser((g) => Math.min(0, g + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const angka = (x: unknown, bulat = 0): string =>
    typeof x === 'number' && Number.isFinite(x) && x > 0
      ? (bulat ? x.toFixed(bulat) : Math.round(x).toLocaleString('id-ID'))
      : '—'

  const totalKm = sesiHari.reduce((a, s) => a + (s.jarakKm ?? 0), 0)
  const totalDetik = sesiHari.reduce((a, s) => a + (s.durasi ?? 0), 0)

  const terukur: Petak[] = [
    { label: 'Running', nilai: totalKm > 0 ? totalKm.toFixed(1) : '—', satuan: 'km' },
    { label: 'Steps', nilai: angka(hari?.nilai.steps) },
    { label: 'Weight', nilai: angka(hari?.nilai.weightKg, 1), satuan: 'kg' },
    { label: 'Resting HR', nilai: angka(hari?.nilai.restingHr), satuan: 'bpm' },
    { label: 'HRV', nilai: angka(hari?.nilai.hrvMs), satuan: 'ms' },
    { label: 'Sleep', nilai: angka(hari?.nilai.sleepH ?? tidurLog?.hours, 1), satuan: 'h' },
  ]

  const pekan = Array.from({ length: 7 }, (_, i) => {
    const g = geser - tanggalObj.getDay() + i
    const d = new Date(Date.now() + g * HARI)
    return { g, d, kunci: kunci(d) }
  })

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-fluid pb-24">
      <SectionTitle icon={<IconChartUp size={20} />} title="Daily" subtitle="Browse any day — what was measured and what you felt" />

      <div className="flex items-center gap-2">
        <button onClick={() => setGeser((g) => g - 1)} aria-label="Previous day"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-neutral-100 text-lg font-black dark:bg-white/10">‹</button>
        <div className="min-w-0 flex-1 text-center">
          <span className="block truncate text-[14px] font-black text-ink dark:text-white">{judulTanggal(tanggalObj)}</span>
          <span className="block text-[11px] text-neutral-500">
            {geser === 0 ? 'Today' : geser === -1 ? 'Yesterday' : `${Math.abs(geser)} days ago`}
          </span>
        </div>
        <button onClick={() => setGeser((g) => Math.min(0, g + 1))} disabled={geser === 0} aria-label="Next day"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-neutral-100 text-lg font-black disabled:opacity-30 dark:bg-white/10">›</button>
      </div>

      {/* Bilah pekan: hari yang punya isi ditandai titik, bukan warna saja. */}
      <div className="grid grid-cols-7 gap-1">
        {pekan.map((h) => {
          const isi = riwayat.some((r) => r.tanggal === h.kunci) || !!state.wellness?.[h.kunci] || sesi.some((s) => s.mulai.slice(0, 10) === h.kunci)
          const kini = h.g === geser
          const depan = h.g > 0
          return (
            <button
              key={h.kunci}
              disabled={depan}
              onClick={() => setGeser(h.g)}
              className={`flex min-h-[52px] flex-col items-center justify-center rounded-xl text-[10px] font-bold transition disabled:opacity-25 ${
                kini ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'
              }`}
            >
              <span>{NAMA_HARI[h.d.getDay()].slice(0, 3)}</span>
              <span className="tabular-nums">{h.d.getDate()}</span>
              <span className={`mt-0.5 h-1 w-1 rounded-full ${isi ? (kini ? 'bg-white' : 'bg-brand') : 'bg-transparent'}`} />
            </button>
          )
        })}
      </div>

      <Card className="!p-3">
        <span className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Measured — arrives automatically from your device</span>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {terukur.map((p) => <Petak key={p.label} p={p} />)}
        </div>
        {sesiHari.length > 0 && (
          <div className="mt-2 space-y-1">
            {sesiHari.map((s) => (
              <div key={s.id} className="flex items-baseline justify-between gap-2 rounded-xl bg-black/[0.03] px-2.5 py-2 dark:bg-white/5">
                <span className="min-w-0 truncate text-[12px] font-bold text-ink dark:text-white">{s.nama}</span>
                <span className="shrink-0 text-[11px] tabular-nums text-neutral-500">
                  {s.jarakKm ? `${s.jarakKm.toFixed(1)} km · ` : ''}{fmtDurasi(s.durasi)}
                  {s.jarakKm && s.durasi ? ` · ${fmtPace(Math.round(s.durasi / s.jarakKm))}/km` : ''}
                  {s.avgHr ? ` · ${Math.round(s.avgHr)} bpm` : ''}
                </span>
              </div>
            ))}
          </div>
        )}
        {sesiHari.length === 0 && totalDetik === 0 && (
          <p className="mt-2 text-[11px] text-neutral-400">No sessions stored for this day.</p>
        )}
      </Card>

      <Card className="!p-3">
        <span className="text-[10px] font-black uppercase tracking-wide text-neutral-500">You log it — no device measures this</span>

        <div className="mt-2">
          <span className="text-[11px] font-bold text-neutral-500">Energy that day</span>
          <div className="mt-1 flex gap-1">
            {['Empty', 'Low', 'Normal', 'Fresh', 'Full'].map((l, i) => (
              <button
                key={l}
                onClick={() => { const n = i + 1; setTenaga(n); logWellness(tgl, { tenaga: n }) }}
                aria-pressed={tenaga === i + 1}
                className={`flex min-h-[40px] flex-1 items-center justify-center rounded-xl text-[11px] font-bold transition ${
                  tenaga === i + 1 ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <label className="text-[11px] font-bold text-neutral-500" htmlFor="catatan-harian">Notes</label>
          <textarea
            id="catatan-harian"
            value={catatan}
            maxLength={280}
            onChange={(e) => setCatatan(e.target.value)}
            onBlur={() => logWellness(tgl, { catatan: catatan.trim() })}
            placeholder="How it felt, where it hurt, the weather…"
            className="mt-1 h-20 w-full rounded-xl border border-neutral-200 bg-white p-2.5 text-[13px] text-ink placeholder:text-neutral-400 dark:border-white/15 dark:bg-white/10 dark:text-white"
          />
          <span className="text-[10px] text-neutral-400">{catatan.length}/280 · saved when you leave the box</span>
        </div>

        <p className="mt-2 text-[11px] leading-snug text-neutral-500">
          Energy and notes are <b>never fed into the training-load model</b>. A self-reported value cannot be
          equated with a measured one — and it is precisely when the two disagree that the disagreement tells you
          something.
        </p>
      </Card>
    </div>
  )
}

export default Harian
