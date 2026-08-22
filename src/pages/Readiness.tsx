import { useEffect, useMemo, useState } from 'react'
import { KolomAngka } from '../components/KolomAngka'
import { hariIni, hariLalu } from '../lib/tanggal'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconHeart, IconActivity, IconMoon, IconChartUp } from '../components/icons'
import { awal, awalBulat } from '../lib/nilaiAwal'
import { useVitals } from '../lib/useVitals'
import { mergeVitals } from '../lib/healthVitals'
import { mergeHealthCache } from '../lib/profile'

// ─────────────────────────────────────────────────────────────────────────────
// Recovery & Strain — WHOOP-style daily loop, offline:
//   1. Morning check-in: HRV, resting HR, sleep hours+quality, behavior journal.
//      HRV, denyut istirahat dan durasi tidur terisi sendiri dari perangkat;
//      yang diketik manual dikirim balik ke penyimpanan bersama lewat Enter.
//   2. Recovery Score 0-100% (green/yellow/red) vs your own rolling baseline.
//   3. Strain 0-21 (log-like scale) from logged workouts (duration × RPE).
//   4. Optimal Strain Target for today given recovery — the WHOOP killer
//      feature: "how hard should I go today?"
//   5. Sleep Need (base + strain + debt) and running Sleep Debt.
//   6. Behavior-impact insights once enough days are logged (e.g. average
//      recovery on days after late caffeine vs without).
// Data: one record per date in localStorage — nothing leaves the device.
// ─────────────────────────────────────────────────────────────────────────────

interface Workout { rpe: number; min: number }
interface DayLog {
  hrv?: number; rhr?: number
  sleepH?: number; sleepQ?: number // 1-5 subjective
  behaviors: string[]
  workouts: Workout[]
}
type Store = Record<string, DayLog> // key: yyyy-mm-dd

const KEY = 'pmd_readiness_v1'
const load = (): Store => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} } }
const todayKey = () => hariIni()
const dayKey = (offset: number) => hariLalu(offset)

const BEHAVIORS = [
  { id: 'caffeine_late', label: '☕ Afternoon/evening caffeine', bad: true },
  { id: 'alcohol', label: '🍺 Alcohol', bad: true },
  { id: 'late_meal', label: '🍽️ Late meal (<2 hrs before bed)', bad: true },
  { id: 'screen_bed', label: '📱 Screen time in bed', bad: true },
  { id: 'stress_high', label: '😰 High stress', bad: true },
  { id: 'sick', label: '🤒 Sick / feeling unwell', bad: true },
  { id: 'travel', label: '✈️ Long-distance travel', bad: true },
  { id: 'meditation', label: '🧘 Meditation', bad: false },
  { id: 'reading', label: '📖 Read before bed', bad: false },
  { id: 'sauna_cold', label: '🧊 Sauna / cold plunge', bad: false },
]

// Rolling baseline over up to 14 previous days (excluding today).
function baseline(store: Store, field: 'hrv' | 'rhr'): number | null {
  const vals: number[] = []
  for (let i = 1; i <= 14; i++) {
    const v = store[dayKey(i)]?.[field]
    if (v && v > 0) vals.push(v)
  }
  if (vals.length < 3) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

// Recovery score 0-100 — HRV vs baseline (50%), RHR vs baseline (25%),
// sleep performance (25%), then behavior modifiers.
function recoveryScore(d: DayLog, hrvBase: number | null, rhrBase: number | null, sleepNeed: number): number | null {
  if (!d.hrv || !d.rhr || !d.sleepH) return null
  let hrvPart = 50
  if (hrvBase) {
    const r = d.hrv / hrvBase // >1 good
    // Bobot di bawah ini pilihan penulis, bukan hasil penelitian: tidak ada
    // rumus kesiapan yang diterbitkan dan tervalidasi untuk digabung begini.
    // Yang bermakna adalah arah perubahannya pada satu orang dari hari ke hari.
    hrvPart = Math.max(0, Math.min(50, 50 * (0.5 + (r - 0.85) / 0.3 * 0.5)))
  }
  let rhrPart = 25
  if (rhrBase) {
    const diff = d.rhr - rhrBase // positive bad
    rhrPart = Math.max(0, Math.min(25, 25 - diff * 3))
  }
  const sleepPerf = Math.min(1, d.sleepH / sleepNeed)
  let sleepPart = 25 * sleepPerf * ((d.sleepQ ?? 3) / 5 + 0.4)
  sleepPart = Math.max(0, Math.min(25, sleepPart))
  let score = hrvPart + rhrPart + sleepPart
  for (const b of d.behaviors) {
    const meta = BEHAVIORS.find((x) => x.id === b)
    if (meta) score += meta.bad ? -4 : +2
  }
  return Math.round(Math.max(1, Math.min(100, score)))
}

// Strain 0-21, log-like: diminishing returns as load accumulates (WHOOP-style).
function strainOf(workouts: Workout[]): number {
  const load = workouts.reduce((s, w) => s + w.rpe * w.min, 0) // sRPE units
  if (load <= 0) return 0
  return Math.min(21, 21 * (1 - Math.exp(-load / 400)))
}
// Optimal strain target from recovery (piecewise like WHOOP's guidance).
function strainTarget(rec: number): [number, number] {
  if (rec >= 67) return [14, 18]
  if (rec >= 34) return [8, 13]
  return [0, 7]
}

function recTone(r: number): { color: string; label: string } {
  if (r >= 67) return { color: '#00BF63', label: 'GREEN — ready to perform' }
  if (r >= 34) return { color: '#f59e0b', label: 'YELLOW — moderate training' }
  return { color: '#ef4444', label: 'RED — prioritize recovery' }
}

// Big score ring.
function Ring({ value, max, color, size = 120, children }: { value: number; max: number; color: string; size?: number; children: React.ReactNode }) {
  const r = (size - 14) / 2
  const c = 2 * Math.PI * r
  const off = c - (Math.min(value, max) / max) * c
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="9" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)', filter: `drop-shadow(0 0 8px ${color}55)` }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}

export function Readiness() {
  const [store, setStore] = useState<Store>(load)
  const vitals = useVitals()
  const [baruDisimpan, setBaruDisimpan] = useState<string | null>(null)
  const tk = todayKey()
  const today: DayLog = store[tk] ?? { behaviors: [], workouts: [] }
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(store)) } catch { /* ignore */ } }, [store])
  const upd = (p: Partial<DayLog>) => setStore((s) => ({ ...s, [tk]: { ...today, ...p } }))

  // Isi otomatis dari perangkat. HRV, denyut istirahat dan durasi tidur sudah
  // diukur jam tangan semalam; meminta pengguna mengetik ulang angka yang sudah
  // ada di ponselnya adalah alasan skor pemulihan sering kosong seharian.
  // Hanya kolom yang masih kosong yang diisi — angka yang sudah diketik atau
  // sudah dikoreksi pengguna tidak pernah ditimpa.
  useEffect(() => {
    const p: Partial<DayLog> = {}
    if (!today.hrv) { const v = awal('hrvMs', 0); if (v > 0) p.hrv = Math.round(v) }
    if (!today.rhr) { const v = awalBulat('restingHr', 0); if (v > 0) p.rhr = v }
    if (!today.sleepH) { const v = awal('sleepH', 0); if (v > 0) p.sleepH = Math.round(v * 10) / 10 }
    if (Object.keys(p).length) upd(p)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tk, today.hrv, today.rhr, today.sleepH])

  const hrvBase = useMemo(() => baseline(store, 'hrv'), [store])
  const rhrBase = useMemo(() => baseline(store, 'rhr'), [store])

  // Sleep debt: accumulated (need − actual) over last 7 days, floored at 0.
  const baseNeed = 7.5
  const debt = useMemo(() => {
    let d = 0
    for (let i = 1; i <= 7; i++) {
      const day = store[dayKey(i)]
      if (!day?.sleepH) continue
      const yStrain = strainOf(day.workouts ?? [])
      const need = baseNeed + yStrain * 0.04
      d = Math.max(0, d + (need - day.sleepH) * 0.5) // decay: only half carries over
    }
    return d
  }, [store])
  const yesterdayStrain = strainOf(store[dayKey(1)]?.workouts ?? [])
  const sleepNeed = baseNeed + yesterdayStrain * 0.04 + Math.min(1.5, debt * 0.3)

  const rec = recoveryScore(today, hrvBase, rhrBase, sleepNeed)
  const strain = strainOf(today.workouts)
  const [lo, hi] = rec != null ? strainTarget(rec) : [8, 13]
  const tone = rec != null ? recTone(rec) : { color: '#a3a3a3', label: 'Fill in your morning check-in first' }

  // Week bars.
  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const k = dayKey(6 - i)
    const d = store[k]
    const r = d ? recoveryScore(d, hrvBase, rhrBase, baseNeed) : null
    return { k, rec: r, strain: d ? strainOf(d.workouts ?? []) : 0 }
  }), [store, hrvBase, rhrBase])

  // Behavior impact: mean recovery on days WITH behavior vs WITHOUT (last 30d).
  const impacts = useMemo(() => {
    const rows: { label: string; withB: number; without: number; n: number }[] = []
    for (const b of BEHAVIORS) {
      const w: number[] = [], wo: number[] = []
      for (let i = 0; i <= 30; i++) {
        const d = store[dayKey(i)]
        if (!d) continue
        const r = recoveryScore(d, hrvBase, rhrBase, baseNeed)
        if (r == null) continue
        if ((d.behaviors ?? []).includes(b.id)) w.push(r); else wo.push(r)
      }
      if (w.length >= 3 && wo.length >= 3) {
        rows.push({ label: b.label, withB: w.reduce((a, x) => a + x, 0) / w.length, without: wo.reduce((a, x) => a + x, 0) / wo.length, n: w.length })
      }
    }
    return rows.sort((a, b) => Math.abs(b.withB - b.without) - Math.abs(a.withB - a.without)).slice(0, 5)
  }, [store, hrvBase, rhrBase])

  // Workout entry
  const [wRpe, setWRpe] = useState(6)
  const [wMin, setWMin] = useState(45)

  // Kolom check-in pagi. Angkanya sudah diisi dari jam tangan lewat efek di
  // atas; yang ditambahkan di sini adalah dua hal yang membuatnya jujur:
  // penanda ⌚ kalau angkanya memang datang dari perangkat, dan tombol ↵ yang
  // MENGIRIM koreksi manual ke penyimpanan bersama. Tanpa yang kedua, ralat
  // yang Anda ketik di sini tidak pernah terlihat oleh halaman lain.
  const KUNCI_VITAL: Record<'hrv' | 'rhr' | 'sleepH', string> = {
    hrv: 'hrvMs', rhr: 'restingHr', sleepH: 'sleepH',
  }
  const num = (label: string, key: 'hrv' | 'rhr' | 'sleepH', step = 1, ph = '') => {
    const nilai = today[key]
    const perangkat = vitals[KUNCI_VITAL[key]]
    const dariPerangkat = typeof nilai === 'number' && typeof perangkat === 'number'
      && Math.abs(nilai - perangkat) < 0.05
    const kirim = () => {
      if (typeof nilai !== 'number' || !(nilai > 0) || dariPerangkat) return
      mergeVitals({ [KUNCI_VITAL[key]]: nilai, source: 'Manual', measuredAt: new Date().toISOString() })
      mergeHealthCache({ [KUNCI_VITAL[key]]: nilai })
      setBaruDisimpan(key)
      setTimeout(() => setBaruDisimpan(null), 1800)
    }
    const perluSimpan = typeof nilai === 'number' && nilai > 0 && !dariPerangkat
    return (
      <Field label={
        <span className="flex items-center gap-1">
          <span>{label}</span>
          {dariPerangkat && <span className="rounded bg-brand-50 px-1 text-[10px] font-bold text-brand-dark" title="Filled automatically from your device">⌚</span>}
        </span>
      }>
        <div className="flex items-center gap-1"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); kirim() } }}>
          <KolomAngka step={step} placeholder={ph} ariaLabel={label}
            nilai={nilai}
            onNilai={(n) => upd({ [key]: n } as Partial<DayLog>)} />
          {perluSimpan && baruDisimpan !== key && (
            <button type="button" onClick={kirim} aria-label={`Simpan ${label}`}
              title="Simpan nilai ini untuk seluruh aplikasi (atau tekan Enter)"
              className="shrink-0 rounded-lg bg-brand px-2 py-1.5 text-[12px] font-black text-ink">↵</button>
          )}
          {baruDisimpan === key && <span className="shrink-0 text-[10px] font-bold text-emerald-600" role="status">✓</span>}
        </div>
      </Field>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      {/* Hero: today's scores */}
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Recovery & Strain" subtitle="Satu keputusan tiap pagi: seberapa berat hari ini seharusnya?" />
        <div className="mt-2 flex items-center justify-around">
          <div className="flex flex-col items-center gap-1">
            <Ring value={rec ?? 0} max={100} color={tone.color}>
              <div>
                <div className="text-3xl font-extrabold" style={{ color: tone.color }}>{rec ?? '—'}<span className="text-sm text-neutral-500">%</span></div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Recovery</div>
              </div>
            </Ring>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Ring value={strain} max={21} color="#3b82f6">
              <div>
                <div className="text-3xl font-extrabold text-blue-500">{strain.toFixed(1)}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Strain /21</div>
              </div>
            </Ring>
          </div>
        </div>
        <div className="mt-3 rounded-2xl p-3 text-center" style={{ background: `${tone.color}14`, border: `1px solid ${tone.color}30` }}>
          <div className="text-sm font-extrabold" style={{ color: tone.color }}>{tone.label}</div>
          {rec != null && (
            <p className="mt-1 text-[11px] text-neutral-500">
              Optimal strain target today: <b>{lo}–{hi}</b>.
              {strain < lo && ` Still ${(lo - strain).toFixed(1)} strain of room left — go ahead and train.`}
              {strain >= lo && strain <= hi && ' You are in the optimal zone — keep it up.'}
              {strain > hi && ' You have already exceeded the target — extra load today risks cutting into tomorrow\'s recovery.'}
            </p>
          )}
        </div>
      </Card>

      {/* Morning check-in */}
      <Card className="!p-5">
        <SectionTitle icon={<IconMoon size={20} />} title="Morning Check-in" subtitle="Isi dari jam tangan/cincin atau dari yang Anda rasakan — 30 detik" />
        <div className="mt-2 grid grid-cols-3 gap-3">
          {num('Overnight HRV (ms)', 'hrv', 1, hrvBase ? `baseline ${hrvBase.toFixed(0)}` : 'e.g. 65')}
          {num('Resting HR (bpm)', 'rhr', 1, rhrBase ? `baseline ${rhrBase.toFixed(0)}` : 'e.g. 58')}
          {num('Sleep (hours)', 'sleepH', 0.1, `need ${sleepNeed.toFixed(1)}h`)}
        </div>
        <div className="mt-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Sleep quality (subjective)</div>
          <div className="mt-1.5 flex gap-1.5">
            {[1, 2, 3, 4, 5].map((q) => (
              <button key={q} onClick={() => upd({ sleepQ: q })}
                className={'flex-1 rounded-xl py-2 text-lg ' + ((today.sleepQ ?? 0) === q ? 'bg-brand/15 ring-2 ring-brand' : 'bg-neutral-100')}>
                {['😫', '😕', '😐', '🙂', '😴'][q - 1]}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Yesterday's behavior journal</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {BEHAVIORS.map((b) => (
              <button key={b.id}
                onClick={() => upd({ behaviors: today.behaviors.includes(b.id) ? today.behaviors.filter((x) => x !== b.id) : [...today.behaviors, b.id] })}
                className={'rounded-full px-3 py-1.5 text-[11px] font-bold ' + (today.behaviors.includes(b.id) ? (b.bad ? 'bg-rose-500 text-white' : 'bg-brand text-white') : 'bg-neutral-100 text-neutral-500')}>
                {b.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-neutral-50 p-3 text-center">
          <div>
            <div className="text-[10px] font-bold uppercase text-neutral-500">Sleep Need Tonight</div>
            <div className="text-lg font-extrabold text-brand-dark">{sleepNeed.toFixed(1)} hours</div>
            <div className="text-[10px] text-neutral-500">base {baseNeed}h + strain + sleep debt</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase text-neutral-500">Sleep Debt (7 days)</div>
            <div className={'text-lg font-extrabold ' + (debt > 2 ? 'text-rose-500' : debt > 0.5 ? 'text-amber-600' : 'text-brand-dark')}>{debt.toFixed(1)} hours</div>
            <div className="text-[10px] text-neutral-500">{debt > 2 ? 'sleep earlier tonight' : 'under control'}</div>
          </div>
        </div>
      </Card>

      {/* Log workout -> strain */}
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Log Today's Workout" subtitle="Lama × RPE → beban (skala 0-21, makin tinggi makin sulit dinaikkan)" />
        <div className="mt-2 flex items-end gap-2">
          <div className="w-24"><Field label="Minutes"><input className={inputClass} type="number" value={wMin} onChange={(e) => setWMin(+e.target.value)} /></Field></div>
          <div className="flex-1">
            <Field label={`RPE ${wRpe} — ${['', 'very light', 'light', 'light+', 'moderate', 'moderate+', 'somewhat hard', 'hard', 'very hard', 'near max', 'maximal'][wRpe]}`}>
              <input type="range" min={1} max={10} value={wRpe} onChange={(e) => setWRpe(+e.target.value)} className="w-full" />
            </Field>
          </div>
          <button
            onClick={() => { if (wMin > 0) upd({ workouts: [...today.workouts, { rpe: wRpe, min: wMin }] }) }}
            className="h-[42px] shrink-0 rounded-xl bg-brand px-4 text-sm font-bold text-white active:scale-95">+ Add</button>
        </div>
        {today.workouts.length > 0 && (
          <div className="mt-2 space-y-1">
            {today.workouts.map((w, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-1.5 text-xs">
                <span>🏋️ {w.min} min · RPE {w.rpe} <span className="text-neutral-500">(+{(w.rpe * w.min)} load)</span></span>
                <button onClick={() => upd({ workouts: today.workouts.filter((_, j) => j !== i) })} className="font-bold text-rose-600">✕</button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Week view */}
      <Card className="!p-5">
        <SectionTitle icon={<IconChartUp size={20} />} title="Last 7 Days" subtitle="Recovery (color) vs Strain (blue)" />
        <div className="mt-2 flex items-end justify-between gap-1.5" style={{ height: 110 }}>
          {week.map((d) => {
            const c = d.rec != null ? recTone(d.rec).color : '#e5e5e5'
            return (
              <div key={d.k} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end justify-center gap-0.5">
                  <div className="w-2.5 rounded-t" style={{ height: `${d.rec ?? 4}%`, background: c, minHeight: 4 }} title={`Recovery ${d.rec ?? '—'}%`} />
                  <div className="w-2.5 rounded-t bg-blue-400" style={{ height: `${(d.strain / 21) * 100}%`, minHeight: 2 }} title={`Strain ${d.strain.toFixed(1)}`} />
                </div>
                <div className="text-[10px] font-bold text-neutral-500">{new Date(d.k).toLocaleDateString('en-US', { weekday: 'short' })}</div>
              </div>
            )
          })}
        </div>
        {hrvBase == null && <p className="mt-2 text-center text-[11px] text-neutral-500">Fill in the check-in for ≥3 days to build your personal HRV/RHR baseline — the score will get more accurate.</p>}
      </Card>

      {/* Behavior impact */}
      {impacts.length > 0 && (
        <Card className="!p-5">
          <SectionTitle icon={<span className="text-lg">🔬</span>} title="Your Behavior Impact" subtitle="Average recovery on days WITH vs WITHOUT the behavior (30 days)" />
          <div className="mt-2 space-y-2">
            {impacts.map((r) => {
              const diff = r.withB - r.without
              return (
                <div key={r.label} className="flex items-center justify-between rounded-xl border border-neutral-100 p-3">
                  <div>
                    <div className="text-xs font-bold">{r.label}</div>
                    <div className="text-[10px] text-neutral-500">{r.n} days logged</div>
                  </div>
                  <div className={'text-sm font-extrabold ' + (diff < -2 ? 'text-rose-500' : diff > 2 ? 'text-brand-dark' : 'text-neutral-500')}>
                    {diff > 0 ? '+' : ''}{diff.toFixed(0)}% recovery
                  </div>
                </div>
              )
            })}
          </div>
          <p className="mt-2 text-[10px] text-neutral-500">This is a simple personal correlation, not causation — but a consistent pattern is worth acting on.</p>
        </Card>
      )}

      <div className="rounded-2xl border border-brand/20 bg-brand-50 p-4 text-center text-xs text-brand-dark">
        This score drives daily decisions; for weekly load trends see <a href="#/athlete" className="font-bold underline">ACWR & TSB in Athlete</a>,
        or your training program in <a href="#/training-plan" className="font-bold underline">AI Program</a>. All data stays on your device (offline).
      </div>
    </div>
  )
}

export default Readiness
