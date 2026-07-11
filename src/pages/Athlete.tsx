import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconRun, IconActivity, IconHeart, IconX } from '../components/icons'
import { ShareStatCard } from '../components/ShareStatCard'
import { PrefillBadge } from '../components/HealthSnapshot'
import { hasHealth, pushBiometrics } from '../lib/profile'
import { Portal } from '../components/Portal'
import { useStore } from '../lib/store'

// Motivational quotes from legendary athletes (Olympic/medal/award winners &
// globally followed icons) — shown as a welcome popup on the Athlete page.
const ATHLETE_QUOTES: { quote: string; author: string; feat: string }[] = [
  { quote: 'You miss 100% of the shots you don’t take.', author: 'Michael Jordan', feat: '6× NBA Champion · Olympic Gold' },
  { quote: 'I don’t count my sit-ups. I only start counting when it starts hurting.', author: 'Muhammad Ali', feat: 'Boxing Legend · 1960 Olympic Gold' },
  { quote: 'Talent wins games, but teamwork and brains win championships.', author: 'Michael Jordan', feat: '14× NBA All-Star' },
  { quote: 'My body can stand almost anything. It’s my mind I have to convince.', author: 'Usain Bolt', feat: '8× Olympic Gold · 100m World Record' },
  { quote: 'Stubborn about the dream, flexible about the way to get there.', author: 'Cristiano Ronaldo', feat: '5× Ballon d’Or · 600M+ IG followers' },
  { quote: 'I’ve always believed that if you put in the work, the results will come.', author: 'Lionel Messi', feat: '8× Ballon d’Or · 2022 World Champion' },
  { quote: 'Champions keep playing until they get it right.', author: 'Serena Williams', feat: '23× Grand Slam · 4× Olympic Gold' },
  { quote: 'Pressure is a privilege — it only comes to those who earn it.', author: 'Billie Jean King', feat: '39× Grand Slam · Presidential Medal of Freedom' },
  { quote: 'Everyone has a limit. What sets you apart is who dares to break through it.', author: 'Eliud Kipchoge', feat: 'Sub-2-hour marathon · 2× Olympic Gold' },
  { quote: 'Gold isn’t about the medal — it’s about becoming the best version of yourself.', author: 'Michael Phelps', feat: '23× Olympic Gold (most of all time)' },
]

function AthleteQuotePopup() {
  const [q] = useState(() => ATHLETE_QUOTES[Math.floor(Math.random() * ATHLETE_QUOTES.length)])
  const [open, setOpen] = useState(true)
  if (!open) return null
  return (
    <Portal>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setOpen(false)} aria-label="Close" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-neutral-400 hover:bg-neutral-100"><IconX size={18} /></button>
        <div className="mb-3 text-4xl">🏅</div>
        <p className="text-lg font-bold leading-snug text-ink">“{q.quote}”</p>
        <div className="mt-4 text-sm font-black text-brand-dark">{q.author}</div>
        <div className="text-xs text-neutral-400">{q.feat}</div>
        <button onClick={() => setOpen(false)} className="mt-5 w-full rounded-2xl py-3 text-sm font-bold text-white transition active:scale-95" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}>
          Let's Train! 💪
        </button>
      </div>
    </div>
    </Portal>
  )
}

interface AthleteProfile {
  age: number; g: 'M' | 'F'; weight: number; hrRest: number; hrMax: number
  // Garmin-style indicators, entered manually from a watch/device.
  acuteLoad: number     // beban 7 hari terakhir (Training Load akut)
  chronicLoad: number   // rata-rata beban mingguan 28 hari (Training Load kronis)
  vo2Trend: 'up' | 'flat' | 'down' // tren VO₂max 4 minggu terakhir
  hrv: number           // HRV malam (ms, rMSSD/SDNN dari jam)
  hrvBaseline: number   // baseline HRV personal (ms)
  recoveryHrs: number   // Recovery Time tersisa (jam) dari jam
  ltHr: number          // Lactate Threshold heart rate (bpm)
  ltPace: string        // Lactate Threshold pace (mm:ss /km)
  teAerobic: number     // Aerobic Training Effect sesi terakhir (0–5)
  teAnaerobic: number   // Anaerobic Training Effect sesi terakhir (0–5)
  sleepScore: number    // skor tidur jam (0–100)
}

const KEY = 'pm_athlete_profile'
const def: AthleteProfile = {
  age: 30, g: 'M', weight: 70, hrRest: 60, hrMax: 0,
  acuteLoad: 0, chronicLoad: 0, vo2Trend: 'flat', hrv: 0, hrvBaseline: 0,
  recoveryHrs: 0, ltHr: 0, ltPace: '', teAerobic: 0, teAnaerobic: 0, sleepScore: 0,
}
function load(): AthleteProfile {
  let p: AthleteProfile = { ...def }
  try { const d = JSON.parse(localStorage.getItem(KEY) || ''); if (d.age) p = { ...def, ...d } } catch { /* ignore */ }
  // Prefill resting HR / HRV / age from the central Health Profile when unset.
  try {
    const hp = JSON.parse(localStorage.getItem('pmd_health_profile') || '{}')
    if (p.hrRest === def.hrRest && hp.restingHr) p.hrRest = hp.restingHr
    if (!p.hrv && hp.hrvMs) p.hrv = hp.hrvMs
    if (p.age === def.age && hp.age) p.age = hp.age
    if (hp.sex) p.g = hp.sex
    if (p.weight === def.weight && hp.weightKg) p.weight = hp.weightKg
  } catch { /* ignore */ }
  return p
}
function save(p: AthleteProfile) { try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* ignore */ } }

// Uth-Sørensen-Overgaard-Pedersen non-exercise VO2max estimate: 15.3 × HRmax/HRrest.
// Uses the user's measured max HR when provided, falling back to the
// 220−usia (226−usia for women) estimate only when no measurement exists.
function vo2max(hrMax: number, hrRest: number) {
  return (15.3 * hrMax) / hrRest
}

const ZONES = [
  { z: 'Z1', label: 'Recovery', pct: [0.5, 0.6], desc: 'Active recovery, comfortable conversation pace' },
  { z: 'Z2', label: 'Aerobic Base', pct: [0.6, 0.7], desc: 'Builds the endurance foundation' },
  { z: 'Z3', label: 'Tempo', pct: [0.7, 0.8], desc: 'Aerobic threshold, still able to speak in short bursts' },
  { z: 'Z4', label: 'Lactate Threshold', pct: [0.8, 0.9], desc: 'Hard, 4-8 minute intervals' },
  { z: 'Z5', label: 'VO₂max / Anaerobic', pct: [0.9, 1.0], desc: 'Maximal effort, short 30s-3 minute intervals' },
] as const

// Zone color scale used by the session HR chart & time-in-zone bars —
// blue (warm-up) → green (easy) → yellow (aerobic) → orange (threshold) → red (max).
const ZONE_COLORS = ['#3b82f6', '#22c55e', '#eab308', '#f97316', '#ef4444']
function zoneIndex(bpm: number, hrMax: number): number {
  const pct = bpm / hrMax
  if (pct < 0.6) return 0
  if (pct < 0.7) return 1
  if (pct < 0.8) return 2
  if (pct < 0.9) return 3
  return 4
}
function fmtZoneDur(sec: number): string {
  const m = Math.floor(sec / 60), s = Math.round(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

// Post-session heart-rate analysis — the layer the watch screenshots show:
// BPM trace colored by zone + time-in-zone distribution. Reads the viewer's
// most recent GPS activity that captured HR (entered live in the tracker or
// synced from a device).
function HrZoneAnalysis({ hrMax }: { hrMax: number }) {
  const { state, account } = useStore()
  const act = [...state.gpsActivities]
    .filter((a) => a.email === account?.email && (a.hrSamples?.length ?? 0) >= 2)
    .sort((a, b) => b.at.localeCompare(a.at))[0]

  if (!act || !act.hrSamples) {
    return (
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Session Heart Rate" subtitle="BPM trace & time in each zone" />
        <p className="mt-2 text-xs text-neutral-400">
          No session with heart-rate data yet. Track a workout with the <b>GPS Tracker</b> on Home and enter your HR (bpm) while training — or sync a watch — and your BPM chart and time-in-zone breakdown will appear here automatically.
        </p>
      </Card>
    )
  }

  const samples = act.hrSamples
  const bpms = samples.map((x) => x.bpm)
  const avg = act.avgHr ?? Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length)
  const max = act.maxHr ?? Math.max(...bpms)
  const maxS = Math.max(samples[samples.length - 1].s, 1)
  const yLo = Math.min(...bpms) - 8
  const yHi = Math.max(...bpms) + 8
  const X = (s: number) => (s / maxS) * 320
  const Y = (bpm: number) => 110 - ((bpm - yLo) / Math.max(yHi - yLo, 1)) * 100

  // Time in zone: attribute the gap after each sample to that sample's zone.
  const zoneSec = [0, 0, 0, 0, 0]
  for (let i = 0; i < samples.length - 1; i++) {
    const dt = Math.min(Math.max(samples[i + 1].s - samples[i].s, 0), 120)
    zoneSec[zoneIndex(samples[i].bpm, hrMax)] += dt
  }
  const totalSec = zoneSec.reduce((a, b) => a + b, 0) || 1
  const zoneMeta = [
    { label: 'Zone 1 · Warm-up', range: `≤ ${Math.round(hrMax * 0.6)} bpm` },
    { label: 'Zone 2 · Easy', range: `${Math.round(hrMax * 0.6)}–${Math.round(hrMax * 0.7)} bpm` },
    { label: 'Zone 3 · Aerobic', range: `${Math.round(hrMax * 0.7)}–${Math.round(hrMax * 0.8)} bpm` },
    { label: 'Zone 4 · Threshold', range: `${Math.round(hrMax * 0.8)}–${Math.round(hrMax * 0.9)} bpm` },
    { label: 'Zone 5 · Maximum', range: `> ${Math.round(hrMax * 0.9)} bpm` },
  ]

  return (
    <Card className="!p-5">
      <SectionTitle
        icon={<IconHeart size={20} />}
        title="Session Heart Rate"
        subtitle={`${act.emoji} ${act.sport} · ${new Date(act.at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} · ${fmtZoneDur(act.durSec)}`}
      />
      <div className="mt-3 flex items-baseline justify-around text-center">
        <div>
          <div className="text-3xl font-extrabold text-ink">{avg}</div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Avg BPM</div>
        </div>
        <div>
          <div className="text-3xl font-extrabold text-ink">{max}</div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Max BPM</div>
        </div>
      </div>

      <svg viewBox="0 0 320 120" className="mt-3 w-full" role="img" aria-label="Heart rate over the session, colored by training zone">
        <line x1="0" x2="320" y1={Y(avg)} y2={Y(avg)} stroke="#ef4444" strokeWidth="1" strokeDasharray="4 4" opacity="0.55" />
        {samples.slice(0, -1).map((pt, i) => {
          const nxt = samples[i + 1]
          return (
            <line key={i} x1={X(pt.s)} y1={Y(pt.bpm)} x2={X(nxt.s)} y2={Y(nxt.bpm)}
              stroke={ZONE_COLORS[zoneIndex((pt.bpm + nxt.bpm) / 2, hrMax)]} strokeWidth="2.5" strokeLinecap="round" />
          )
        })}
      </svg>

      <div className="mt-4 space-y-2.5">
        {zoneMeta.map((z, i) => {
          const pct = Math.round((zoneSec[i] / totalSec) * 100)
          return (
            <div key={z.label}>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-neutral-600">{z.label} <span className="font-medium text-neutral-400">· {z.range}</span></span>
                <span className="font-bold tabular-nums text-neutral-600">{fmtZoneDur(zoneSec[i])} <span className="text-neutral-400">({pct}%)</span></span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full rounded-full" style={{ width: `${Math.max(pct, zoneSec[i] > 0 ? 3 : 0)}%`, background: ZONE_COLORS[i] }} />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function vo2Tier(v: number, g: 'M' | 'F') {
  const t = g === 'M'
    ? [[60, 'Elite'], [52, 'Excellent'], [45, 'Good'], [38, 'Fair'], [0, 'Needs Improvement']] as const
    : [[54, 'Elite'], [46, 'Excellent'], [39, 'Good'], [32, 'Fair'], [0, 'Needs Improvement']] as const
  return t.find(([min]) => v >= min)?.[1] ?? 'Needs Improvement'
}

// Acute:Chronic Workload Ratio (Gabbett 2016) — primary injury-risk indicator.
// "Sweet spot" 0.8–1.3; >1.5 sharply raises soft-tissue injury risk; <0.8 =
// undertraining/detraining (also raises risk when load later spikes).
function acwrZone(ratio: number): { label: string; tone: 'brand' | 'low' | 'critical' | 'neutral'; advice: string } {
  if (!isFinite(ratio) || ratio <= 0) return { label: 'Not enough data', tone: 'neutral', advice: 'Enter your acute load (7 days) & chronic load (28-day weekly average) from your watch.' }
  if (ratio < 0.8) return { label: 'Undertraining / Detraining', tone: 'low', advice: 'Load is too low compared to your usual habits. Increase gradually (max +10%/week) so fitness doesn’t decline.' }
  if (ratio <= 1.3) return { label: 'Sweet Spot (Optimal)', tone: 'brand', advice: 'Safe & adaptive zone. Maintain gradual progression; this is the best phase for building fitness.' }
  if (ratio <= 1.5) return { label: 'Caution (Load Rising Fast)', tone: 'low', advice: 'Load spike detected. Hold back intensity for 1–2 days, favor Z1–Z2 & recovery before adding more load.' }
  return { label: 'High Injury Risk', tone: 'critical', advice: 'Dangerous spike (>1.5). Reduce volume/intensity immediately, prioritize sleep, mobility & recovery to prevent soft-tissue injury.' }
}

// Garmin-style Training Status from load ratio + VO₂max trend.
function trainingStatus(ratio: number, trend: 'up' | 'flat' | 'down'): { label: string; tone: 'brand' | 'low' | 'critical' | 'neutral'; desc: string } {
  if (!isFinite(ratio) || ratio <= 0) return { label: '—', tone: 'neutral', desc: 'Complete your training load data to assess status.' }
  if (ratio > 1.5) return { label: 'Overreaching', tone: 'critical', desc: 'Load exceeds your recovery capacity. Needs a deload/recovery period to avoid overtraining.' }
  if (trend === 'up' && ratio >= 0.8) return { label: 'Productive', tone: 'brand', desc: 'Fitness is improving with balanced load — keep it up.' }
  if (trend === 'flat' && ratio >= 0.8 && ratio <= 1.3) return { label: 'Maintaining', tone: 'brand', desc: 'Fitness is being maintained. Add stimulus to progress further.' }
  if (ratio < 0.8 && trend !== 'down') return { label: 'Recovery', tone: 'low', desc: 'Light load — suitable for a controlled taper/recovery.' }
  if (trend === 'down') return { label: 'Detraining', tone: 'low', desc: 'Fitness is declining. Raise load gradually to reverse the trend.' }
  return { label: 'Unproductive', tone: 'low', desc: 'Load is there but fitness isn’t improving — check sleep, nutrition & stress.' }
}

// HRV status vs personal baseline (readiness/autonomic recovery).
function hrvStatus(hrv: number, base: number): { label: string; tone: 'brand' | 'low' | 'critical' | 'neutral' } {
  if (!hrv || !base) return { label: 'Enter HRV & baseline', tone: 'neutral' }
  const d = (hrv - base) / base
  if (d >= -0.05) return { label: 'Balanced — ready to train', tone: 'brand' }
  if (d >= -0.15) return { label: 'Slightly suppressed — go light', tone: 'low' }
  return { label: 'Suppressed — prioritize recovery', tone: 'critical' }
}

export function Athlete() {
  const [p, setP] = useState<AthleteProfile>(load)
  const hrMax = p.hrMax > 0 ? p.hrMax : (p.g === 'M' ? 220 - p.age : 226 - p.age)
  const v = vo2max(hrMax, p.hrRest)
  const tier = vo2Tier(v, p.g)
  const acwr = p.chronicLoad > 0 ? p.acuteLoad / p.chronicLoad : 0
  const acwrZ = acwrZone(acwr)
  const status = trainingStatus(acwr, p.vo2Trend)
  const hrvZ = hrvStatus(p.hrv, p.hrvBaseline)

  function upd(next: Partial<AthleteProfile>) {
    const merged = { ...p, ...next }
    setP(merged)
    save(merged)
    // Sync shared biometrics back to the central Health Profile.
    if ('hrRest' in next || 'hrv' in next || 'weight' in next)
      pushBiometrics({ restingHr: merged.hrRest, hrvMs: merged.hrv, weightKg: merged.weight })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <AthleteQuotePopup />
      <div className="flex justify-end">
        <ShareStatCard
          activity="🏃 Athlete Performance"
          metricLabel="Estimated VO₂max"
          metricValue={v.toFixed(1)}
          metricUnit="ml/kg/min"
          badge={tier}
          secondary={`Max HR ${hrMax} bpm`}
        />
      </div>
      <Card className="!p-5">
        <SectionTitle icon={<IconRun size={20} />} title="Athlete Performance" subtitle="VO₂max, training zones & weekly load target" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Age"><input className={inputClass} type="number" value={p.age} onChange={(e) => upd({ age: +e.target.value })} /></Field>
          <Field label="Sex">
            <select className={inputClass} value={p.g} onChange={(e) => upd({ g: e.target.value as 'M' | 'F' })}>
              <option value="M">Male</option><option value="F">Female</option>
            </select>
          </Field>
          <Field label="Weight (kg)"><input className={inputClass} type="number" value={p.weight} onChange={(e) => upd({ weight: +e.target.value })} /></Field>
          <Field label={<>Resting HR<PrefillBadge show={hasHealth('restingHr')} /></>}><input className={inputClass} type="number" value={p.hrRest} onChange={(e) => upd({ hrRest: +e.target.value })} /></Field>
        </div>
        <div className="mt-2">
          <Field label={`Measured Max HR (optional, leave blank to estimate ${p.g === 'M' ? '220' : '226'}-age)`}>
            <input className={inputClass} type="number" value={p.hrMax || ''} placeholder={String(p.g === 'M' ? 220 - p.age : 226 - p.age)} onChange={(e) => upd({ hrMax: +e.target.value })} />
          </Field>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-ink p-4 text-white">
            <div className="text-xs font-semibold uppercase tracking-wide text-white/50">Estimated VO₂max</div>
            <div className="text-3xl font-extrabold text-brand">{v.toFixed(1)}<span className="ml-1 text-sm font-medium text-white/50">ml/kg/min</span></div>
            <Badge tone="brand">{tier}</Badge>
          </div>
          <div className="rounded-2xl border border-neutral-100 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Max HR</div>
            <div className="text-3xl font-extrabold text-ink">{hrMax}<span className="ml-1 text-sm font-medium text-neutral-400">bpm</span></div>
            <div className="mt-1 text-[11px] text-neutral-400">Basis for calculating the 5 training zones</div>
          </div>
        </div>
      </Card>

      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Training Zones" subtitle="Percentage of maximum heart rate" />
        <div className="mt-3 space-y-2">
          {ZONES.map((z) => {
            const lo = Math.round(hrMax * z.pct[0]); const hi = Math.round(hrMax * z.pct[1])
            return (
              <div key={z.z} className="flex items-center justify-between rounded-xl border border-neutral-100 p-3">
                <div>
                  <div className="text-sm font-bold">{z.z} — {z.label}</div>
                  <div className="text-[11px] text-neutral-400">{z.desc}</div>
                </div>
                <div className="text-right text-sm font-extrabold text-brand-dark">{lo}–{hi} bpm</div>
              </div>
            )
          })}
        </div>
      </Card>

      <HrZoneAnalysis hrMax={hrMax} />

      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Weekly Load Target" subtitle="General recommendations based on VO₂max tier" />
        <ul className="mt-2 space-y-1.5 text-sm text-neutral-600">
          <li>• Total volume: {tier === 'Elite' || tier === 'Excellent' ? '8-12 hours' : tier === 'Good' ? '5-8 hours' : '3-5 hours'} / week</li>
          <li>• Z1-Z2 (aerobic base): 70-80% of total volume</li>
          <li>• Z4-Z5 (high-intensity intervals): maximum 1-2 sessions/week</li>
          <li>• Strength/resistance training: 2-3x/week to prevent injury</li>
          <li>• Full recovery days (Z1 or complete rest): at least 1-2 days/week</li>
        </ul>
      </Card>

      {/* ── Training Load & Injury Risk (ACWR) ─────────────────── */}
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Training Load & Injury Risk" subtitle="Acute:Chronic Workload Ratio — filled in from Training Load on your watch (Garmin/Polar/Coros/Apple)" />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Acute Load — 7 days (Load)"><input className={inputClass} type="number" value={p.acuteLoad || ''} placeholder="e.g. 420" onChange={(e) => upd({ acuteLoad: +e.target.value })} /></Field>
          <Field label="Chronic Load — 28-day weekly average"><input className={inputClass} type="number" value={p.chronicLoad || ''} placeholder="e.g. 380" onChange={(e) => upd({ chronicLoad: +e.target.value })} /></Field>
        </div>
        <div className="mt-3 rounded-2xl bg-ink p-4 text-white">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-white/50">ACWR Ratio</div>
              <div className="text-3xl font-extrabold text-brand">{acwr > 0 ? acwr.toFixed(2) : '—'}</div>
            </div>
            <Badge tone={acwrZ.tone}>{acwrZ.label}</Badge>
          </div>
          {/* Risk bar: 0 .. 2.0 with sweet-spot band */}
          <div className="relative mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/15">
            <div className="absolute inset-y-0 bg-emerald-400/30" style={{ left: `${(0.8 / 2) * 100}%`, width: `${((1.3 - 0.8) / 2) * 100}%` }} />
            {acwr > 0 && <div className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-white" style={{ left: `${Math.min(acwr / 2, 1) * 100}%` }} />}
          </div>
          <div className="mt-1 flex justify-between text-[9px] text-white/40"><span>0.8</span><span>Sweet spot</span><span>1.3</span><span>1.5+</span></div>
          <p className="mt-3 text-xs leading-relaxed text-white/80">{acwrZ.advice}</p>
        </div>
        <details className="mt-2 text-[11px] text-neutral-500">
          <summary className="cursor-pointer font-semibold text-brand-dark">Don't have Load numbers? Calculate sRPE manually</summary>
          <p className="mt-1.5 leading-relaxed">Foster method (sRPE): <b>Session load = duration (minutes) × RPE (1–10)</b>. Sum all sessions over 7 days → Acute Load. Average weekly load over 4 weeks → Chronic Load. Example: a 60-minute run at RPE 7 = 420 load units.</p>
        </details>
      </Card>

      {/* ── Training Status + Recovery (Garmin-style) ────────────── */}
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Training Status & Readiness" subtitle="Training Status, HRV & Recovery Time from your device" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="VO₂max Trend (4 wks)">
            <select className={inputClass} value={p.vo2Trend} onChange={(e) => upd({ vo2Trend: e.target.value as AthleteProfile['vo2Trend'] })}>
              <option value="up">Up ↑</option><option value="flat">Stable →</option><option value="down">Down ↓</option>
            </select>
          </Field>
          <Field label={<>Overnight HRV (ms)<PrefillBadge show={hasHealth('hrvMs')} /></>}><input className={inputClass} type="number" value={p.hrv || ''} placeholder="e.g. 65" onChange={(e) => upd({ hrv: +e.target.value })} /></Field>
          <Field label="Baseline HRV (ms)"><input className={inputClass} type="number" value={p.hrvBaseline || ''} placeholder="e.g. 68" onChange={(e) => upd({ hrvBaseline: +e.target.value })} /></Field>
          <Field label="Recovery Time (hrs)"><input className={inputClass} type="number" value={p.recoveryHrs || ''} placeholder="e.g. 18" onChange={(e) => upd({ recoveryHrs: +e.target.value })} /></Field>
          <Field label="Sleep Score (0–100)"><input className={inputClass} type="number" value={p.sleepScore || ''} placeholder="e.g. 82" onChange={(e) => upd({ sleepScore: +e.target.value })} /></Field>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-neutral-100 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Training Status</div>
            <div className="mt-1"><Badge tone={status.tone}>{status.label}</Badge></div>
            <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{status.desc}</p>
          </div>
          <div className="rounded-2xl border border-neutral-100 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">HRV Status / Readiness</div>
            <div className="mt-1"><Badge tone={hrvZ.tone}>{hrvZ.label}</Badge></div>
            <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
              {p.recoveryHrs > 0 ? `Recovery Time remaining ${p.recoveryHrs} hrs. ` : ''}
              {p.sleepScore > 0 ? (p.sleepScore >= 75 ? 'Good sleep — ready for full load.' : 'Poor sleep — reduce intensity.') : 'Fill in data for a readiness recommendation.'}
            </p>
          </div>
        </div>
      </Card>

      {/* ── Lactate Threshold & Training Effect ──────────────────────── */}
      <Card className="!p-5">
        <SectionTitle icon={<IconRun size={20} />} title="Lactate Threshold & Training Effect" subtitle="Intensity markers — measured via field test / watch" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="LT Heart Rate (bpm)"><input className={inputClass} type="number" value={p.ltHr || ''} placeholder="e.g. 168" onChange={(e) => upd({ ltHr: +e.target.value })} /></Field>
          <Field label="LT Pace (mm:ss /km)"><input className={inputClass} value={p.ltPace} placeholder="e.g. 4:35" onChange={(e) => upd({ ltPace: e.target.value })} /></Field>
          <Field label="Aerobic TE (0–5)"><input className={inputClass} type="number" step="0.1" value={p.teAerobic || ''} placeholder="e.g. 3.4" onChange={(e) => upd({ teAerobic: +e.target.value })} /></Field>
          <Field label="Anaerobic TE (0–5)"><input className={inputClass} type="number" step="0.1" value={p.teAnaerobic || ''} placeholder="e.g. 1.8" onChange={(e) => upd({ teAnaerobic: +e.target.value })} /></Field>
        </div>
        <ul className="mt-3 space-y-1 text-[11px] leading-relaxed text-neutral-500">
          <li>• <b>LT HR</b> ≈ the upper limit of Zone 4. Tempo training right around this value raises your lactate threshold — key to endurance performance.</li>
          <li>• <b>Training Effect</b>: 1.0–1.9 recovery · 2.0–2.9 maintaining · 3.0–3.9 improving · 4.0–4.9 highly improving · 5.0 overreaching (needs extra recovery).</li>
          {p.ltHr > 0 && <li>• Your tempo zone: <b>{Math.round(p.ltHr * 0.95)}–{p.ltHr} bpm</b> (4–8 minute threshold intervals).</li>}
        </ul>
      </Card>

      <FitnessFatigueCard acute={p.acuteLoad} chronic={p.chronicLoad} />
      <RacePlannerCard />

      {/* Workout music */}
      <Card className="!p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-extrabold">🎧 Workout music</div>
          <div className="flex gap-2">
            <a href="https://open.spotify.com/genre/workout" target="_blank" rel="noreferrer" className="rounded-full bg-[#1DB954] px-4 py-2 text-xs font-bold text-white active:scale-95">Spotify</a>
            <a href="https://music.apple.com/us/room/6451822724" target="_blank" rel="noreferrer" className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-bold text-white active:scale-95"> Apple Music</a>
          </div>
        </div>
      </Card>

      <div className="rounded-2xl border border-brand/20 bg-brand-50 p-4 text-center text-xs text-brand-dark">
        📚 Learn more about these indicators in <a href="#/sports-science" className="font-bold underline">Sports Science & KPIs</a> ·
        scheduled programs in <a href="#/training-plan" className="font-bold underline">AI Training Planner</a> ·
        body composition in <a href="#/body" className="font-bold underline">Body Composition</a>.
        This page is stored locally & can be accessed offline after your first visit.
      </div>
    </div>
  )
}

// ── Fitness & Fatigue (Banister/TSB model, TrainingPeaks-style) ───────────────
// CTL ≈ chronic (fitness), ATL ≈ acute (fatigue), TSB = CTL − ATL (form).
function FitnessFatigueCard({ acute, chronic }: { acute: number; chronic: number }) {
  const ctl = chronic / 7 // average daily chronic load
  const atl = acute / 7
  const tsb = ctl - atl
  const has = acute > 0 && chronic > 0
  const zone = !has ? { l: 'Enter Training Load above', tone: 'neutral' as const, d: 'CTL/ATL are calculated from acute & chronic load.' }
    : tsb > 15 ? { l: 'Very Fresh (detraining risk)', tone: 'low' as const, d: 'High form but fitness may decline — suitable only for race week.' }
    : tsb >= 5 ? { l: 'Fresh — ready to perform', tone: 'brand' as const, d: 'Race/test zone: fitness maintained, fatigue low.' }
    : tsb >= -10 ? { l: 'Neutral — ideal training zone', tone: 'brand' as const, d: 'Productive load. Maintain gradual progression.' }
    : tsb >= -25 ? { l: 'Tired — high load', tone: 'low' as const, d: 'Functional overreaching. Ensure sleep & nutrition; schedule a deload.' }
    : { l: 'Very Tired — danger', tone: 'critical' as const, d: 'TSB is very negative. Reduce load now to avoid overtraining/injury.' }
  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconActivity size={20} />} title="Fitness & Fatigue (Form)" subtitle="CTL/ATL/TSB model — calculated from the same Training Load above" />
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <div className="text-[9px] font-bold uppercase text-neutral-400">Fitness (CTL)</div>
          <div className="text-xl font-extrabold text-brand-dark">{has ? ctl.toFixed(0) : '—'}</div>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <div className="text-[9px] font-bold uppercase text-neutral-400">Fatigue (ATL)</div>
          <div className="text-xl font-extrabold text-amber-600">{has ? atl.toFixed(0) : '—'}</div>
        </div>
        <div className="rounded-xl bg-ink p-3 text-center text-white">
          <div className="text-[9px] font-bold uppercase text-white/50">Form (TSB)</div>
          <div className={'text-xl font-extrabold ' + (tsb >= 0 ? 'text-brand' : 'text-amber-300')}>{has ? (tsb > 0 ? '+' : '') + tsb.toFixed(0) : '—'}</div>
        </div>
      </div>
      <div className="mt-2"><Badge tone={zone.tone}>{zone.l}</Badge></div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-500">{zone.d}</p>
    </Card>
  )
}

// ── Race Planner — countdown, taper & time prediction (Riegel formula) ──────────
function RacePlannerCard() {
  const RKEY = 'pm_race_plan'
  const [race, setRace] = useState(() => {
    try { return { date: '', dist: 10, recentDist: 5, recentMin: 30, ...JSON.parse(localStorage.getItem(RKEY) || '{}') } } catch { return { date: '', dist: 10, recentDist: 5, recentMin: 30 } }
  })
  const upd = (p: Partial<typeof race>) => setRace((r: typeof race) => { const n = { ...r, ...p }; try { localStorage.setItem(RKEY, JSON.stringify(n)) } catch { /* ignore */ } return n })
  const daysOut = race.date ? Math.ceil((new Date(race.date).getTime() - Date.now()) / 86400000) : 0
  // Riegel: T2 = T1 × (D2/D1)^1.06
  const pred = race.recentMin > 0 && race.recentDist > 0 ? race.recentMin * Math.pow(race.dist / race.recentDist, 1.06) : 0
  const predPace = pred > 0 ? pred / race.dist : 0
  const phase = daysOut <= 0 ? '' : daysOut <= 7 ? 'RACE WEEK: volume −60%, short sharp intensity, carb-loading the last 2 days, prioritize sleep.' :
    daysOut <= 14 ? 'TAPER: volume −40%, keep 1 short intensity session. No new training stimuli.' :
    daysOut <= 42 ? 'PEAK: key race-pace-specific sessions 2×/week + long run. Practice fueling/gels during the long run.' :
    'BASE/BUILD: build Zone 2 volume + 1-2 quality sessions. Increase max +10%/week.'
  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconRun size={20} />} title="Race Planning" subtitle="Race target → automatic training phase + time prediction (Riegel)" />
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Race date"><input className={inputClass} type="date" value={race.date} onChange={(e) => upd({ date: e.target.value })} /></Field>
        <Field label="Race distance (km)"><input className={inputClass} type="number" value={race.dist} onChange={(e) => upd({ dist: +e.target.value })} /></Field>
        <Field label="Recent result: distance (km)"><input className={inputClass} type="number" value={race.recentDist} onChange={(e) => upd({ recentDist: +e.target.value })} /></Field>
        <Field label="Recent result: time (min)"><input className={inputClass} type="number" value={race.recentMin} onChange={(e) => upd({ recentMin: +e.target.value })} /></Field>
      </div>
      {race.date && daysOut > 0 && (
        <div className="mt-3 rounded-2xl bg-ink p-4 text-white">
          <div className="flex items-baseline justify-between">
            <div><span className="text-3xl font-extrabold text-brand">{daysOut}</span><span className="ml-1 text-xs text-white/60">days to go</span></div>
            {pred > 0 && (
              <div className="text-right">
                <div className="text-[10px] uppercase text-white/50">Predicted finish</div>
                <div className="text-xl font-extrabold">{Math.floor(pred / 60) > 0 ? `${Math.floor(pred / 60)}h ` : ''}{Math.round(pred % 60)}m</div>
                <div className="text-[10px] text-white/60">pace {Math.floor(predPace)}:{String(Math.round((predPace % 1) * 60)).padStart(2, '0')} /km</div>
              </div>
            )}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-white/80">📋 {phase}</p>
        </div>
      )}
    </Card>
  )
}

export default Athlete
