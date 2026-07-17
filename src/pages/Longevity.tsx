import { useEffect, useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconHeart, IconActivity, IconChartUp, IconTimer } from '../components/icons'
import { PrefillBadge } from '../components/HealthSnapshot'
import { hasHealth, pushBiometrics } from '../lib/profile'
import { ShareStatCard } from '../components/ShareStatCard'

// ─────────────────────────────────────────────────────────────────────────────
// Pusat Longevity — the layer wearables DON'T have. Apple Watch & WHOOP score
// your DAY; this scores your DECADES:
//   • Composite Longevity Score from validated long-term mortality/healthspan
//     predictors (VO₂max, grip, leg strength, balance, body comp, RHR, sleep,
//     lifestyle) with evidence-based weights.
//   • Biological-age estimate (heuristic, optionally sharpened by lab values).
//   • Decade projection: where each capacity lands at 60 & 80 on the current
//     path vs the trained path — "train the you at 80".
//   • Testing protocol: quarterly field tests + yearly labs with due dates.
// Auto-prefills from data already entered elsewhere in the app (Body
// Composition, Athlete). Manual, offline, device-agnostic — a complement to any watch.
// ─────────────────────────────────────────────────────────────────────────────

interface LongevityData {
  age: number; g: 'M' | 'F'
  vo2: number; grip: number; chair30: number; balance: number
  whr: number; rhr: number; sleepH: number
  smoke: 'never' | 'former' | 'current'; alcohol: 0 | 1 | 2 // none/moderate/heavy
  protein: boolean; social: boolean; purpose: boolean
  hba1c: number; ldl: number; crp: number; sbp: number
  tests: Record<string, string> // test id -> last done ISO date
}
const DEF: LongevityData = {
  age: 30, g: 'M', vo2: 0, grip: 0, chair30: 0, balance: 0,
  whr: 0, rhr: 0, sleepH: 7, smoke: 'never', alcohol: 0,
  protein: false, social: false, purpose: false,
  hba1c: 0, ldl: 0, crp: 0, sbp: 0, tests: {},
}
const KEY = 'pmd_longevity_v1'

function load(): LongevityData {
  let d: LongevityData = { ...DEF }
  try { d = { ...DEF, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { /* ignore */ }
  // Prefill once from sibling pages if empty — the "aggregator" behavior.
  try {
    const bc = JSON.parse(localStorage.getItem('pm_bodycomp_v1') || '{}')
    if (!d.vo2 && bc.vo2) d.vo2 = bc.vo2
    if (!d.rhr && bc.rhr) d.rhr = bc.rhr
    if (!d.whr && bc.waist && bc.hip) d.whr = +(bc.waist / bc.hip).toFixed(2)
    if (d.age === DEF.age && bc.age) d.age = bc.age
    if (bc.g) d.g = bc.g
    if (!d.sleepH && bc.sleepH) d.sleepH = bc.sleepH
  } catch { /* ignore */ }
  // Then from the central Health Profile (manual/wearable) — highest priority source.
  try {
    const hp = JSON.parse(localStorage.getItem('pmd_health_profile') || '{}')
    if (!d.vo2 && hp.vo2max) d.vo2 = hp.vo2max
    if (!d.rhr && hp.restingHr) d.rhr = hp.restingHr
    if (!d.sleepH && hp.sleepH) d.sleepH = hp.sleepH
    if (d.age === DEF.age && hp.age) d.age = hp.age
    if (hp.sex) d.g = hp.sex
  } catch { /* ignore */ }
  return d
}

// ── Pillar scoring (0-100 each). Age-adjusted where the evidence says so. ────
interface Pillar {
  id: string; emoji: string; name: string; why: string
  value: number; unit: string; score: number
  target: string; weight: number
}
function pillarsOf(d: LongevityData): Pillar[] {
  const M = d.g === 'M'
  // VO2max: strongest single predictor (Mandsager 2018). Age-adjusted "good".
  const vo2Good = (M ? 46 : 40) - Math.max(0, d.age - 25) * 0.35
  const vo2Score = d.vo2 > 0 ? Math.min(100, (d.vo2 / vo2Good) * 75) : 0
  // Grip: PURE study. Norm ≈ 46kg M / 29kg F young adult.
  const gripNorm = (M ? 46 : 29) - Math.max(0, d.age - 30) * 0.25
  const gripScore = d.grip > 0 ? Math.min(100, (d.grip / gripNorm) * 80) : 0
  // Chair stand 30s (Rikli & Jones): ~25 young, decreasing.
  const chairNorm = 25 - Math.max(0, d.age - 25) * 0.22
  const chairScore = d.chair30 > 0 ? Math.min(100, (d.chair30 / chairNorm) * 80) : 0
  // One-leg balance: 30s+ full marks; <10s red flag (BMJ 2022 flamingo study).
  const balScore = d.balance > 0 ? Math.min(100, (d.balance / 30) * 100) : 0
  // WHR: cardiometabolic shape.
  const whrScore = d.whr > 0 ? Math.max(0, Math.min(100, 100 - Math.max(0, d.whr - (M ? 0.85 : 0.75)) * 400)) : 0
  // RHR: 50-60 optimal.
  const rhrScore = d.rhr > 0 ? Math.max(0, Math.min(100, 100 - Math.max(0, d.rhr - 58) * 3.2 - Math.max(0, 42 - d.rhr) * 3)) : 0
  // Sleep: 7-8.5h sweet spot.
  const sleepScore = d.sleepH > 0 ? Math.max(0, 100 - Math.abs(d.sleepH - 7.75) * 28) : 0
  // Lifestyle bundle.
  let life = 40
  if (d.smoke === 'never') life += 30; else if (d.smoke === 'former') life += 15
  if (d.alcohol === 0) life += 10; else if (d.alcohol === 2) life -= 20
  if (d.protein) life += 7
  if (d.social) life += 7
  if (d.purpose) life += 6
  const lifeScore = Math.max(0, Math.min(100, life))
  return [
    { id: 'vo2', emoji: '🫀', name: 'VO₂max', why: '#1 mortality predictor — elite vs low ≈ 5x risk difference', value: d.vo2, unit: 'ml/kg/min', score: vo2Score, target: `≥${vo2Good.toFixed(0)} for your age`, weight: 0.22 },
    { id: 'grip', emoji: '✊', name: 'Grip Strength', why: 'Every −5kg ≈ +16% mortality risk (PURE)', value: d.grip, unit: 'kg', score: gripScore, target: `≥${gripNorm.toFixed(0)} kg`, weight: 0.13 },
    { id: 'chair', emoji: '🦵', name: 'Leg Strength (Chair Stand 30s)', why: 'Predictor of mobility & independence in old age', value: d.chair30, unit: 'x', score: chairScore, target: `≥${chairNorm.toFixed(0)}x`, weight: 0.13 },
    { id: 'bal', emoji: '🦩', name: 'One-Leg Balance', why: '<10s at age 50+ ≈ 2x 7-yr mortality risk (BMJ)', value: d.balance, unit: 'sec', score: balScore, target: '≥30 sec', weight: 0.1 },
    { id: 'whr', emoji: '📏', name: 'Waist-Hip Ratio', why: 'Visceral fat > BMI for cardiometabolic risk', value: d.whr, unit: '', score: whrScore, target: M ? '≤0.90' : '≤0.85', weight: 0.1 },
    { id: 'rhr', emoji: '❤️', name: 'Resting HR', why: 'Heart efficiency; lowers with Zone 2 training', value: d.rhr, unit: 'bpm', score: rhrScore, target: '50-60 bpm', weight: 0.1 },
    { id: 'sleep', emoji: '😴', name: 'Sleep', why: 'Foundation of cellular & hormonal repair', value: d.sleepH, unit: 'hrs', score: sleepScore, target: '7-8.5 hrs', weight: 0.11 },
    { id: 'life', emoji: '🌱', name: 'Lifestyle & Social', why: 'Smoking, alcohol, protein, social connection, sense of purpose', value: lifeScore, unit: '/100', score: lifeScore, target: 'smoke-free + socially active', weight: 0.11 },
  ]
}

function bioAge(d: LongevityData, score: number): number {
  // Heuristic: composite score 75 ≈ chronological. Each ±10 pts ≈ ∓2.5 yrs.
  let b = d.age - (score - 72) * 0.25
  // Lab sharpening (optional): each marker off-target adds years.
  if (d.hba1c > 0) b += Math.max(0, d.hba1c - 5.4) * 3
  if (d.ldl > 0) b += Math.max(0, d.ldl - 115) * 0.03
  if (d.crp > 0) b += Math.max(0, d.crp - 1) * 1.2
  if (d.sbp > 0) b += Math.max(0, d.sbp - 118) * 0.1
  return Math.max(15, Math.round(b * 10) / 10)
}

// Decade projection: decline per decade untrained vs trained.
function project(current: number, age: number, targetAge: number, declineUntrained: number, declineTrained: number) {
  const decades = Math.max(0, (targetAge - age) / 10)
  return {
    untrained: current * Math.pow(1 - declineUntrained, decades),
    trained: current * Math.pow(1 - declineTrained, decades),
  }
}

// Testing protocol (quarterly field tests + yearly checks).
const PROTOCOL = [
  { id: 'cooper', label: '🏃 Cooper Test 12 min (VO₂max)', freqM: 3, where: 'Field / treadmill — results to Physical Test' },
  { id: 'grip', label: '✊ Handgrip dynamometer', freqM: 3, where: 'Gym / Performance Lab' },
  { id: 'chair', label: '🦵 Chair-stand 30 seconds', freqM: 3, where: 'Home — armless chair' },
  { id: 'balance', label: '🦩 One-leg stand (eyes open & closed)', freqM: 3, where: 'Home' },
  { id: 'body', label: '📏 Waist-hip circumference + weight', freqM: 1, where: 'Home — to Body Composition' },
  { id: 'bp', label: '🩺 Blood pressure', freqM: 1, where: 'Home / pharmacy — to VitaPulse' },
  { id: 'lab', label: '🧪 Annual labs: HbA1c, lipids, hsCRP, kidney', freqM: 12, where: 'Clinical laboratory' },
  { id: 'dental', label: '🦷 Dental checkup', freqM: 6, where: 'Dentist — gum inflammation ↔ heart' },
  { id: 'skin', label: '🔎 Age-appropriate skin (cancer) screening', freqM: 12, where: 'Doctor — per national screening schedule' },
]

// Pull the latest device-synced values (Health Profile ← Apple Health/WHOOP
// imports, plus Body Composition measurements) OVER the saved local values, so
// the Longevity Score is always computed from current data, not a stale copy
// from the first visit. Returns which fields changed for the sync note.
function syncFromDevices(cur: LongevityData): { next: LongevityData; changed: string[] } {
  const patch: Partial<LongevityData> = {}
  const changed: string[] = []
  try {
    const hp = JSON.parse(localStorage.getItem('pmd_health_profile') || '{}')
    if (hp.vo2max > 0 && hp.vo2max !== cur.vo2) { patch.vo2 = hp.vo2max; changed.push('VO₂max') }
    if (hp.restingHr > 0 && hp.restingHr !== cur.rhr) { patch.rhr = hp.restingHr; changed.push('Resting HR') }
    if (hp.sleepH > 0 && hp.sleepH !== cur.sleepH) { patch.sleepH = hp.sleepH; changed.push('Sleep') }
    if (hp.age > 0 && hp.age !== cur.age) { patch.age = hp.age; changed.push('Age') }
    if ((hp.sex === 'M' || hp.sex === 'F') && hp.sex !== cur.g) { patch.g = hp.sex; changed.push('Sex') }
  } catch { /* ignore */ }
  try {
    const bc = JSON.parse(localStorage.getItem('pm_bodycomp_v1') || '{}')
    if (bc.waist > 0 && bc.hip > 0) {
      const whr = +(bc.waist / bc.hip).toFixed(2)
      if (whr !== cur.whr) { patch.whr = whr; changed.push('Waist-Hip Ratio') }
    }
  } catch { /* ignore */ }
  return { next: { ...cur, ...patch }, changed }
}

export function Longevity() {
  // Sync device data in the initializer (before first render) so the
  // push-back effect below can never overwrite fresher cache values with a
  // stale localStorage copy — same race fixed on the Body Composition page.
  const [d, setD] = useState<LongevityData>(() => syncFromDevices(load()).next)
  const [syncNote, setSyncNote] = useState('')
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(d)) } catch { /* ignore */ } }, [d])
  // Sync edited biometrics back to the central Health Profile so the whole app agrees.
  useEffect(() => { pushBiometrics({ vo2max: d.vo2, restingHr: d.rhr, sleepH: d.sleepH }) }, [d.vo2, d.rhr, d.sleepH])
  const u = (p: Partial<LongevityData>) => setD((x) => ({ ...x, ...p }))

  function syncNow(silent = false) {
    setD((cur) => {
      const { next, changed } = syncFromDevices(cur)
      if (!silent) setSyncNote(changed.length ? `Updated from your devices: ${changed.join(', ')}.` : 'Already up to date with your device data.')
      return changed.length ? next : cur
    })
  }
  // Re-sync when the tab regains focus (data pushed from a phone or edited on
  // another page shows up without a manual refresh).
  useEffect(() => {
    const onFocus = () => syncNow(true)
    window.addEventListener('focus', onFocus)
    window.addEventListener('panacea:health-updated', onFocus)
    return () => { window.removeEventListener('focus', onFocus); window.removeEventListener('panacea:health-updated', onFocus) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pillars = useMemo(() => pillarsOf(d), [d])
  const filled = pillars.filter((p) => p.score > 0)
  const score = filled.length >= 4
    ? Math.round(filled.reduce((s, p) => s + p.score * p.weight, 0) / filled.reduce((s, p) => s + p.weight, 0))
    : null
  const bAge = score != null ? bioAge(d, score) : null
  const delta = bAge != null ? bAge - d.age : null

  const vo2Proj60 = d.vo2 > 0 ? project(d.vo2, d.age, 60, 0.10, 0.05) : null
  const vo2Proj80 = d.vo2 > 0 ? project(d.vo2, d.age, 80, 0.10, 0.05) : null
  const gripProj80 = d.grip > 0 ? project(d.grip, Math.max(d.age, 30), 80, 0.15, 0.07) : null

  const scoreColor = score == null ? '#a3a3a3' : score >= 75 ? '#00BF63' : score >= 55 ? '#f59e0b' : '#ef4444'

  const HEALTH_FIELD: Partial<Record<keyof LongevityData, 'vo2max' | 'restingHr' | 'sleepH'>> = { vo2: 'vo2max', rhr: 'restingHr', sleepH: 'sleepH' }
  const num = (label: string, key: keyof LongevityData, step = 1, ph = '') => {
    const hf = HEALTH_FIELD[key]
    return (
      <Field label={<>{label}<PrefillBadge show={!!hf && hasHealth(hf)} /></>}>
        <input className={inputClass} type="number" step={step} placeholder={ph}
          value={(d[key] as number) || ''} onChange={(e) => u({ [key]: +e.target.value } as Partial<LongevityData>)} />
      </Field>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      {/* Hero */}
      {score != null && bAge != null && (
        <div className="flex justify-end">
          <ShareStatCard
            activity="❤️ Longevity Center"
            metricLabel="Longevity Score"
            metricValue={String(score)}
            badge={delta != null ? (delta <= 0 ? `${Math.abs(delta).toFixed(1)} yrs younger` : `${delta.toFixed(1)} yrs older`) : undefined}
            secondary={`Biological Age (est.) ${bAge} yrs vs chronological age ${d.age}`}
          />
        </div>
      )}
      <Card className="!p-5">
        <SectionTitle
          icon={<IconHeart size={20} />}
          title="Longevity Center"
          subtitle="Your watch scores your day — this page scores your decade. VO₂max, resting HR, sleep & WHR auto-update from your Health Profile (Apple Health / WHOOP) and Body Composition."
          right={<button onClick={() => syncNow(false)} className="shrink-0 rounded-full border border-brand/30 bg-brand-50 px-3 py-1.5 text-[11px] font-bold text-brand-dark active:scale-95">🔄 Sync devices</button>}
        />
        {syncNote && <p className="mt-2 rounded-xl bg-brand-50 px-3 py-2 text-[11px] font-semibold text-brand-dark">{syncNote}</p>}
        <div className="mt-2 flex items-center justify-around">
          <div className="text-center">
            <div className="relative mx-auto" style={{ width: 130, height: 130 }}>
              <svg width="130" height="130" className="-rotate-90">
                <circle cx="65" cy="65" r="56" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="10" />
                <circle cx="65" cy="65" r="56" fill="none" stroke={scoreColor} strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 56} strokeDashoffset={2 * Math.PI * 56 * (1 - (score ?? 0) / 100)}
                  style={{ transition: 'stroke-dashoffset 0.8s ease', filter: `drop-shadow(0 0 8px ${scoreColor}55)` }} />
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <div>
                  <div className="text-4xl font-extrabold" style={{ color: scoreColor }}>{score ?? '—'}</div>
                  <div className="text-[8px] font-bold uppercase tracking-widest text-neutral-400">Longevity Score</div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Biological Age (est.)</div>
            <div className="text-4xl font-extrabold text-ink">{bAge ?? '—'}<span className="text-sm text-neutral-400"> yrs</span></div>
            {delta != null && (
              <Badge tone={delta <= 0 ? 'brand' : 'critical'}>
                {delta <= 0 ? `${Math.abs(delta).toFixed(1)} yrs younger 🎉` : `${delta.toFixed(1)} yrs older`}
              </Badge>
            )}
            <div className="mt-1 text-[9px] text-neutral-400">vs chronological age {d.age}</div>
          </div>
        </div>
        {score == null && <p className="mt-3 text-center text-[11px] text-neutral-400">Fill in at least 4 pillars below to activate your score & biological age.</p>}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Age"><input className={inputClass} type="number" value={d.age} onChange={(e) => u({ age: +e.target.value })} /></Field>
          <Field label="Sex">
            <select className={inputClass} value={d.g} onChange={(e) => u({ g: e.target.value as 'M' | 'F' })}>
              <option value="M">Male</option><option value="F">Female</option>
            </select>
          </Field>
        </div>
      </Card>

      {/* Pillars */}
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="8 Longevity Pillars" subtitle="Validated long-term predictors — weighted by strength of evidence" />
        <div className="mt-2 grid grid-cols-2 gap-3">
          {num('VO₂max (ml/kg/min)', 'vo2', 0.1)}
          {num('Best grip (kg)', 'grip', 0.5)}
          {num('Chair-stand 30 sec (x)', 'chair30')}
          {num('One-leg balance (sec)', 'balance')}
          {num('Waist-Hip Ratio', 'whr', 0.01, 'e.g. 0.85')}
          {num('Resting HR (bpm)', 'rhr')}
          {num('Average sleep (hrs)', 'sleepH', 0.1)}
          <Field label="Smoking">
            <select className={inputClass} value={d.smoke} onChange={(e) => u({ smoke: e.target.value as LongevityData['smoke'] })}>
              <option value="never">Never</option><option value="former">Quit</option><option value="current">Still smoking</option>
            </select>
          </Field>
          <Field label="Alcohol">
            <select className={inputClass} value={d.alcohol} onChange={(e) => u({ alcohol: +e.target.value as LongevityData['alcohol'] })}>
              <option value={0}>None</option><option value={1}>Occasional</option><option value={2}>Frequent</option>
            </select>
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {([['protein', '🥩 Protein ≥1.6 g/kg/day'], ['social', '🫂 Regular social connection'], ['purpose', '🎯 Has a sense of purpose (ikigai)']] as const).map(([k, l]) => (
            <button key={k} onClick={() => u({ [k]: !d[k] } as Partial<LongevityData>)}
              className={'rounded-full px-3 py-1.5 text-[11px] font-bold ' + (d[k] ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500')}>
              {l}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {pillars.map((p) => (
            <div key={p.id} className="rounded-xl border border-neutral-100 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold">{p.emoji} {p.name}</span>
                <span className={'text-sm font-extrabold ' + (p.score >= 75 ? 'text-brand-dark' : p.score >= 50 ? 'text-amber-600' : p.score > 0 ? 'text-rose-500' : 'text-neutral-300')}>
                  {p.score > 0 ? Math.round(p.score) : '—'}
                </span>
              </div>
              <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${p.score}%`, background: p.score >= 75 ? '#00BF63' : p.score >= 50 ? '#f59e0b' : '#ef4444' }} />
              </div>
              <div className="mt-1 flex justify-between text-[9px] text-neutral-400">
                <span>{p.why}</span>
                <span className="shrink-0 font-bold">target {p.target}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Decade projection */}
      <Card className="!p-5">
        <SectionTitle icon={<IconChartUp size={20} />} title="Decade Projection — Train the You at 80" subtitle="Untrained: VO₂max −10%/decade, muscle −8%/decade after 30. Trained: half that." />
        {vo2Proj60 && vo2Proj80 ? (
          <div className="mt-2 space-y-3">
            <div className="rounded-2xl bg-ink p-4 text-white">
              <div className="text-xs font-bold text-white/60">Your VO₂max is {d.vo2} now →</div>
              <div className="mt-2 grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="text-[10px] uppercase text-white/50">Age 60</div>
                  <div className="text-lg font-extrabold"><span className="text-rose-400">{vo2Proj60.untrained.toFixed(0)}</span> vs <span className="text-brand">{vo2Proj60.trained.toFixed(0)}</span></div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-white/50">Age 80</div>
                  <div className="text-lg font-extrabold"><span className="text-rose-400">{vo2Proj80.untrained.toFixed(0)}</span> vs <span className="text-brand">{vo2Proj80.trained.toFixed(0)}</span></div>
                </div>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-white/70">
                Independence threshold ≈18 (climbing stairs, carrying groceries). {vo2Proj80.untrained < 18 ? '⚠️ Without training, you are projected to fall BELOW the independence threshold by age 80 — the trained path keeps you above it.' : 'Both paths stay above the threshold — keep it up.'}
                {' '}Red = untrained · Green = trained regularly.
              </p>
            </div>
            {gripProj80 && (
              <div className="rounded-xl border border-neutral-100 p-3 text-[11px] text-neutral-600">
                ✊ Grip {d.grip}kg → age 80: <b className="text-rose-500">{gripProj80.untrained.toFixed(0)}kg</b> untrained vs <b className="text-brand-dark">{gripProj80.trained.toFixed(0)}kg</b> trained.
                Safe jar-opening/grip threshold ≈16-20kg.
              </div>
            )}
          </div>
        ) : <p className="mt-2 text-[11px] text-neutral-400">Fill in VO₂max (and grip) to see your projection at ages 60 & 80.</p>}
      </Card>

      {/* Lab sharpening */}
      <Card className="!p-5">
        <SectionTitle icon={<span className="text-lg">🧪</span>} title="Lab Sharpening (optional)" subtitle="Fill in from your annual lab results — for a more accurate biological age" />
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {num('HbA1c (%)', 'hba1c', 0.1, '<5.4')}
          {num('LDL (mg/dL)', 'ldl', 1, '<115')}
          {num('hsCRP (mg/L)', 'crp', 0.1, '<1')}
          {num('Systolic (mmHg)', 'sbp', 1, '<118')}
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-neutral-400">
          Markers above target add to your biological age (a heuristic inspired by PhenoAge — not a substitute for medical judgment).
          Discuss your lab results with your doctor; the <a href="#/chatbot" className="font-bold text-brand-dark underline">AI Consultation</a> feature can help you prepare questions.
        </p>
      </Card>

      {/* Testing protocol */}
      <Card className="!p-5">
        <SectionTitle icon={<IconTimer size={20} />} title="Periodic Testing Protocol" subtitle="What gets measured gets improved — mark each one as done" />
        <div className="mt-2 space-y-2">
          {PROTOCOL.map((p) => {
            const last = d.tests[p.id]
            const dueMs = last ? new Date(last).getTime() + p.freqM * 30.4 * 86400000 : 0
            const overdue = !last || Date.now() > dueMs
            const dueTxt = last
              ? overdue ? 'OVERDUE' : `next ${new Date(dueMs).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`
              : 'never done'
            return (
              <div key={p.id} className="flex items-center gap-2 rounded-xl border border-neutral-100 p-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold">{p.label}</div>
                  <div className="text-[10px] text-neutral-400">every {p.freqM} mo · {p.where}</div>
                </div>
                <Badge tone={overdue ? 'critical' : 'brand'}>{dueTxt}</Badge>
                <button onClick={() => u({ tests: { ...d.tests, [p.id]: new Date().toISOString() } })}
                  className="shrink-0 rounded-full bg-brand px-3 py-1.5 text-[10px] font-bold text-white active:scale-95">✓ Done</button>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="rounded-2xl border border-brand/20 bg-brand-50 p-4 text-center text-xs leading-relaxed text-brand-dark">
        This page is a <b>complement</b> to your watch: Apple Watch/WHOOP answers "how was today?" —
        the Longevity Center answers "how will 30 years from now be?". Daily execution:
        {' '}<a href="#/readiness" className="font-bold underline">Recovery & Strain</a> ·
        {' '}<a href="#/training-plan" className="font-bold underline">AI Program</a> ·
        {' '}<a href="#/body" className="font-bold underline">Body Composition</a>.
        <br /><span className="text-[10px] opacity-70">References: Mandsager 2018 (JAMA), PURE study (grip), BMJ 2022 (flamingo balance), Rikli & Jones, Attia — Outlive. Educational estimate, not a diagnosis.</span>
      </div>
    </div>
  )
}

export default Longevity
