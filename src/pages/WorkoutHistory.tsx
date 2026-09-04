import { useEffect, useMemo, useRef, useState } from 'react'
import { Prosa } from '../components/Prosa'
import { Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts'
import { Card, SectionTitle } from '../components/ui'
import { ShareCardButton } from '../components/ShareCardButton'
import { IconRun, IconHeart, IconActivity, IconTimer } from '../components/icons'
import { getWorkouts, getHrNotifications, clearWorkouts, mergeWorkouts, mergeHrNotifications } from '../lib/workoutStore'
import {
  zoneBreakdown, hrMaxFromAge, summarise, fmtDurasi, fmtPace, NOTIF_INFO, parseWorkouts, parseHrNotifications,
  type ImportedWorkout,
} from '../lib/workoutImport'
import { api, backendEnabled } from '../lib/api'
import { KolomPelatih } from '../components/KolomPelatih'
import { usahaTerbaik, kemajuanTarget, type Target, type JenisTarget, type PeriodeTarget } from '../lib/analisisPro'
import { getDemo } from '../lib/profile'
import { useVitals } from '../lib/useVitals'
import { GrafikOlahraga } from '../components/GrafikOlahraga'

// ─────────────────────────────────────────────────────────────────────────────
// History Latihan — sesi nyata beserta deret detak jantung per menit.
//
// Bagian ekspor Apple Health yang paling berharga dan paling lama terbuang:
// larik `workouts`. Setiap sesi membawa detak jantung per menit, sehingga
// pertanyaan "seberapa keras sesi itu sebenarnya" dapat dijawab dengan sebaran
// waktu per zona — sesuatu yang tidak mungkin dihitung dari satu angka
// rata-rata.
// ─────────────────────────────────────────────────────────────────────────────

export function WorkoutHistory() {
  const vitals = useVitals()
  const demo = useMemo(() => getDemo(), [])
  // Membaca ulang tiap kali store menyiarkan perubahan (vitals ikut berubah).
  const [buka, setBuka] = useState<string | null>(null)
  const [tarikan, setTarikan] = useState(0)
  const workouts = useMemo(() => getWorkouts(), [vitals, tarikan])
  const notifs = useMemo(() => getHrNotifications(), [vitals, tarikan])

  // Sessions pushed by the device live on the server; this screen used to read
  // localStorage only, so a correctly-configured Workouts automation still
  // showed nothing here. Parsed with the SAME parser as a manual upload — the
  // server deliberately keeps the exporter's own shape so there is only one
  // implementation to keep correct.
  useEffect(() => {
    if (!backendEnabled) return
    let hidup = true
    Promise.all([
      api.deviceWorkouts().catch(() => ({ workouts: [] as Record<string, unknown>[] })),
      api.deviceHrNotifications().catch(() => ({ notifications: [] as Record<string, unknown>[] })),
    ])
      .then(([w, n]) => {
        if (!hidup) return
        let baru = 0
        if (w.workouts.length) baru += mergeWorkouts(parseWorkouts(JSON.stringify({ data: { workouts: w.workouts } })))
        if (n.notifications.length) baru += mergeHrNotifications(parseHrNotifications(JSON.stringify({ data: { heartRateNotifications: n.notifications } })))
        if (baru) setTarikan((n2) => n2 + 1)
      })
      .catch(() => { /* offline: yang tersimpan lokal tetap tampil */ })
    return () => { hidup = false }
  }, [])

  const hrMax = useMemo(() => {
    const teramati = workouts.reduce((a, w) => Math.max(a, w.maxHr ?? 0), 0)
    const perkiraan = hrMaxFromAge(demo.age || 30, demo.sex)
    // Denyut tertinggi yang PERNAH TERCATAT lebih dapat dipercaya daripada
    // rumus 220−usia, yang meleset belasan denyut pada banyak orang.
    return Math.max(teramati, perkiraan)
  }, [workouts, demo])

  const ringkas = useMemo(() => summarise(workouts, hrMax), [workouts, hrMax])

  const konteks = useMemo(
    () => ({ hrMax, hrRest: demo.restingHr && demo.restingHr > 0 ? demo.restingHr : 60, sex: demo.sex }),
    [hrMax, demo],
  )
  const pr = useMemo(() => usahaTerbaik(workouts), [workouts])
  const [target, setTarget] = useState<Target>(() => {
    try { const r = localStorage.getItem('pmd-target-latihan'); if (r) return JSON.parse(r) } catch { /* abaikan */ }
    return { jenis: 'jarak', periode: 'pekan', nilai: 20 }
  })
  useEffect(() => {
    try { localStorage.setItem('pmd-target-latihan', JSON.stringify(target)) } catch { /* kuota */ }
  }, [target])
  const kemajuan = useMemo(() => kemajuanTarget(workouts, target), [workouts, target])

  if (!workouts.length) {
    return (
      <div className="space-y-4">
        <SectionTitle icon={<IconRun />} title="Training History" subtitle="Real sessions, with beat-by-beat heart rate" />
        <Card>
          <p className="text-sm text-neutral-600 leading-relaxed">
            No sessions stored yet. Upload a Health Auto Export file on{' '}
            <Link to="/health-data" className="font-semibold text-ink underline">Health Data</Link> —
            the same file that fills in your health numbers also carries every training session,
            complete with its beat-by-beat heart-rate trace.
          </p>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            You do not have to upload by hand: sessions also arrive through automatic sync, as long as
            Health Auto Export has an automation with <strong className="text-neutral-600">Data Type: Workouts</strong>
            {' '}(or <strong className="text-neutral-600">Include Workouts</strong> switched on) and
            {' '}<strong className="text-neutral-600">Date Range: Today</strong>. If either is wrong, the
            workout array is left out even though the metrics arrive in full.
          </p>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            <Link to="/health-data/tutorial" className="font-semibold text-ink underline">Sync diagnostics</Link>
            {' '}inspects what actually arrived and names which setting is wrong.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <SectionTitle icon={<IconRun />} title="Training History" subtitle={`${workouts.length} sessions stored · HRmax used ${hrMax} bpm`} />

      {/* Kolom pelatih ditaruh paling atas: pertanyaan yang dibawa orang saat
          membuka halaman ini adalah "berikutnya apa", bukan "berapa totalnya". */}
      <KolomPelatih workouts={workouts} konteks={konteks} />

      {/* Angka sehari-hari ditaruh tepat setelah kolom pelatih dan SEBELUM
          daftar sesi. Yang dibawa orang saat membuka halaman ini setelah
          "berikutnya apa" adalah "bagaimana perkembangan saya" — dan itu
          dijawab oleh bentuk grafiknya, bukan oleh daftar sesi satu per satu.
          Daftar sesi menjawab pertanyaan yang berbeda: "sesi Selasa itu
          bagaimana", dan itu datang belakangan. */}
      <Card>
        <GrafikOlahraga workouts={workouts} hrMax={hrMax} />
      </Card>

      {/* Target — dibuat bisa diatur langsung di sini agar perencanaan tidak
          perlu berpindah halaman. */}
      <Card>
        <SectionTitle icon={<IconTimer />} title="Target" subtitle="For planning the next block" />
        <div className="mt-3 flex flex-wrap gap-2">
          <select value={target.jenis} onChange={(e) => setTarget({ ...target, jenis: e.target.value as JenisTarget })}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white">
            <option value="jarak" className="bg-slate-900">Distance</option>
            <option value="waktu" className="bg-slate-900">Time</option>
            <option value="sesi" className="bg-slate-900">Session count</option>
          </select>
          <select value={target.periode} onChange={(e) => setTarget({ ...target, periode: e.target.value as PeriodeTarget })}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white">
            <option value="pekan" className="bg-slate-900">Per week</option>
            <option value="bulan" className="bg-slate-900">Per month</option>
            <option value="tahun" className="bg-slate-900">Per year</option>
          </select>
          <input type="number" min={1} value={target.nilai}
            onChange={(e) => setTarget({ ...target, nilai: Math.max(0, Number(e.target.value) || 0) })}
            className="w-24 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white" />
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-black text-ink">
            {kemajuan.tercapai} <span className="text-sm font-bold text-neutral-500">/ {kemajuan.sasaran} {kemajuan.satuan}</span>
          </span>
          <span className={`text-sm font-bold ${kemajuan.diJalur ? 'text-emerald-700' : 'text-amber-700'}`}>{kemajuan.pct}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full" style={{ width: `${kemajuan.pct}%`, background: kemajuan.diJalur ? '#22c55e' : '#f59e0b' }} />
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">
          {kemajuan.pct >= 100
            ? 'Target for this period is already met.'
            : `${kemajuan.sisaHari} days left — about ${kemajuan.perluPerHari} ${kemajuan.satuan} a day from here.`}
        </p>
      </Card>

      {pr.length > 0 && (
        <Card>
          <SectionTitle icon={<IconRun />} title="Best Efforts" subtitle="Fastest time per distance" />
          <div className="mt-3 space-y-1.5">
            {pr.map((p) => (
              <div key={p.label} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2">
                <div>
                  <div className="text-[13px] font-bold text-ink">{p.label}</div>
                  <div className="text-[10px] text-slate-500">
                    {new Date(p.tanggal).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {p.diskalakan && ' · scaled'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[15px] font-black tabular-nums text-ink">{fmtDurasi(p.detik)}</div>
                  <div className="text-[10px] text-neutral-500">{fmtPace(p.paceSec)}/km</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle icon={<IconTimer />} title="Summary" />
        <div className="grid grid-cols-2 gap-2 mt-2 sm:grid-cols-4">
          <Stat label="Sessions" value={String(ringkas.sesi)} />
          <Stat label="Total time" value={fmtDurasi(ringkas.totalMenit * 60)} />
          <Stat label="Total distance" value={`${ringkas.totalKm} km`} />
          <Stat label="Total calories" value={`${ringkas.totalKcal}`} />
        </div>

        {ringkas.pctMudah != null && (
          <div className="mt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm text-neutral-500">Time in the easy zones (1-2)</span>
              <span className={`text-lg font-semibold ${ringkas.pctMudah >= 70 ? 'text-emerald-300' : 'text-amber-300'}`}>
                {ringkas.pctMudah}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden mt-2">
              <div
                className={`h-full rounded-full ${ringkas.pctMudah >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(100, ringkas.pctMudah)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>target around 80%</span>
              <span>100%</span>
            </div>
            <p className="text-sm text-neutral-500 mt-3 leading-relaxed">
              {ringkas.pctMudah >= 70
                ? 'This spread is healthy: most of your time is spent at an intensity that builds the aerobic base, which is what lets the few hard sessions actually be hard.'
                : 'Most of your running time sits above the easy zones. This pattern feels productive but is the most common reason progress stalls: too hard to recover from, too easy to trigger speed adaptation. The fix is not more training — it is running most sessions SLOWER.'}
              {' '}The full framework is in{' '}
              <Link to="/latihan-dasar" className="font-semibold text-ink underline">Foundation Training</Link>.
            </p>
          </div>
        )}
      </Card>

      {notifs.length > 0 && <NotifCard />}

      <Card>
        <SectionTitle icon={<IconActivity />} title="Sessions" subtitle="Tap a session to see its heart-rate curve and zone breakdown" />
        <div className="space-y-2 mt-2">
          {workouts.map((w) => (
            <WorkoutRow key={w.id} w={w} hrMax={hrMax} terbuka={buka === w.id} onToggle={() => setBuka(buka === w.id ? null : w.id)} />
          ))}
        </div>
      </Card>

      <Card>
        <Prosa kelas="text-xs text-slate-500 leading-relaxed">Data is stored on this device only. Importing a new file adds sessions rather than replacing them, so older history stays intact even if you only export the last seven days.</Prosa>
        <button
          onClick={() => { if (confirm('Delete all training history stored on this device?')) clearWorkouts() }}
          className="mt-3 flex h-10 items-center rounded-lg border border-white/10 px-3 text-xs font-semibold text-neutral-500"
        >
          Delete stored history
        </button>
      </Card>
    </div>
  )
}

function NotifCard() {
  const vitals = useVitals()
  const notifs = useMemo(() => getHrNotifications(), [vitals])
  return (
    <Card>
      <SectionTitle icon={<IconHeart />} title="Heart rate alerts" subtitle={`${notifs.length} events recorded by the watch`} />
      <div className="space-y-2 mt-2">
        {notifs.map((n, i) => {
          const info = NOTIF_INFO[n.jenis]
          return (
            <div key={i} className="rounded-lg border border-amber-500/25 bg-amber-500/[0.07] p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold text-ink text-sm">{n.label}</span>
                <span className="text-sm text-amber-200 tabular-nums">
                  {n.puncakBpm ? `peak ${n.puncakBpm} bpm` : ''}{n.ambang ? ` · threshold ${n.ambang}` : ''}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {n.mulai ? new Date(n.mulai).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
              </div>
              <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed">{info.arti}</p>
              <p className="text-sm text-rose-200/90 mt-1.5 leading-relaxed">
                <span className="text-rose-600/80">When this matters: </span>{info.kapanPenting}
              </p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function WorkoutRow({ w, hrMax, terbuka, onToggle }: { w: ImportedWorkout; hrMax: number; terbuka: boolean; onToggle: () => void }) {
  const zones = useMemo(() => (terbuka ? zoneBreakdown(w.hr, hrMax) : []), [terbuka, w.hr, hrMax])
  const chart = useMemo(() => w.hr.map((p) => ({ menit: +(p.t / 60).toFixed(1), bpm: p.bpm })), [w.hr])
  const tgl = new Date(w.mulai)
  const shareRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={shareRef} className="rounded-lg border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="flex items-start gap-2 p-3">
        <button onClick={onToggle} className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-semibold text-ink text-sm">
              {w.nama}
              {w.diDalamRuangan === false && <span className="text-slate-500 font-normal"> · outdoors</span>}
            </span>
            <span className="text-xs text-slate-500">
              {tgl.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500">
            <span>{fmtDurasi(w.durasi)}</span>
            {w.jarakKm != null && <span>{w.jarakKm} km</span>}
            {w.paceSec != null && <span>{fmtPace(w.paceSec)}/km</span>}
            {w.avgHr != null && <span>♥ {w.avgHr} rata-rata</span>}
            {w.maxHr != null && <span>↑ {w.maxHr} maks</span>}
            {w.kcal != null && <span>{w.kcal} kkal</span>}
            {w.kadens != null && <span>{w.kadens} spm</span>}
          </div>
        </button>
        {terbuka && <ShareCardButton targetRef={shareRef} fileName={`panaceamed-${w.nama.replace(/\s+/g, '-').toLowerCase()}.png`} title={w.nama} />}
      </div>

      {terbuka && (
        <div className="px-3 pb-3 space-y-3">
          {chart.length > 1 && (
            <div className="rounded-lg border border-white/10 bg-black/20 p-2">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1">
                Beats per minute
              </div>
              <div style={{ width: '100%', height: 160 }}>
                <ResponsiveContainer>
                  <LineChart data={chart} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                    {/* Pita zona sebagai latar: membaca kurva tanpa acuan zona hampir tidak berarti. */}
                  {/* Pita 60/70/80/90% HRmaks mengikuti ACSM Guidelines
                      (Garber dkk., 2011, Med Sci Sports Exerc 43(7):1334-59). */}
                    <ReferenceArea y1={hrMax * 0.6} y2={hrMax * 0.7} fill="#34d399" fillOpacity={0.08} />
                    <ReferenceArea y1={hrMax * 0.8} y2={hrMax * 0.9} fill="#fbbf24" fillOpacity={0.08} />
                    <ReferenceArea y1={hrMax * 0.9} y2={hrMax} fill="#f87171" fillOpacity={0.1} />
                    <XAxis dataKey="menit" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} unit="m" />
                    <YAxis domain={['dataMin - 8', 'dataMax + 8']} tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} width={34} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 11 }}
                      labelFormatter={(v) => `menit ${v}`}
                      formatter={(v) => [`${v} bpm`, 'Heart rate']}
                    />
                    <Line type="monotone" dataKey="bpm" stroke="#f43f5e" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {zones.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                Time per zone
              </div>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/5">
                {zones.map((z) => (
                  z.pctWaktu > 0 && <div key={z.zona} style={{ width: `${z.pctWaktu}%`, background: z.warna }} title={`${z.nama} ${z.pctWaktu}%`} />
                ))}
              </div>
              <div className="mt-2 space-y-1">
                {zones.filter((z) => z.menit > 0).map((z) => (
                  <div key={z.zona} className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: z.warna }} />
                    <span className="text-neutral-600 flex-1 min-w-0 truncate">Z{z.zona} {z.nama}</span>
                    <span className="text-slate-500 tabular-nums">{Math.round(z.dariPct)}-{z.hinggaPct > 100 ? 'max' : Math.round(z.hinggaPct)}%</span>
                    <span className="text-ink tabular-nums w-16 text-right">{z.menit} mnt</span>
                    <span className="text-slate-500 tabular-nums w-9 text-right">{z.pctWaktu}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {w.hrr1 != null && (
            <div className={`rounded-lg border p-3 ${w.hrr1 >= 13 ? 'border-emerald-500/25 bg-emerald-500/[0.07]' : 'border-amber-500/25 bg-amber-500/[0.07]'}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-ink">First-minute recovery</span>
                <span className={`text-lg font-semibold tabular-nums ${w.hrr1 >= 13 ? 'text-emerald-300' : 'text-amber-300'}`}>
                  −{w.hrr1} bpm
                </span>
              </div>
              <p className="text-sm text-neutral-500 mt-1 leading-relaxed">
                Calculated from this session's own recovery trace. A drop of more than 12 bpm in one
                minute is considered normal, and larger is better.
                {w.hrr1 < 13 && ' One low reading means little on its own — what matters is whether the pattern persists, especially if the session ended in an abrupt stop rather than a gradual slowdown.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-center">
      <div className="text-base font-semibold text-ink tabular-nums">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}

export default WorkoutHistory
