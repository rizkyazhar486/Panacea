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
    setKe: 'ON',
    kenapa:
      'This matters most and is the one most often left off. The heart-rate trace during a workout is FAR denser than the daily record — it is the only data that comes close to continuous. With it off, none of your runs are ever sent at all, even though the daily metrics arrive in full.',
  },
  {
    nama: 'Aggregate Data',
    setKe: 'OFF',
    kenapa:
      'With this on, the app collapses samples into one Min/Average/Max row per time unit — giving one point per minute even though the watch records far more densely. With it off, raw samples are sent, roughly every 5 seconds during a workout. This is the difference between 60 seconds and 5 seconds per point.',
  },
  {
    nama: 'Automation interval',
    setKe: '5 minutes',
    kenapa:
      'This sets how long data waits on the phone before being sent, not how densely it is sampled. Dropping it from 15 minutes to 5 leaves the log a few minutes behind rather than a quarter of an hour. Going lower adds nothing, because Apple Health itself does not write that fast.',
  },
]

const RENTANG = [
  { key: '3j', label: '3 hours', ms: 3 * 3600_000 },
  { key: '12j', label: '12 hours', ms: 12 * 3600_000 },
  { key: '24j', label: '24 hours', ms: 24 * 3600_000 },
  { key: '7h', label: '7 days', ms: 7 * 24 * 3600_000 },
] as const

const KIND_LABEL: Record<HrSample['kind'], string> = {
  workout: 'During workout',
  heart_rate: 'Daily',
  resting: 'Resting',
  walking_avg: 'Walking average',
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
            This log is filled in by the server through automatic sync, and the app is currently running
            without one. Training sessions you uploaded yourself are still visible in{' '}
            <Link to="/riwayat-latihan" className="font-semibold text-ink underline">Training History</Link>.
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
        <SectionTitle icon={<IconTimer />} title="How close to real time this is" />
        <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
          Said plainly up front so expectations are right: <strong className="text-ink">second-by-second
          heart rate is not available</strong>, and that is not a Panaceamed limitation but a limitation of
          the data itself.
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-neutral-500">
          <li className="flex gap-2"><span className="text-slate-600">•</span><span>
            Apple Watch <strong className="text-ink">does not record a beat every second</strong>. During a
            workout it samples roughly every 5 seconds; at rest, only every few minutes and irregularly.
            Per-second data never exists in Apple Health, so no app can send it.
          </span></li>
          <li className="flex gap-2"><span className="text-slate-600">•</span><span>
            Health Auto Export automations run on <strong className="text-ink">minute</strong> intervals, not
            seconds. The best achievable is a few minutes behind real time.
          </span></li>
        </ul>
        <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
          So what can honestly be offered is <strong className="text-ink">every sample Apple Health actually
          recorded, a few minutes delayed</strong> — a log, not a monitor. For genuinely live per-second heart
          rate the only route is a Bluetooth chest strap, and iPhone browsers do not support them at all.
        </p>
      </Card>

      <Card>
        <SectionTitle
          icon={<IconActivity />}
          title="The three settings that decide data density"
          subtitle="These are what actually change the result — not how often you open this page"
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
          All three live in Health Auto Export, on the same automatic-export settings screen where you
          pasted your sync link. The full walkthrough is in the{' '}
          <Link to="/health-data/tutorial" className="font-semibold text-neutral-600 underline">sync guide</Link>.
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
            {autoRefresh ? '● Refreshing every minute' : '○ Manual refresh'}
          </button>
          <button onClick={load} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-neutral-500">
            Reload
          </button>
        </div>
        {terakhirCek && (
          <p className="mt-2 text-[11px] text-slate-500">
            Last checked {new Date(terakhirCek).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            {memuat && ' · loading…'}
          </p>
        )}
      </Card>

      {gagal ? (
        <Card>
          <p className="text-sm text-neutral-500">Could not load the log. Check your internet connection.</p>
          <button onClick={load} className="mt-3 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white">Try again</button>
        </Card>
      ) : !samples.length ? (
        <Card>
          <p className="text-sm text-neutral-600 leading-relaxed">
            No samples in this range yet.
          </p>
          <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
            The log fills in automatically as soon as a Health Auto Export automation sends data to your sync
            link. If it has never filled at all, first check that the webhook URL in that app is correct and
            <strong className="text-ink"> not pasted twice</strong> — a paste error that leaves the server
            receiving nothing.
          </p>
          <Link to="/health-data" className="mt-3 inline-block rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white">
            Open sync settings →
          </Link>
        </Card>
      ) : (
        <>
          <Card>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Latest" value={`${ringkas!.terbaru}`} sub={waktuLalu(ringkas!.terbaruAt)} />
              <Stat label="Lowest" value={`${ringkas!.min}`} sub="bpm" />
              <Stat label="Median" value={`${ringkas!.median}`} sub="bpm" />
              <Stat label="Highest" value={`${ringkas!.max}`} sub="bpm" />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
              {ringkas!.jumlah} sampel
              {ringkas!.rapatDetik != null && ` · rata-rata satu sampel tiap ${fmtSelang(ringkas!.rapatDetik)}`}.
              Kerapatan inilah gambaran sesungguhnya seberapa sering jam tangan Anda merekam — jauh lebih rapat
              saat latihan, jarang saat diam.
            </p>
          </Card>

          <Card>
            <SectionTitle icon={<IconActivity />} title="Chart" subtitle="Colour bands mark zones relative to HRmax" />
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
                    formatter={(v) => [`${v} bpm`, 'Heart rate']}
                  />
                  <Area type="monotone" dataKey="bpm" stroke="#f43f5e" strokeWidth={1.6} fill="url(#hrFill)" dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <SectionTitle title="Latest samples" subtitle="Last 200, newest first" />
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
        <Prosa kelas="text-xs leading-relaxed text-slate-500">Identical samples sent repeatedly by the automation are de-duplicated by timestamp, so syncing more often does not double up the data. The log is capped so it cannot grow without limit; what is kept is the most recent stretch.</Prosa>
      </Card>
    </div>
  )
}

function waktuLalu(t: number): string {
  const m = Math.floor((Date.now() - t) / 60000)
  if (m < 1) return 'baru saja'
  if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60)
  return h < 24 ? `${h} jam lalu` : `${Math.floor(h / 24)} days ago`
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
