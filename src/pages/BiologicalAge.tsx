import { useEffect, useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconHeart, IconActivity, IconChartUp } from '../components/icons'
import { getHealthCache, getDemo, pushBiometrics } from '../lib/profile'

// ─────────────────────────────────────────────────────────────────────────────
// Biological & Metabolic Age — estimates how old your body "acts" versus your
// birthday, from the device & lab data the app already holds. Two independent,
// transparent estimates so the user sees the reasoning, not a black box:
//
//   • Metabolic Age — compares your resting metabolic rate (Mifflin-St Jeor,
//     from weight/height/sex) against the population-average RMR for each age,
//     answering "at what age is the average RMR equal to mine?"
//   • Fitness/Biomarker Age — a transparent points model in the direction of
//     the published evidence (VO2max is the strongest mortality predictor —
//     Mandsager 2018; plus resting HR, HRV, sleep, waist-hip ratio, blood
//     pressure, HbA1c, and smoking). Each marker nudges biological age up or
//     down from chronological age. NOT a validated clinical clock — an
//     educational estimate to show what moves the needle.
//
// Everything auto-fills from the Health Profile / Body Composition; nothing is
// sent anywhere. Same before-first-render device sync as the other pages.
// ─────────────────────────────────────────────────────────────────────────────

interface BioData {
  age: number; sex: 'M' | 'F'; weightKg: number; heightCm: number
  vo2: number; rhr: number; hrv: number; sleepH: number
  waist: number; hip: number
  sbp: number; hba1c: number
  smoker: 'never' | 'former' | 'current'
}

const DEF: BioData = {
  age: 0, sex: 'M', weightKg: 0, heightCm: 0,
  vo2: 0, rhr: 0, hrv: 0, sleepH: 0, waist: 0, hip: 0, sbp: 0, hba1c: 0, smoker: 'never',
}
const KEY = 'pmd_bioage_v1'

function num(obj: Record<string, unknown>, k: string): number | undefined {
  return typeof obj[k] === 'number' && (obj[k] as number) > 0 ? (obj[k] as number) : undefined
}

function syncFromDevices(cur: BioData): { next: BioData; changed: string[] } {
  const patch: Partial<BioData> = {}
  const changed: string[] = []
  const demo = getDemo()
  if (demo.age > 0 && cur.age === 0) { patch.age = demo.age; changed.push('Age') }
  if ((demo.sex === 'M' || demo.sex === 'F') && cur.age === 0) patch.sex = demo.sex
  if (demo.weightKg > 0 && !cur.weightKg) { patch.weightKg = demo.weightKg; changed.push('Weight') }
  if (demo.heightCm > 0 && !cur.heightCm) { patch.heightCm = demo.heightCm; changed.push('Height') }
  const hc = getHealthCache() as Record<string, unknown>
  const vo2 = num(hc, 'vo2max'); if (vo2 && vo2 !== cur.vo2) { patch.vo2 = vo2; changed.push('VO₂max') }
  const rhr = num(hc, 'restingHr'); if (rhr && rhr !== cur.rhr) { patch.rhr = rhr; changed.push('Resting HR') }
  const hrv = num(hc, 'hrvMs'); if (hrv && hrv !== cur.hrv) { patch.hrv = hrv; changed.push('HRV') }
  const sleep = num(hc, 'sleepH'); if (sleep && sleep !== cur.sleepH) { patch.sleepH = sleep; changed.push('Sleep') }
  try {
    const bc = JSON.parse(localStorage.getItem('pm_bodycomp_v1') || '{}')
    if (bc.waist > 0 && !cur.waist) { patch.waist = bc.waist; changed.push('Waist') }
    if (bc.hip > 0 && !cur.hip) { patch.hip = bc.hip; changed.push('Hip') }
  } catch { /* ignore */ }
  return { next: { ...cur, ...patch }, changed }
}

function load(): BioData {
  let d: BioData = { ...DEF }
  try { d = { ...DEF, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { /* ignore */ }
  return d
}

// Mifflin-St Jeor RMR.
function rmr(w: number, h: number, age: number, sex: 'M' | 'F'): number {
  return 10 * w + 6.25 * h - 5 * age + (sex === 'M' ? 5 : -161)
}

// Metabolic age: find the age at which the average person's RMR equals yours,
// holding your weight/height/sex constant. Higher RMR → younger metabolic age.
function metabolicAge(d: BioData): number | null {
  if (!(d.weightKg > 0 && d.heightCm > 0)) return null
  const mine = rmr(d.weightKg, d.heightCm, d.age || 30, d.sex)
  // RMR drops ~5 kcal/yr of age in this model; invert to an age.
  // Reference RMR at age 20 for this body, then step forward until it matches.
  let best = 18
  let bestDiff = Infinity
  for (let a = 18; a <= 90; a++) {
    const ref = rmr(d.weightKg, d.heightCm, a, d.sex)
    const diff = Math.abs(ref - mine)
    if (diff < bestDiff) { bestDiff = diff; best = a }
  }
  return best
}

interface Marker { label: string; delta: number; note: string }

// Transparent points model: each marker shifts biological age up/down (years).
function bioMarkers(d: BioData): Marker[] {
  const M = d.sex === 'M'
  const out: Marker[] = []
  if (d.vo2 > 0) {
    const good = (M ? 46 : 40) - Math.max(0, d.age - 25) * 0.35
    const delta = -((d.vo2 - good) * 0.35) // above age-norm → younger
    out.push({ label: 'VO₂max', delta, note: `${d.vo2} vs age-norm ${good.toFixed(0)} — strongest mortality predictor` })
  }
  if (d.rhr > 0) {
    const delta = Math.max(0, d.rhr - 60) * 0.15 - Math.max(0, 55 - d.rhr) * 0.1
    out.push({ label: 'Resting HR', delta, note: `${d.rhr} bpm — lower is better (50–60 optimal)` })
  }
  if (d.hrv > 0) {
    const delta = -((d.hrv - 45) * 0.05)
    out.push({ label: 'HRV', delta, note: `${d.hrv} ms — higher reflects better autonomic recovery` })
  }
  if (d.sleepH > 0) {
    const delta = Math.abs(d.sleepH - 7.75) * 0.6
    out.push({ label: 'Sleep', delta, note: `${d.sleepH}h — 7–8.5h sweet spot` })
  }
  if (d.waist > 0 && d.hip > 0) {
    const whr = d.waist / d.hip
    const ideal = M ? 0.9 : 0.8
    const delta = Math.max(0, whr - ideal) * 25
    out.push({ label: 'Waist-Hip Ratio', delta, note: `${whr.toFixed(2)} — visceral-fat / cardiometabolic marker` })
  }
  if (d.sbp > 0) {
    const delta = Math.max(0, d.sbp - 120) * 0.08 - Math.max(0, 110 - d.sbp) * 0.03
    out.push({ label: 'Systolic BP', delta, note: `${d.sbp} mmHg — <120 optimal` })
  }
  if (d.hba1c > 0) {
    const delta = Math.max(0, d.hba1c - 5.4) * 3
    out.push({ label: 'HbA1c', delta, note: `${d.hba1c}% — glycemic control (<5.7% normal)` })
  }
  if (d.smoker !== 'never') {
    out.push({ label: 'Smoking', delta: d.smoker === 'current' ? 6 : 2, note: d.smoker === 'current' ? 'Current smoker' : 'Former smoker' })
  }
  return out
}

export function BiologicalAge() {
  const [d, setD] = useState<BioData>(() => syncFromDevices(load()).next)
  const [syncNote, setSyncNote] = useState('')
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(d)) } catch { /* ignore */ } }, [d])
  useEffect(() => { pushBiometrics({ vo2max: d.vo2, restingHr: d.rhr, hrvMs: d.hrv, sleepH: d.sleepH, weightKg: d.weightKg }) }, [d.vo2, d.rhr, d.hrv, d.sleepH, d.weightKg])
  const u = (p: Partial<BioData>) => setD((x) => ({ ...x, ...p }))

  function syncNow(silent = false) {
    setD((cur) => {
      const { next, changed } = syncFromDevices(cur)
      if (!silent) setSyncNote(changed.length ? `Updated from your devices: ${changed.join(', ')}.` : 'Already up to date with your device data.')
      return changed.length ? next : cur
    })
  }
  useEffect(() => {
    const onFocus = () => syncNow(true)
    window.addEventListener('focus', onFocus)
    window.addEventListener('panacea:health-updated', onFocus)
    return () => { window.removeEventListener('focus', onFocus); window.removeEventListener('panacea:health-updated', onFocus) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const markers = useMemo(() => bioMarkers(d), [d])
  const metAge = useMemo(() => metabolicAge(d), [d])
  const bioAge = useMemo(() => {
    if (d.age <= 0 || markers.length < 3) return null
    const shift = markers.reduce((s, m) => s + m.delta, 0)
    return Math.max(18, Math.round((d.age + shift) * 10) / 10)
  }, [d.age, markers])

  const bioDelta = bioAge != null && d.age > 0 ? +(bioAge - d.age).toFixed(1) : null
  const bioColor = bioDelta == null ? '#a3a3a3' : bioDelta <= -1 ? '#00BF63' : bioDelta <= 1 ? '#f59e0b' : '#ef4444'

  const field = (label: string, key: keyof BioData, step = 1) => (
    <Field label={label}>
      <input className={inputClass} type="number" step={step} value={(d[key] as number) || ''} onChange={(e) => u({ [key]: +e.target.value } as Partial<BioData>)} />
    </Field>
  )

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle
          icon={<IconHeart size={20} />}
          title="Biological & Metabolic Age"
          subtitle="How old your body acts vs your birthday — estimated transparently from your device & lab data."
          right={<button onClick={() => syncNow(false)} className="shrink-0 rounded-full border border-brand/30 bg-brand-50 px-3 py-1.5 text-[11px] font-bold text-brand-dark active:scale-95">🔄 Sync devices</button>}
        />
        {syncNote && <p className="mt-2 rounded-xl bg-brand-50 px-3 py-2 text-[11px] font-semibold text-brand-dark">{syncNote}</p>}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-neutral-100 p-4 text-center dark:border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Biological Age</div>
            <div className="text-4xl font-black" style={{ color: bioColor }}>{bioAge ?? '—'}</div>
            {bioDelta != null && (
              <Badge tone={bioDelta <= -1 ? 'brand' : bioDelta <= 1 ? 'low' : 'critical'}>
                {bioDelta <= 0 ? `${Math.abs(bioDelta)} yrs younger` : `${bioDelta} yrs older`}
              </Badge>
            )}
            <div className="mt-1 text-[10px] text-neutral-400">vs chronological {d.age || '—'}</div>
          </div>
          <div className="rounded-2xl border border-neutral-100 p-4 text-center dark:border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Metabolic Age</div>
            <div className="text-4xl font-black text-brand-dark">{metAge ?? '—'}</div>
            <div className="mt-1 text-[10px] text-neutral-400">from resting metabolic rate</div>
          </div>
        </div>
      </Card>

      {/* Inputs */}
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Your Numbers" subtitle="Most auto-fill from Health Profile & Body Composition — add labs if you have them" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {field('Age', 'age')}
          <Field label="Sex">
            <select className={inputClass} value={d.sex} onChange={(e) => u({ sex: e.target.value as 'M' | 'F' })}>
              <option value="M">Male</option><option value="F">Female</option>
            </select>
          </Field>
          {field('Weight (kg)', 'weightKg', 0.1)}
          {field('Height (cm)', 'heightCm')}
          {field('VO₂max', 'vo2', 0.1)}
          {field('Resting HR', 'rhr')}
          {field('HRV (ms)', 'hrv')}
          {field('Sleep (hrs)', 'sleepH', 0.1)}
          {field('Waist (cm)', 'waist')}
          {field('Hip (cm)', 'hip')}
          {field('Systolic BP', 'sbp')}
          {field('HbA1c (%)', 'hba1c', 0.1)}
          <Field label="Smoking">
            <select className={inputClass} value={d.smoker} onChange={(e) => u({ smoker: e.target.value as BioData['smoker'] })}>
              <option value="never">Never</option><option value="former">Former</option><option value="current">Current</option>
            </select>
          </Field>
        </div>
      </Card>

      {/* Contributing markers */}
      {markers.length > 0 && (
        <Card className="!p-5">
          <SectionTitle icon={<IconChartUp size={20} />} title="What's moving your age" subtitle="Each marker shifts your biological age up or down (years)" />
          <div className="mt-3 space-y-2">
            {markers.map((m) => (
              <div key={m.label} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 p-3 dark:border-white/10">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-ink dark:text-white">{m.label}</div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400">{m.note}</div>
                </div>
                <Badge tone={m.delta <= -0.3 ? 'brand' : m.delta <= 0.3 ? 'low' : 'critical'}>
                  {m.delta <= 0 ? '−' : '+'}{Math.abs(m.delta).toFixed(1)} yr
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Educational estimate from transparent, published-evidence-direction formulas (Mifflin-St Jeor, VO₂max mortality data, standard risk markers) — <b>not</b> a validated clinical biological-age clock or a diagnosis. Data stays on your device. For a true epigenetic age, use a laboratory DNA-methylation test.
      </div>
    </div>
  )
}

export default BiologicalAge
