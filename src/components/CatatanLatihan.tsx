import { useMemo, useState } from 'react'
import { kunciTanggal } from '../lib/ramalan'
import { getWorkouts } from '../lib/workoutStore'
import { catatLatihanTangan, sesiTangan } from '../lib/latihanManual'

// ─────────────────────────────────────────────────────────────────────────────
// Catatan latihan dengan tangan — bentuknya sengaja SAMA dengan catatan harian.
//
// Dua borang yang menanyakan hal serupa dengan tata letak berbeda memaksa
// pemakainya belajar dua kali, dan yang kedua tidak pernah benar-benar
// dipelajari. Urutannya sama: pilihan tanggal di kanan judul, isian, satu
// bidang tersegmen, lalu satu tombol simpan selebar penuh.
//
// EMPAT PERTANYAAN, dan tidak lebih. Nama, lama, berat yang dirasakan, dan
// jarak bila ada. Kalori TIDAK ditanyakan maupun dihitung: ia menuntut berat
// badan dan nilai MET, sehingga hasilnya adalah taksiran di atas taksiran di
// atas lama yang dilaporkan sendiri — dan angka semacam itu tidak layak
// dipajang berdampingan dengan angka terukur.
// ─────────────────────────────────────────────────────────────────────────────

const BERAT = [
  { nilai: 2, label: 'Easy' },
  { nilai: 4, label: 'Moderate' },
  { nilai: 6, label: 'Hard' },
  { nilai: 8, label: 'Very hard' },
  { nilai: 10, label: 'All out' },
] as const

const HARI = 86400_000

export function CatatanLatihan() {
  const [untukKemarin, setUntukKemarin] = useState(false)
  const [nama, setNama] = useState('')
  const [menit, setMenit] = useState('')
  const [rpe, setRpe] = useState<number | null>(null)
  const [jarak, setJarak] = useState('')
  const [pesan, setPesan] = useState('')
  const [versi, setVersi] = useState(0)

  const tanggal = kunciTanggal(new Date(Date.now() - (untukKemarin ? HARI : 0)))

  const ringkas = useMemo(() => {
    const w = getWorkouts()
    const detikPerTanggal = new Map<string, number>()
    for (const x of w) {
      const kunci = kunciTanggal(new Date(x.mulai))
      const aman = Number.isFinite(x.durasi) && x.durasi > 0 ? x.durasi : 0
      detikPerTanggal.set(kunci, (detikPerTanggal.get(kunci) ?? 0) + aman)
    }

    const sesiTanggal = w
      .filter((x) => kunciTanggal(new Date(x.mulai)) === tanggal)
      .sort((a, b) => Date.parse(b.mulai) - Date.parse(a.mulai))
    const detikTanggal = detikPerTanggal.get(tanggal) ?? 0
    const tren = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setHours(12, 0, 0, 0)
      d.setDate(d.getDate() - (6 - i))
      const kunci = kunciTanggal(d)
      return {
        kunci,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        menit: Math.round((detikPerTanggal.get(kunci) ?? 0) / 60),
      }
    })
    const maxMenit7 = Math.max(1, ...tren.map((x) => x.menit))

    return {
      total: w.length,
      tangan: w.filter((x) => sesiTangan(x.id)).length,
      hari: sesiTanggal.length,
      menit: Math.round(detikTanggal / 60),
      terbaru: sesiTanggal[0] ?? null,
      tren,
      maxMenit7,
      hariAktif7: tren.filter((x) => x.menit > 0).length,
    }
    // versi ikut menjadi kebergantungan supaya daftarnya dibaca ulang setelah
    // satu sesi disimpan — tanpa itu ringkasannya tertinggal satu langkah.
  }, [versi, tanggal])

  const bolehSimpan = menit.trim() !== '' && rpe !== null

  function simpan() {
    if (!bolehSimpan) return
    const hasil = catatLatihanTangan({
      nama,
      tanggal,
      menit: Number(menit.replace(',', '.')),
      rpe: rpe as number,
      jarakKm: jarak.trim() ? Number(jarak.replace(',', '.')) : undefined,
    })
    if (!hasil) { setPesan('Lama sesi belum masuk akal — isi dalam menit.'); return }
    setPesan(`Saved for ${tanggal}.`)
    setNama(''); setMenit(''); setRpe(null); setJarak('')
    setVersi((v) => v + 1)
  }

  return (
    <section className="kaca rounded-3xl p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="t-sedang font-black text-ink dark:text-white">{untukKemarin ? "Yesterday's training" : "Today's training"}</h2>
        <button
          type="button"
          onClick={() => { setUntukKemarin((v) => !v); setPesan('') }}
          aria-pressed={untukKemarin}
          className={`t-mikro min-h-[40px] shrink-0 rounded-full px-3 font-bold transition ${
            untukKemarin ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'
          }`}
        >
          {untukKemarin ? 'for yesterday' : 'for yesterday?'}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2" aria-label={`Training logged for ${tanggal}`}>
        <div className="rounded-2xl bg-neutral-100/80 p-3 dark:bg-white/10">
          <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Sessions</div>
          <div className="mt-1 text-xl font-black tabular-nums text-ink dark:text-white">{ringkas.hari}</div>
        </div>
        <div className="rounded-2xl bg-neutral-100/80 p-3 dark:bg-white/10">
          <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Logged time</div>
          <div className="mt-1 text-xl font-black tabular-nums text-ink dark:text-white">{ringkas.menit}<span className="ml-1 text-xs font-bold text-neutral-500">min</span></div>
        </div>
      </div>

      <p className="t-kecil mt-2 leading-snug text-neutral-600 dark:text-neutral-300">
        {ringkas.hari === 0
          ? `No training logged ${untukKemarin ? 'yesterday' : 'today'} yet.`
          : `${ringkas.hari} session${ringkas.hari === 1 ? '' : 's'} logged ${untukKemarin ? 'yesterday' : 'today'} across ${ringkas.menit} minute${ringkas.menit === 1 ? '' : 's'}.`}
      </p>
      {ringkas.total > 0 && (
        <p className="t-mikro mt-1 text-neutral-500 dark:text-neutral-400">
          {ringkas.total} session${ringkas.total === 1 ? '' : 's'} saved overall{ringkas.tangan ? ` · ${ringkas.tangan} entered by hand` : ''}.
        </p>
      )}

      {ringkas.terbaru && (
        <div className="mt-3 rounded-2xl border border-neutral-100 p-3 dark:border-white/10">
          <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Latest logged</div>
          <div className="mt-1 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-black text-ink dark:text-white">
                {typeof ringkas.terbaru.nama === 'string' && ringkas.terbaru.nama.trim() ? ringkas.terbaru.nama.trim() : 'Training session'}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-semibold text-neutral-500">
                <span>{Number.isFinite(ringkas.terbaru.durasi) && ringkas.terbaru.durasi > 0 ? `${Math.round(ringkas.terbaru.durasi / 60)} min` : 'Duration unavailable'}</span>
                {Number.isFinite(ringkas.terbaru.jarakKm) && (ringkas.terbaru.jarakKm ?? 0) > 0 && <span>{ringkas.terbaru.jarakKm?.toFixed(1)} km</span>}
                {Number.isFinite(ringkas.terbaru.rpe) && (ringkas.terbaru.rpe ?? 0) > 0 && <span>RPE {ringkas.terbaru.rpe}/10</span>}
              </div>
            </div>
            <div className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-black text-brand-dark">Latest</div>
          </div>
        </div>
      )}

      <div className="mt-3 rounded-2xl border border-neutral-100 p-3 dark:border-white/10" aria-label="Training minutes over the last 7 days">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Last 7 days</div>
            <div className="mt-0.5 text-sm font-black text-ink dark:text-white">Training minutes</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-black tabular-nums text-brand-dark">{ringkas.hariAktif7}<span className="text-xs text-neutral-500">/7</span></div>
            <div className="t-mikro text-neutral-500">active days</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {ringkas.tren.map((d) => (
            <div key={d.kunci} className="min-w-0 text-center" aria-label={`${d.kunci}: ${d.menit} training minutes`}>
              <div className="flex h-16 items-end overflow-hidden rounded-lg bg-neutral-100 dark:bg-white/5">
                <div
                  className="w-full rounded-t-lg bg-brand/80"
                  style={{ height: d.menit > 0 ? `${Math.max(4, (d.menit / ringkas.maxMenit7) * 100)}%` : '0%' }}
                />
              </div>
              <div className="mt-1 truncate text-[9px] font-bold text-neutral-500">{d.label}</div>
              <div className="text-[9px] font-black tabular-nums text-ink dark:text-white">{d.menit || '—'}</div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          Bar height is relative to your busiest logged day in this 7-day window. It shows recorded duration, not training quality or recovery.
        </p>
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <label htmlFor="cl-nama" className="t-mikro mb-1 block font-bold uppercase tracking-wide text-neutral-500">
            What did you do
          </label>
          <input
            id="cl-nama"
            value={nama}
            onChange={(e) => { setNama(e.target.value.slice(0, 40)); setPesan('') }}
            placeholder="Run, football, weights…"
            className="t-sedang h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-fluid">
          <div>
            <label htmlFor="cl-menit" className="t-mikro mb-1 block font-bold uppercase tracking-wide text-neutral-500">
              Duration (minutes)
            </label>
            <input
              id="cl-menit"
              value={menit}
              onChange={(e) => { setMenit(e.target.value.replace(/[^\d]/g, '').slice(0, 4)); setPesan('') }}
              inputMode="numeric"
              placeholder="45"
              className="t-sedang h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 font-bold text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="cl-jarak" className="t-mikro mb-1 block font-bold uppercase tracking-wide text-neutral-500">
              Distance (km, optional)
            </label>
            <input
              id="cl-jarak"
              value={jarak}
              onChange={(e) => { setJarak(e.target.value.replace(/[^\d.,]/g, '').slice(0, 6)); setPesan('') }}
              inputMode="decimal"
              placeholder="5.2"
              className="t-sedang h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 font-bold text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
        </div>

        <div>
          <div className="t-mikro mb-1 font-bold uppercase tracking-wide text-neutral-500">How hard it felt</div>
          <div className="grid grid-cols-5 gap-0 rounded-xl bg-neutral-100 p-1 dark:bg-white/10">
            {BERAT.map((b) => (
              <button
                key={b.nilai}
                type="button"
                onClick={() => { setRpe(rpe === b.nilai ? null : b.nilai); setPesan('') }}
                aria-pressed={rpe === b.nilai}
                className={`t-kecil min-h-[40px] min-w-0 rounded-lg text-center font-bold transition ${
                  rpe === b.nilai ? 'bg-brand text-white' : 'text-neutral-600 dark:text-neutral-300'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={simpan}
          disabled={!bolehSimpan}
          className="t-sedang flex min-h-[44px] w-full items-center justify-center rounded-xl bg-brand font-black text-white transition disabled:opacity-40"
        >
          Save {untukKemarin ? "yesterday's" : "today's"} session
        </button>

        {pesan && <p className="t-kecil text-center text-brand-dark">{pesan}</p>}
      </div>
    </section>
  )
}

export default CatatanLatihan
