import { useMemo, useState } from 'react'
import type { ImportedWorkout } from '../lib/workoutImport'
import {
  deretHarian, deretPekanan, cakupanBidang, zonaDenyut, bandingkan, tulisPace,
  type TitikHarian,
} from '../lib/analisisHarian'

// ─────────────────────────────────────────────────────────────────────────────
// Grafik olahraga sehari-hari: jarak, langkah, pace, denyut, zona, kadens.
//
// DIGAMBAR SEBAGAI SVG LANGSUNG, tanpa pustaka grafik. Pustaka grafik yang
// ringan sekalipun menambah puluhan kilobita ke bundel yang sudah lewat batas
// peringatan, demi enam grafik yang bentuknya sederhana. Yang dibutuhkan di
// sini hanya garis, batang, dan sumbu.
//
// DUA ATURAN YANG TIDAK BOLEH DILANGGAR, dan keduanya lahir dari cacat yang
// sudah pernah terjadi di aplikasi ini:
//
//   1. HARI TANPA DATA MEMUTUS GARIS, TIDAK MENARIKNYA KE NOL. Menarik ke nol
//      menggambar penurunan tajam pada hari yang justru rajin — pembacanya
//      menyimpulkan dirinya mundur padahal jamnya hanya tidak merekam.
//
//   2. GRAFIK YANG DATANYA TERLALU SEDIKIT TIDAK DIGAMBAR. Ia mengatakan
//      berapa sesi yang punya bidang itu. Tren kadens dari tiga sesi di antara
//      delapan puluh bukan kebiasaan seseorang; menyajikannya sebagai tren
//      adalah kebohongan yang tidak akan pernah dilaporkan siapa pun.
//
// PACE DIBALIK SUMBUNYA. Pace yang lebih kecil berarti lebih cepat, jadi grafik
// yang naik harus berarti membaik. Menggambarnya apa adanya membuat kemajuan
// terlihat seperti kemunduran.
// ─────────────────────────────────────────────────────────────────────────────

const L = 34, R = 6, A = 8, B = 18   // tepi kiri, kanan, atas, bawah
const W = 320, H = 96

/** Ambang minimum sesi sebelum sebuah tren layak digambar. */
const MIN_SESI = 5

function Kosong({ pesan }: { pesan: string }) {
  return (
    <p className="rounded-xl bg-white/5 p-3 text-[11.5px] leading-snug text-neutral-500">{pesan}</p>
  )
}

function Judul({ teks, kanan }: { teks: string; kanan?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[10px] font-black uppercase tracking-wide text-neutral-500">{teks}</span>
      {kanan}
    </div>
  )
}

function Delta({ pct, terbalik = false }: { pct: number | null; terbalik?: boolean }) {
  if (pct === null) return <span className="text-[10.5px] text-neutral-500">no comparison yet</span>
  const baik = terbalik ? pct < 0 : pct > 0
  const warna = pct === 0 ? 'text-neutral-400' : baik ? 'text-emerald-400' : 'text-amber-400'
  return (
    <span className={`text-[10.5px] font-bold ${warna}`}>
      {pct > 0 ? '+' : ''}{pct}% vs pekan lalu
    </span>
  )
}

/** Garis; nilai null MEMUTUS garisnya. */
function Garis({
  nilai, warna, balik = false, format,
}: { nilai: (number | null)[]; warna: string; balik?: boolean; format: (n: number) => string }) {
  const ada = nilai.filter((n): n is number => n !== null)
  if (ada.length < 2) return <Kosong pesan="Not enough points to draw yet." />
  const lo = Math.min(...ada), hi = Math.max(...ada)
  const rentang = hi - lo || 1
  const x = (i: number) => L + (i / Math.max(1, nilai.length - 1)) * (W - L - R)
  const y = (v: number) => {
    const t = (v - lo) / rentang
    // balik=true untuk pace: nilai kecil (cepat) digambar di ATAS.
    return A + (balik ? t : 1 - t) * (H - A - B)
  }

  const potongan: string[] = []
  let kini: string[] = []
  nilai.forEach((v, i) => {
    if (v === null) { if (kini.length > 1) potongan.push(kini.join(' ')); kini = []; return }
    kini.push(`${kini.length ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
  })
  if (kini.length > 1) potongan.push(kini.join(' '))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="trend chart">
      <line x1={L} y1={H - B} x2={W - R} y2={H - B} stroke="currentColor" strokeOpacity="0.15" />
      <text x={2} y={A + 8} className="fill-current text-[9px] opacity-50">{format(balik ? lo : hi)}</text>
      <text x={2} y={H - B - 2} className="fill-current text-[9px] opacity-50">{format(balik ? hi : lo)}</text>
      {potongan.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={warna} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {nilai.map((v, i) =>
        v === null ? null : <circle key={i} cx={x(i)} cy={y(v)} r="1.6" fill={warna} opacity="0.85" />,
      )}
    </svg>
  )
}

/** Batang mingguan. */
function Batang({ nilai, label, warna, format }: {
  nilai: (number | null)[]; label: string[]; warna: string; format: (n: number) => string
}) {
  const ada = nilai.filter((n): n is number => n !== null)
  if (!ada.length) return <Kosong pesan="No data to draw yet." />
  const hi = Math.max(...ada) || 1
  const lebar = (W - L - R) / nilai.length
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="weekly chart">
      <line x1={L} y1={H - B} x2={W - R} y2={H - B} stroke="currentColor" strokeOpacity="0.15" />
      <text x={2} y={A + 8} className="fill-current text-[9px] opacity-50">{format(hi)}</text>
      {nilai.map((v, i) => {
        const t = ((v ?? 0) / hi) * (H - A - B)
        return (
          <g key={i}>
            <rect
              x={L + i * lebar + lebar * 0.18}
              y={H - B - t}
              width={lebar * 0.64}
              height={Math.max(v ? 1.5 : 0, t)}
              rx="1.5"
              fill={warna}
              opacity={i === nilai.length - 1 ? 1 : 0.6}
            />
            {i % 3 === 0 && (
              <text x={L + i * lebar + lebar / 2} y={H - 6} textAnchor="middle" className="fill-current text-[8px] opacity-45">
                {label[i]}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function KartuGrafik({ judul, kanan, anak }: { judul: string; kanan?: React.ReactNode; anak: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <Judul teks={judul} kanan={kanan} />
      <div className="mt-1.5 text-neutral-400">{anak}</div>
    </div>
  )
}

/*
 * DUA UKURAN, SATU SUMBER.
 *
 * Beranda tidak boleh menerima keenam grafik: kartu setinggi enam layar di
 * beranda membuat orang berhenti menggulir sebelum sampai ke kartu lain, dan
 * kartu di bawahnya menjadi tidak pernah terlihat. Yang dibawa orang ke beranda
 * hanyalah 'bagaimana pekan ini' — jaraknya, dan sebaran zonanya.
 *
 * Tetapi versi ringkasnya TIDAK ditulis ulang sebagai komponen terpisah.
 * Salinan kedua pasti berselisih setelah beberapa kali disunting, dan
 * pembacanya tidak punya cara tahu mana yang berlaku — itu sudah terjadi di
 * aplikasi ini pada catatan penyakit yang kembar. Di sini ia hanya cabang
 * lebih awal di dalam komponen yang sama, memakai perhitungan yang sama persis.
 */
export function GrafikOlahraga({
  workouts, hrMax, sekarang = Date.now(), ringkas = false,
}: { workouts: ImportedWorkout[]; hrMax: number; sekarang?: number; ringkas?: boolean }) {
  const [rentang, setRentang] = useState<30 | 90>(30)

  const harian = useMemo(() => deretHarian(workouts, rentang, sekarang), [workouts, rentang, sekarang])
  const pekanan = useMemo(() => deretPekanan(workouts, 12, sekarang), [workouts, sekarang])
  const cakup = useMemo(() => cakupanBidang(workouts), [workouts])
  const zona = useMemo(() => zonaDenyut(workouts, hrMax, 28, sekarang), [workouts, hrMax, sekarang])

  const pekanIni = pekanan[pekanan.length - 1]
  const pekanLalu = pekanan[pekanan.length - 2]
  const labelPekan = pekanan.map((p) => p.awal.slice(5).replace('-', '/'))

  if (!workouts.length) {
    return <Kosong pesan="No sessions recorded yet. Import from a watch or log one session, and the charts appear here." />
  }

  const totalKm = harian.reduce((a, d) => a + (d.km ?? 0), 0)
  const totalLangkah = harian.reduce((a, d) => a + (d.langkah ?? 0), 0)
  const hariAktif = harian.filter((d) => d.sesi > 0).length

  if (ringkas) {
    const z12 = zona.zona[0].pct + zona.zona[1].pct
    return (
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
            Exercise, 30 days
          </span>
          <Delta pct={bandingkan(pekanIni?.km ?? null, pekanLalu?.km ?? null).deltaPct} />
        </div>

        <div className="flex items-baseline gap-4">
          <span className="text-lg font-black text-white">
            {totalKm > 0 ? totalKm.toFixed(1) : '—'}
            <span className="ml-1 text-[11px] font-bold text-slate-400">km</span>
          </span>
          <span className="text-lg font-black text-white">
            {totalLangkah > 0 ? (totalLangkah / 1000).toFixed(0) + 'k' : '—'}
            <span className="ml-1 text-[11px] font-bold text-slate-400">steps</span>
          </span>
          <span className="text-lg font-black text-white">
            {hariAktif}
            <span className="ml-1 text-[11px] font-bold text-slate-400">active days</span>
          </span>
        </div>

        {/* Satu grafik saja di beranda, dan yang dipilih adalah jarak per
            pekan — satuan yang paling dekat dengan cara orang mengingat
            latihannya sendiri. */}
        <div className="text-slate-400">
          {cakup.jarak.ada === 0
            ? <Kosong pesan="No session has recorded a distance yet." />
            : <Batang nilai={pekanan.map((p) => p.km)} label={labelPekan} warna="#60a5fa" format={(n) => n.toFixed(0) + ' km'} />}
        </div>

        {zona.sesiDipakai > 0 && (
          <div>
            <div className="flex h-1.5 overflow-hidden rounded-full bg-white/5">
              {zona.zona.map((z) => (
                z.pct > 0 && <div key={z.z} style={{ width: `${z.pct}%`, background: z.warna }} />
              ))}
            </div>
            <p className="mt-1 text-[10.5px] text-slate-500">{z12}% of time in Z1–Z2 (easy aerobic)</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-[15px] font-black text-white">Your exercise numbers</h3>
          <p className="text-[11px] text-neutral-500">
            {hariAktif} active days out of the last {rentang} days
          </p>
        </div>
        <div className="flex shrink-0 gap-1 rounded-full bg-white/5 p-1">
          {([30, 90] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRentang(r)}
              className={`min-h-[32px] rounded-full px-3 text-[11px] font-bold transition ${
                rentang === r ? 'bg-brand text-white' : 'text-neutral-400'
              }`}
            >
              {r} hari
            </button>
          ))}
        </div>
      </div>

      {/* Angka besar dahulu: yang paling sering dicari orang adalah totalnya,
          bukan bentuk grafiknya. */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-white/5 p-3">
          <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Distance</div>
          <div className="mt-0.5 text-lg font-black text-white">
            {totalKm > 0 ? totalKm.toFixed(1) : '—'}
            <span className="ml-1 text-[11px] font-bold text-neutral-500">km</span>
          </div>
        </div>
        <div className="rounded-2xl bg-white/5 p-3">
          <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Steps</div>
          <div className="mt-0.5 text-lg font-black text-white">
            {totalLangkah > 0 ? (totalLangkah / 1000).toFixed(1) + 'k' : '—'}
          </div>
        </div>
        <div className="rounded-2xl bg-white/5 p-3">
          <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Sessions</div>
          <div className="mt-0.5 text-lg font-black text-white">
            {harian.reduce((a, d) => a + d.sesi, 0)}
          </div>
        </div>
      </div>

      <KartuGrafik
        judul="Distance per week (km)"
        kanan={<Delta pct={bandingkan(pekanIni?.km ?? null, pekanLalu?.km ?? null).deltaPct} />}
        anak={
          cakup.jarak.ada === 0
            ? <Kosong pesan="Not a single session has recorded a distance. This chart appears once there is a session with distance (running, walking, cycling)." />
            : <Batang nilai={pekanan.map((p) => p.km)} label={labelPekan} warna="#60a5fa" format={(n) => n.toFixed(0) + ' km'} />
        }
      />

      <KartuGrafik
        judul="Daily steps"
        kanan={<span className="text-[10.5px] text-neutral-500">{cakup.langkah.ada}/{cakup.langkah.total} sessions recording</span>}
        anak={
          cakup.langkah.ada < MIN_SESI
            ? <Kosong pesan={`Only ${cakup.langkah.ada} sessions have recorded steps — not enough to call a trend. Some watches only record steps in walking mode.`} />
            : <Garis nilai={harian.map((d) => d.langkah)} warna="#a78bfa" format={(n) => (n / 1000).toFixed(1) + 'k'} />
        }
      />

      <KartuGrafik
        judul="Pace (higher is faster)"
        kanan={<span className="text-[10.5px] font-bold text-neutral-300">{tulisPace(pekanIni?.paceSec ?? null)}</span>}
        anak={
          cakup.pace.ada < MIN_SESI
            ? <Kosong pesan={`Only ${cakup.pace.ada} sessions have a pace. Pace is only computed for sessions that record both distance and time.`} />
            : <Garis nilai={harian.map((d) => d.paceSec)} warna="#34d399" balik format={(n) => tulisPace(n).replace('/km', '')} />
        }
      />

      <KartuGrafik
        judul="Average heart rate (bpm)"
        kanan={<Delta pct={bandingkan(pekanIni?.avgHr ?? null, pekanLalu?.avgHr ?? null).deltaPct} terbalik />}
        anak={
          cakup.denyut.ada < MIN_SESI
            ? <Kosong pesan={`Only ${cakup.denyut.ada} sessions have recorded a heart rate. Sessions logged by hand have none.`} />
            : <Garis nilai={harian.map((d) => d.avgHr)} warna="#f87171" format={(n) => Math.round(n) + '' } />
        }
      />

      <KartuGrafik
        judul="Cadence (steps/min)"
        kanan={<span className="text-[10.5px] text-neutral-500">{cakup.kadens.ada}/{cakup.kadens.total} sessions recording</span>}
        anak={
          cakup.kadens.ada < MIN_SESI
            ? <Kosong pesan={`Only ${cakup.kadens.ada} sessions have recorded cadence — not enough to draw as a trend. Cadence is usually only captured by a running watch or a foot pod.`} />
            : <Garis nilai={harian.map((d) => d.kadens)} warna="#fbbf24" format={(n) => Math.round(n) + ''} />
        }
      />

      <div className="rounded-2xl bg-white/5 p-3">
        <Judul
          teks="Heart-rate zones — 28 days"
          kanan={<span className="text-[10.5px] text-neutral-500">{zona.sesiDipakai} sessions used</span>}
        />
        {zona.sesiDipakai === 0 ? (
          <div className="mt-1.5">
            <Kosong pesan={`Zones can only be computed from sessions that record a heart-rate SERIES, and there has not been one in the last 28 days${zona.sesiDilewati ? ` (${zona.sesiDilewati} sessions skipped because they only carry an average heart rate)` : ''}.`} />
          </div>
        ) : (
          <>
            <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-white/5">
              {zona.zona.map((z) => (
                z.pct > 0 && <div key={z.z} style={{ width: `${z.pct}%`, background: z.warna }} title={`${z.nama} ${z.pct}%`} />
              ))}
            </div>
            <div className="mt-2 space-y-1">
              {zona.zona.map((z) => (
                <div key={z.z} className="flex items-center gap-2 text-[11px]">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: z.warna }} />
                  <span className="min-w-0 flex-1 truncate text-neutral-300">{z.nama}</span>
                  <span className="shrink-0 text-[10px] text-neutral-500">{z.batas}</span>
                  <span className="w-9 shrink-0 text-right font-bold text-white">{z.pct}%</span>
                  <span className="w-12 shrink-0 text-right text-neutral-500">{Math.round(z.menit)} m</span>
                </div>
              ))}
            </div>
            {/* Aturan 80/20 disebut sebagai rambu, bukan vonis — ia berasal dari
                atlet ketahanan terlatih, bukan dari orang yang berolahraga tiga
                kali sepekan untuk sehat. */}
            <p className="mt-2 text-[11px] leading-snug text-neutral-500">
              Most of the time should sit in Z1–Z2 ({zona.zona[0].pct + zona.zona[1].pct}% at
              present). Training too often in Z3 — too hard to recover from, too easy to improve the
              threshold — is the most common mistake. This is a guideline from endurance training,
              not a health rule.
            </p>
          </>
        )}
      </div>

      {zona.sesiDilewati > 0 && zona.sesiDipakai > 0 && (
        <p className="text-[10.5px] leading-snug text-neutral-500">
          {zona.sesiDilewati} sessions are excluded from the zone calculation because they only
          store an average heart rate. An average of 150 could come from a steady hour in Z3, or from
          alternating Z1 and Z5 — two completely different workouts, so placing it in one zone would
          draw a pattern that never happened.
        </p>
      )}
    </section>
  )
}

export default GrafikOlahraga
