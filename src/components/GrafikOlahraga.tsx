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
  if (pct === null) return <span className="text-[10.5px] text-neutral-500">belum ada pembanding</span>
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
  if (ada.length < 2) return <Kosong pesan="Belum cukup titik untuk digambar." />
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
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="grafik tren">
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
  if (!ada.length) return <Kosong pesan="Belum ada data untuk digambar." />
  const hi = Math.max(...ada) || 1
  const lebar = (W - L - R) / nilai.length
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="grafik mingguan">
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

export function GrafikOlahraga({
  workouts, hrMax, sekarang = Date.now(),
}: { workouts: ImportedWorkout[]; hrMax: number; sekarang?: number }) {
  const [rentang, setRentang] = useState<30 | 90>(30)

  const harian = useMemo(() => deretHarian(workouts, rentang, sekarang), [workouts, rentang, sekarang])
  const pekanan = useMemo(() => deretPekanan(workouts, 12, sekarang), [workouts, sekarang])
  const cakup = useMemo(() => cakupanBidang(workouts), [workouts])
  const zona = useMemo(() => zonaDenyut(workouts, hrMax, 28, sekarang), [workouts, hrMax, sekarang])

  const pekanIni = pekanan[pekanan.length - 1]
  const pekanLalu = pekanan[pekanan.length - 2]
  const labelPekan = pekanan.map((p) => p.awal.slice(5).replace('-', '/'))

  if (!workouts.length) {
    return <Kosong pesan="Belum ada sesi tercatat. Impor dari jam atau catat satu sesi, lalu grafiknya muncul di sini." />
  }

  const totalKm = harian.reduce((a, d) => a + (d.km ?? 0), 0)
  const totalLangkah = harian.reduce((a, d) => a + (d.langkah ?? 0), 0)
  const hariAktif = harian.filter((d) => d.sesi > 0).length

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-[15px] font-black text-white">Angka olahraga Anda</h3>
          <p className="text-[11px] text-neutral-500">
            {hariAktif} hari aktif dari {rentang} hari terakhir
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
          <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Jarak</div>
          <div className="mt-0.5 text-lg font-black text-white">
            {totalKm > 0 ? totalKm.toFixed(1) : '—'}
            <span className="ml-1 text-[11px] font-bold text-neutral-500">km</span>
          </div>
        </div>
        <div className="rounded-2xl bg-white/5 p-3">
          <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Langkah</div>
          <div className="mt-0.5 text-lg font-black text-white">
            {totalLangkah > 0 ? (totalLangkah / 1000).toFixed(1) + 'k' : '—'}
          </div>
        </div>
        <div className="rounded-2xl bg-white/5 p-3">
          <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Sesi</div>
          <div className="mt-0.5 text-lg font-black text-white">
            {harian.reduce((a, d) => a + d.sesi, 0)}
          </div>
        </div>
      </div>

      <KartuGrafik
        judul="Jarak per pekan (km)"
        kanan={<Delta pct={bandingkan(pekanIni?.km ?? null, pekanLalu?.km ?? null).deltaPct} />}
        anak={
          cakup.jarak.ada === 0
            ? <Kosong pesan="Tidak ada satu pun sesi yang merekam jarak. Grafik ini muncul setelah ada sesi berjarak (lari, jalan, sepeda)." />
            : <Batang nilai={pekanan.map((p) => p.km)} label={labelPekan} warna="#60a5fa" format={(n) => n.toFixed(0) + ' km'} />
        }
      />

      <KartuGrafik
        judul="Langkah harian"
        kanan={<span className="text-[10.5px] text-neutral-500">{cakup.langkah.ada}/{cakup.langkah.total} sesi merekam</span>}
        anak={
          cakup.langkah.ada < MIN_SESI
            ? <Kosong pesan={`Baru ${cakup.langkah.ada} sesi yang merekam langkah — belum cukup untuk disebut tren. Sebagian jam hanya mencatat langkah pada mode berjalan.`} />
            : <Garis nilai={harian.map((d) => d.langkah)} warna="#a78bfa" format={(n) => (n / 1000).toFixed(1) + 'k'} />
        }
      />

      <KartuGrafik
        judul="Pace (makin ke atas makin cepat)"
        kanan={<span className="text-[10.5px] font-bold text-neutral-300">{tulisPace(pekanIni?.paceSec ?? null)}</span>}
        anak={
          cakup.pace.ada < MIN_SESI
            ? <Kosong pesan={`Baru ${cakup.pace.ada} sesi yang punya pace. Pace hanya terhitung pada sesi yang merekam jarak dan waktu.`} />
            : <Garis nilai={harian.map((d) => d.paceSec)} warna="#34d399" balik format={(n) => tulisPace(n).replace('/km', '')} />
        }
      />

      <KartuGrafik
        judul="Denyut rata-rata (bpm)"
        kanan={<Delta pct={bandingkan(pekanIni?.avgHr ?? null, pekanLalu?.avgHr ?? null).deltaPct} terbalik />}
        anak={
          cakup.denyut.ada < MIN_SESI
            ? <Kosong pesan={`Baru ${cakup.denyut.ada} sesi yang merekam denyut. Sesi yang dicatat tangan tidak punya denyut.`} />
            : <Garis nilai={harian.map((d) => d.avgHr)} warna="#f87171" format={(n) => Math.round(n) + '' } />
        }
      />

      <KartuGrafik
        judul="Kadens (langkah/menit)"
        kanan={<span className="text-[10.5px] text-neutral-500">{cakup.kadens.ada}/{cakup.kadens.total} sesi merekam</span>}
        anak={
          cakup.kadens.ada < MIN_SESI
            ? <Kosong pesan={`Baru ${cakup.kadens.ada} sesi yang merekam kadens — belum cukup untuk digambar sebagai tren. Kadens umumnya hanya terekam oleh jam lari atau sensor kaki.`} />
            : <Garis nilai={harian.map((d) => d.kadens)} warna="#fbbf24" format={(n) => Math.round(n) + ''} />
        }
      />

      <div className="rounded-2xl bg-white/5 p-3">
        <Judul
          teks="Zona denyut — 28 hari"
          kanan={<span className="text-[10.5px] text-neutral-500">{zona.sesiDipakai} sesi dipakai</span>}
        />
        {zona.sesiDipakai === 0 ? (
          <div className="mt-1.5">
            <Kosong pesan={`Zona hanya dapat dihitung dari sesi yang merekam DERET denyut, dan belum ada satu pun dalam 28 hari terakhir${zona.sesiDilewati ? ` (${zona.sesiDilewati} sesi dilewati karena hanya punya denyut rata-rata)` : ''}.`} />
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
              Sebagian besar waktu sebaiknya di Z1-Z2 ({zona.zona[0].pct + zona.zona[1].pct}% saat
              ini). Berlatih terlalu sering di Z3 — terlalu berat untuk pemulihan, terlalu ringan
              untuk memperbaiki ambang — adalah kesalahan yang paling lazim. Ini rambu dari latihan
              ketahanan, bukan aturan kesehatan.
            </p>
          </>
        )}
      </div>

      {zona.sesiDilewati > 0 && zona.sesiDipakai > 0 && (
        <p className="text-[10.5px] leading-snug text-neutral-500">
          {zona.sesiDilewati} sesi tidak ikut dihitung zonanya karena hanya menyimpan denyut
          rata-rata. Rata-rata 150 bisa berasal dari satu jam mantap di Z3, bisa juga dari
          selang-seling Z1 dan Z5 — dua latihan yang sama sekali berbeda, jadi menempatkannya di
          satu zona akan menggambar kebiasaan yang tidak pernah terjadi.
        </p>
      )}
    </section>
  )
}

export default GrafikOlahraga
