import { useCallback, useEffect, useMemo, useState } from 'react'
import { Prosa } from '../components/Prosa'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts'
import { Card, SectionTitle } from '../components/ui'
import { IconHeart, IconActivity, IconTimer } from '../components/icons'
import { api, backendEnabled, type HrSample } from '../lib/api'
import { getDemo } from '../lib/profile'
import { hrMaxFromAge } from '../lib/workoutImport'

// ─────────────────────────────────────────────────────────────────────────────
// Heart Rate Log — setiap sampel yang dikirim jam tangan, bukan hanya nilai
// terakhirnya.
//
// Halaman ini sengaja TIDAK menyebut dirinya monitor real time, karena data
// yang ada memang tidak bisa mendukung sebutan itu. Batas nyatanya dijelaskan
// terbuka di kartu paling atas, supaya harapan pengguna sesuai dengan yang
// benar-benar mampu diberikan Apple Watch.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tiga setelan yang benar-benar menentukan kerapatan data, diurutkan dari yang
 * paling besar pengaruhnya. Ditulis di sini karena tanpa ini seseorang bisa
 * menyinkronkan bertahun-tahun dan tetap hanya mendapat satu angka per jam.
 */
const SETELAN: { nama: string; setKe: string; kenapa: string }[] = [
  {
    nama: 'Include Workouts',
    setKe: 'NYALAKAN',
    kenapa:
      'Ini yang paling menentukan dan paling sering tertinggal mati. Deret detak jantung saat latihan JAUH lebih rapat daripada catatan harian — inilah satu-satunya data yang mendekati berkesinambungan. Bila mati, seluruh sesi lari Anda tidak pernah terkirim sama sekali meskipun metrik hariannya terkirim lengkap.',
  },
  {
    nama: 'Aggregate Data',
    setKe: 'MATIKAN',
    kenapa:
      'Bila menyala, aplikasi meringkas sampel menjadi satu baris Min/Rata-rata/Maks per satuan waktu — hasilnya satu titik per menit meskipun jam tangan merekam jauh lebih rapat. Dimatikan, yang terkirim adalah sampel mentah, sekitar tiap 5 detik saat latihan. Ini perbedaan antara 60 detik dan 5 detik per titik.',
  },
  {
    nama: 'Automation interval',
    setKe: '5 menit',
    kenapa:
      'Menentukan seberapa lama data tertahan di telepon sebelum terkirim, bukan kerapatan sampelnya. Menurunkannya dari 15 menit ke 5 menit membuat log tertinggal beberapa menit saja, bukan seperempat jam. Lebih rendah dari itu tidak menambah apa pun karena Apple Health sendiri tidak menulis secepat itu.',
  },
]

const RENTANG = [
  { key: '3j', label: '3 jam', ms: 3 * 3600_000 },
  { key: '12j', label: '12 jam', ms: 12 * 3600_000 },
  { key: '24j', label: '24 jam', ms: 24 * 3600_000 },
  { key: '7h', label: '7 hari', ms: 7 * 24 * 3600_000 },
] as const

const KIND_LABEL: Record<HrSample['kind'], string> = {
  workout: 'Saat latihan',
  heart_rate: 'Harian',
  resting: 'Istirahat',
  walking_avg: 'Rata-rata berjalan',
}

export function HeartRateLog() {
  const [samples, setSamples] = useState<HrSample[]>([])
  const [rentang, setRentang] = useState<(typeof RENTANG)[number]['key']>('24j')
  const [memuat, setMemuat] = useState(true)
  const [gagal, setGagal] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [terakhirCek, setTerakhirCek] = useState<number | null>(null)

  const demo = useMemo(() => getDemo(), [])
  const hrMax = useMemo(() => {
    const teramati = samples.reduce((a, s) => Math.max(a, s.bpm), 0)
    return Math.max(teramati, hrMaxFromAge(demo.age || 30, demo.sex))
  }, [samples, demo])

  const ms = RENTANG.find((r) => r.key === rentang)!.ms

  const load = useCallback(() => {
    setMemuat(true)
    api.hrSeries(Date.now() - ms)
      .then((r) => { setSamples(r.samples); setGagal(false); setTerakhirCek(Date.now()) })
      .catch(() => setGagal(true))
      .finally(() => setMemuat(false))
  }, [ms])

  useEffect(() => {
    if (!backendEnabled) { setMemuat(false); return }
    load()
  }, [load])

  useEffect(() => {
    if (!backendEnabled || !autoRefresh) return
    // 60 s: the phone's automation pushes on a minutes-scale interval, so
    // polling faster only burns battery and data for no new readings.
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [autoRefresh, load])

  const chart = useMemo(
    () => samples.map((s) => ({ t: s.t, bpm: s.bpm, kind: s.kind })),
    [samples],
  )

  const ringkas = useMemo(() => {
    if (!samples.length) return null
    const bpms = samples.map((s) => s.bpm)
    const terbaru = samples[samples.length - 1]
    // Median is steadier than the mean here: one workout burst would drag a
    // mean upward and make a quiet day look busy.
    const urut = [...bpms].sort((a, b) => a - b)
    const median = urut[Math.floor(urut.length / 2)]
    return {
      min: Math.min(...bpms),
      max: Math.max(...bpms),
      median,
      terbaru: terbaru.bpm,
      terbaruAt: terbaru.t,
      jumlah: samples.length,
      // Rata-rata jarak antar sampel: menjawab langsung "seberapa rapat datanya".
      rapatDetik: samples.length > 1
        ? Math.round((samples[samples.length - 1].t - samples[0].t) / 1000 / (samples.length - 1))
        : undefined,
    }
  }, [samples])

  if (!backendEnabled) {
    return (
      <div className="space-y-4">
        <SectionTitle icon={<IconHeart />} title="Heart Rate Log" />
        <Card>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Log ini diisi oleh server melalui sinkronisasi otomatis, dan saat ini aplikasi berjalan
            tanpa server. History latihan yang Anda unggah sendiri tetap bisa dilihat di{' '}
            <Link to="/riwayat-latihan" className="font-semibold text-ink underline">History Latihan</Link>.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <SectionTitle
        icon={<IconHeart />}
        title="Heart Rate Log"
        subtitle="Every sample your watch sends, not just the latest value"
      />

      <Card>
        <SectionTitle icon={<IconTimer />} title="How close this is to real time" />
        <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
          Jujur di depan supaya harapannya tepat: <strong className="text-ink">detak jantung per detik
          tidak tersedia</strong>, dan itu bukan batasan Panaceamed melainkan batasan datanya sendiri.
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-neutral-500">
          <li className="flex gap-2"><span className="text-slate-600">•</span><span>
            Apple Watch <strong className="text-ink">tidak mencatat denyut tiap detik</strong>. Saat latihan
            ia mengambil sampel sekitar tiap 5 detik; saat istirahat hanya beberapa menit sekali dan tidak teratur.
            Data per detik memang tidak pernah ada di Apple Health, sehingga tidak ada aplikasi mana pun yang bisa mengirimkannya.
          </span></li>
          <li className="flex gap-2"><span className="text-slate-600">•</span><span>
            Otomatisasi Health Auto Export berjalan pada selang <strong className="text-ink">menit</strong>, bukan detik.
            Paling cepat yang bisa dicapai adalah beberapa menit di belakang waktu nyata.
          </span></li>
        </ul>
        <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
          Jadi yang benar-benar bisa diberikan adalah <strong className="text-ink">seluruh sampel yang memang
          direkam Apple Health, tertunda beberapa menit</strong> — sebuah catatan, bukan monitor. Untuk denyut yang
          benar-benar hidup per detik, satu-satunya jalan adalah strap dada Bluetooth, dan browser di iPhone
          tidak mendukungnya sama sekali.
        </p>
      </Card>

      <Card>
        <SectionTitle
          icon={<IconActivity />}
          title="Three settings that decide data density"
          subtitle="This is what actually changes the result — not how often you open this page"
        />
        <div className="mt-2 space-y-2">
          {SETELAN.map((x) => (
            <div key={x.nama} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-ink">{x.nama}</span>
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                  {x.setKe}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-neutral-500">{x.kenapa}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
          Ketiganya ada di Health Auto Export, pada layar pengaturan ekspor otomatis yang sama tempat
          Anda menempelkan tautan sinkronisasi. Panduan lengkapnya di{' '}
          <Link to="/health-data/tutorial" className="font-semibold text-neutral-600 underline">panduan sinkronisasi</Link>.
        </p>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          {RENTANG.map((r) => (
            <button
              key={r.key}
              onClick={() => setRentang(r.key)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                rentang === r.key ? 'border-white/30 bg-white/10 text-white' : 'border-white/10 text-neutral-500'
              }`}
            >
              {r.label}
            </button>
          ))}
          <span className="flex-1" />
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
              autoRefresh ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-white/10 text-neutral-500'
            }`}
          >
            {autoRefresh ? '● Menyegarkan tiap menit' : '○ Segarkan manual'}
          </button>
          <button onClick={load} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-neutral-500">
            Muat ulang
          </button>
        </div>
        {terakhirCek && (
          <p className="mt-2 text-[11px] text-slate-500">
            Terakhir diperiksa {new Date(terakhirCek).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            {memuat && ' · memuat…'}
          </p>
        )}
      </Card>

      {gagal ? (
        <Card>
          <p className="text-sm text-neutral-500">Tidak bisa memuat log. Periksa sambungan internet Anda.</p>
          <button onClick={load} className="mt-3 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white">Coba lagi</button>
        </Card>
      ) : !samples.length ? (
        <Card>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Belum ada sampel pada rentang ini.
          </p>
          <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
            Log terisi otomatis begitu otomatisasi Health Auto Export mengirim data ke tautan sinkronisasi Anda.
            Bila belum pernah terisi sama sekali, periksa dahulu bahwa URL webhook di aplikasi itu benar dan
            <strong className="text-ink"> tidak tertulis dua kali</strong> — kesalahan tempel yang membuat
            server tidak pernah menerima apa pun.
          </p>
          <Link to="/health-data" className="mt-3 inline-block rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white">
            Buka pengaturan sinkronisasi →
          </Link>
        </Card>
      ) : (
        <>
          <Card>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Terbaru" value={`${ringkas!.terbaru}`} sub={waktuLalu(ringkas!.terbaruAt)} />
              <Stat label="Terendah" value={`${ringkas!.min}`} sub="bpm" />
              <Stat label="Tengah" value={`${ringkas!.median}`} sub="bpm" />
              <Stat label="Tertinggi" value={`${ringkas!.max}`} sub="bpm" />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
              {ringkas!.jumlah} sampel
              {ringkas!.rapatDetik != null && ` · rata-rata satu sampel tiap ${fmtSelang(ringkas!.rapatDetik)}`}.
              Kerapatan inilah gambaran sesungguhnya seberapa sering jam tangan Anda merekam — jauh lebih rapat
              saat latihan, jarang saat diam.
            </p>
          </Card>

          <Card>
            <SectionTitle icon={<IconActivity />} title="Grafik" subtitle="Pita warna menandai zona terhadap HRmax" />
            <div className="mt-2" style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <AreaChart data={chart} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
                  <defs>
                    <linearGradient id="hrFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  {/* Pita 60/70/80/90% HRmaks mengikuti ACSM Guidelines
                      (Garber dkk., 2011, Med Sci Sports Exerc 43(7):1334-59). */}
                  <ReferenceArea y1={hrMax * 0.6} y2={hrMax * 0.7} fill="#34d399" fillOpacity={0.07} />
                  <ReferenceArea y1={hrMax * 0.8} y2={hrMax * 0.9} fill="#fbbf24" fillOpacity={0.07} />
                  <ReferenceArea y1={hrMax * 0.9} y2={hrMax} fill="#f87171" fillOpacity={0.09} />
                  <XAxis
                    dataKey="t" type="number" domain={['dataMin', 'dataMax']}
                    tickFormatter={(v) => new Date(v).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} minTickGap={40}
                  />
                  <YAxis domain={['dataMin - 6', 'dataMax + 6']} tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} width={34} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 11 }}
                    labelFormatter={(v) => new Date(Number(v)).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    formatter={(v) => [`${v} bpm`, 'Denyut']}
                  />
                  <Area type="monotone" dataKey="bpm" stroke="#f43f5e" strokeWidth={1.6} fill="url(#hrFill)" dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <SectionTitle title="Sampel terbaru" subtitle="200 terakhir, terbaru di atas" />
            <div className="mt-2 max-h-96 overflow-y-auto">
              {[...samples].reverse().slice(0, 200).map((s, i) => (
                <div key={`${s.t}-${s.kind}-${i}`} className="flex items-center gap-2 border-b border-white/5 py-1.5 text-xs last:border-0">
                  <span className="w-28 shrink-0 text-slate-500 tabular-nums">
                    {new Date(s.t).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="w-14 shrink-0 font-semibold text-ink tabular-nums">{s.bpm} bpm</span>
                  {s.lo != null && s.hi != null && (
                    <span className="w-20 shrink-0 text-slate-500 tabular-nums">{s.lo}–{s.hi}</span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-right text-slate-500">{KIND_LABEL[s.kind] ?? s.kind}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      <Card>
        <Prosa kelas="text-xs leading-relaxed text-slate-500">Sampel yang sama dikirim berulang kali oleh otomatisasi disaring berdasarkan waktunya, jadi menjalankan sinkronisasi lebih sering tidak menggandakan data. Log dibatasi supaya tidak tumbuh tanpa batas; yang tersimpan adalah bagian terbaru.</Prosa>
      </Card>
    </div>
  )
}

function waktuLalu(t: number): string {
  const m = Math.floor((Date.now() - t) / 60000)
  if (m < 1) return 'baru saja'
  if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60)
  return h < 24 ? `${h} jam lalu` : `${Math.floor(h / 24)} hari lalu`
}

function fmtSelang(detik: number): string {
  if (detik < 60) return `${detik} detik`
  const m = Math.round(detik / 60)
  return m < 60 ? `${m} menit` : `${(m / 60).toFixed(1)} jam`
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-center">
      <div className="text-lg font-semibold text-ink tabular-nums">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  )
}

export default HeartRateLog
