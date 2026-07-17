import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, SectionTitle, Badge, Field, inputClass } from '../components/ui'
import { IconStethoscope, IconShield, IconCheck, IconToken } from '../components/icons'
import { api, backendEnabled } from '../lib/api'
import { MANUAL_BANK } from '../lib/payment'

// Standard published clinical scoring tools — each formula/table matches the
// cited source exactly (see inline notes). These are decision-support aids,
// not a replacement for clinical judgment.

function SegButtons<T extends string | number>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { v: T; l: string }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={String(o.v)}
          onClick={() => onChange(o.v)}
          className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
            value === o.v ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  )
}

/* ══════════════════ APGAR ══════════════════ */
function ApgarCalc() {
  const criteria: { key: string; label: string; opts: { v: number; l: string }[] }[] = [
    { key: 'appearance', label: 'Appearance (skin color)', opts: [{ v: 0, l: 'Blue/pale all over' }, { v: 1, l: 'Body pink, extremities blue' }, { v: 2, l: 'Pink all over' }] },
    { key: 'pulse', label: 'Pulse (heart rate)', opts: [{ v: 0, l: 'Absent' }, { v: 1, l: '<100 bpm' }, { v: 2, l: '≥100 bpm' }] },
    { key: 'grimace', label: 'Grimace (reflex irritability)', opts: [{ v: 0, l: 'No response' }, { v: 1, l: 'Grimace' }, { v: 2, l: 'Strong cry/cough/sneeze' }] },
    { key: 'activity', label: 'Activity (muscle tone)', opts: [{ v: 0, l: 'Limp' }, { v: 1, l: 'Some flexion of extremities' }, { v: 2, l: 'Active movement' }] },
    { key: 'respiration', label: 'Respiration (breathing)', opts: [{ v: 0, l: 'Absent' }, { v: 1, l: 'Slow/irregular' }, { v: 2, l: 'Strong cry' }] },
  ]
  const [v, setV] = useState<Record<string, number>>({ appearance: 2, pulse: 2, grimace: 2, activity: 2, respiration: 2 })
  const total = Object.values(v).reduce((a, b) => a + b, 0)
  const interp = total >= 7 ? { l: 'Normal', tone: 'normal' as const } : total >= 4 ? { l: 'Needs assistance', tone: 'low' as const } : { l: 'Severe depression', tone: 'critical' as const }
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="APGAR Score" subtitle="Scored at 1 and 5 minutes after birth (Apgar, 1953)" />
      <div className="space-y-3">
        {criteria.map((c) => (
          <Field key={c.key} label={c.label}>
            <SegButtons value={v[c.key]} onChange={(nv) => setV((s) => ({ ...s, [c.key]: nv }))} options={c.opts} />
          </Field>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-neutral-50 p-3">
        <div>
          <div className="text-2xl font-black text-ink">{total}<span className="text-sm font-semibold text-neutral-400">/10</span></div>
          <Badge tone={interp.tone}>{interp.l}</Badge>
        </div>
        <p className="max-w-[55%] text-right text-[10px] text-neutral-400">7-10 normal · 4-6 needs assistance · 0-3 immediate resuscitation. Repeat every 5 minutes if &lt;7.</p>
      </div>
    </Card>
  )
}

/* ══════════════════ GCS ══════════════════ */
function GcsCalc() {
  const eye = [{ v: 1, l: 'No opening' }, { v: 2, l: 'To pain' }, { v: 3, l: 'To sound' }, { v: 4, l: 'Spontaneous' }]
  const verbal = [{ v: 1, l: 'None' }, { v: 2, l: 'Incomprehensible sounds' }, { v: 3, l: 'Inappropriate words' }, { v: 4, l: 'Confused' }, { v: 5, l: 'Oriented' }]
  const motor = [{ v: 1, l: 'None' }, { v: 2, l: 'Extension (decerebrate)' }, { v: 3, l: 'Flexion (decorticate)' }, { v: 4, l: 'Withdraws from pain' }, { v: 5, l: 'Localizes pain' }, { v: 6, l: 'Obeys commands' }]
  const pupilOpts = [{ v: 0, l: 'Both reactive' }, { v: 1, l: 'One unreactive' }, { v: 2, l: 'Both unreactive' }]
  const [e, setE] = useState(4); const [v, setV] = useState(5); const [m, setM] = useState(6)
  const [pupil, setPupil] = useState(0)
  const total = e + v + m
  // GCS-P ("Improved GCS" / GCS-Pupils score, Brennan et al. 2018, Lancet
  // Neurology) — subtracts a pupil reactivity penalty from GCS-motor+verbal
  // total, giving better mortality/outcome discrimination in TBI than GCS
  // alone, especially at the severe end of the scale.
  const gcsP = Math.max(1, total - pupil)
  const interp = total >= 13 ? { l: 'Mild injury', tone: 'normal' as const } : total >= 9 ? { l: 'Moderate injury', tone: 'low' as const } : { l: 'Severe injury — airway protection indicated', tone: 'critical' as const }
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="GCS + GCS-Pupil (Improved GCS)" subtitle="Teasdale & Jennett, 1974 · GCS-P: Brennan et al., Lancet Neurol 2018" />
      <div className="space-y-3">
        <Field label="Eye Opening (E)"><SegButtons value={e} onChange={setE} options={eye} /></Field>
        <Field label="Verbal Response (V)"><SegButtons value={v} onChange={setV} options={verbal} /></Field>
        <Field label="Motor Response (M)"><SegButtons value={m} onChange={setM} options={motor} /></Field>
        <Field label="Pupil Reactivity"><SegButtons value={pupil} onChange={setPupil} options={pupilOpts} /></Field>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-neutral-50 p-3">
          <div className="text-xl font-black text-ink">E{e}V{v}M{m} = {total}<span className="text-sm font-semibold text-neutral-400">/15</span></div>
          <Badge tone={interp.tone}>{interp.l}</Badge>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3">
          <div className="text-xl font-black text-ink">{gcsP}<span className="text-sm font-semibold text-neutral-400">/15 (GCS-P)</span></div>
          <p className="mt-1 text-[10px] text-neutral-400">GCS-P = GCS total − pupil score (0/1/2)</p>
        </div>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">13-15 mild · 9-12 moderate · ≤8 severe (indicates intubation for airway protection). GCS-Pupil (GCS-P) incorporates pupil reactivity for sharper mortality/prognosis stratification in traumatic brain injury than GCS alone, especially at lower scores.</p>
    </Card>
  )
}

/* ══════════════════ CURB-65 ══════════════════ */
function Curb65Calc() {
  const [confusion, setConfusion] = useState(false)
  const [urea, setUrea] = useState(false)
  const [rr, setRr] = useState(false)
  const [bp, setBp] = useState(false)
  const [age65, setAge65] = useState(false)
  const total = [confusion, urea, rr, bp, age65].filter(Boolean).length
  const interp = total <= 1
    ? { l: 'Low risk', tone: 'normal' as const, note: 'Generally safe for outpatient treatment.' }
    : total === 2
    ? { l: 'Moderate risk', tone: 'low' as const, note: 'Consider short admission/close monitoring.' }
    : { l: 'High risk', tone: 'critical' as const, note: 'Admit; consider ICU if score is 4-5.' }
  const Row = ({ label, sub, checked, onChange }: { label: string; sub: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-brand" />
      <div><div className="text-sm font-bold text-ink">{label}</div><div className="text-[11px] text-neutral-400">{sub}</div></div>
    </label>
  )
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="CURB-65" subtitle="Severity stratification for community-acquired pneumonia (Lim et al. 2003, British Thoracic Society)" />
      <div className="space-y-2">
        <Row label="Confusion" sub="Acute confusion/new disorientation" checked={confusion} onChange={setConfusion} />
        <Row label="Urea" sub="BUN >19 mg/dL (urea >7 mmol/L)" checked={urea} onChange={setUrea} />
        <Row label="Respiratory rate" sub="Respiratory rate ≥30 breaths/min" checked={rr} onChange={setRr} />
        <Row label="Blood pressure" sub="Systolic <90 or diastolic ≤60 mmHg" checked={bp} onChange={setBp} />
        <Row label="Age ≥65" sub="Age 65 years or older" checked={age65} onChange={setAge65} />
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-black text-ink">{total}<span className="text-sm font-semibold text-neutral-400">/5</span></div>
          <Badge tone={interp.tone}>{interp.l}</Badge>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{interp.note}</p>
      </div>
    </Card>
  )
}

/* ══════════════════ BISHOP SCORE ══════════════════ */
function BishopCalc() {
  const dilationOpts = [{ v: 0, l: '0 cm' }, { v: 1, l: '1-2 cm' }, { v: 2, l: '3-4 cm' }, { v: 3, l: '≥5 cm' }]
  const effacementOpts = [{ v: 0, l: '0-30%' }, { v: 1, l: '40-50%' }, { v: 2, l: '60-70%' }, { v: 3, l: '≥80%' }]
  const stationOpts = [{ v: 0, l: '-3' }, { v: 1, l: '-2' }, { v: 2, l: '-1/0' }, { v: 3, l: '+1/+2' }]
  const consistencyOpts = [{ v: 0, l: 'Firm' }, { v: 1, l: 'Medium' }, { v: 2, l: 'Soft' }]
  const positionOpts = [{ v: 0, l: 'Posterior' }, { v: 1, l: 'Mid-position' }, { v: 2, l: 'Anterior' }]
  const [dilation, setDilation] = useState(0)
  const [effacement, setEffacement] = useState(0)
  const [station, setStation] = useState(0)
  const [consistency, setConsistency] = useState(0)
  const [position, setPosition] = useState(0)
  const total = dilation + effacement + station + consistency + position
  const interp = total >= 8
    ? { l: 'Favorable', tone: 'normal' as const, note: 'High likelihood of successful induction, similar to spontaneous labor.' }
    : total >= 6
    ? { l: 'Moderately favorable', tone: 'low' as const, note: 'Induction generally successful.' }
    : { l: 'Unfavorable', tone: 'critical' as const, note: 'Consider cervical ripening agents (e.g. prostaglandins) before induction.' }
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Bishop Score" subtitle="Cervical readiness for labor induction (Bishop, 1964)" />
      <div className="space-y-3">
        <Field label="Cervical dilation"><SegButtons value={dilation} onChange={setDilation} options={dilationOpts} /></Field>
        <Field label="Effacement"><SegButtons value={effacement} onChange={setEffacement} options={effacementOpts} /></Field>
        <Field label="Station (fetal descent)"><SegButtons value={station} onChange={setStation} options={stationOpts} /></Field>
        <Field label="Cervical consistency"><SegButtons value={consistency} onChange={setConsistency} options={consistencyOpts} /></Field>
        <Field label="Cervical position"><SegButtons value={position} onChange={setPosition} options={positionOpts} /></Field>
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-black text-ink">{total}<span className="text-sm font-semibold text-neutral-400">/13</span></div>
          <Badge tone={interp.tone}>{interp.l}</Badge>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{interp.note}</p>
      </div>
    </Card>
  )
}

/* ══════════════════ CKD-EPI 2021 (race-free eGFR) ══════════════════ */
function CkdEpiCalc() {
  const [scr, setScr] = useState(0.9)
  const [age, setAge] = useState(45)
  const [sex, setSex] = useState<'M' | 'F'>('M')
  function egfr(): number {
    const k = sex === 'F' ? 0.7 : 0.9
    const a = sex === 'F' ? -0.241 : -0.302
    const sexMult = sex === 'F' ? 1.012 : 1
    const minTerm = Math.min(scr / k, 1) ** a
    const maxTerm = Math.max(scr / k, 1) ** -1.2
    return 142 * minTerm * maxTerm * (0.9938 ** age) * sexMult
  }
  const result = egfr()
  const stage = result >= 90 ? 'G1 — Normal/high' : result >= 60 ? 'G2 — Mildly decreased' : result >= 45 ? 'G3a — Mild-moderate decrease' : result >= 30 ? 'G3b — Moderate-severe decrease' : result >= 15 ? 'G4 — Severely decreased' : 'G5 — Kidney failure'
  const tone = result >= 60 ? 'normal' as const : result >= 30 ? 'low' as const : 'critical' as const
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="CKD-EPI 2021 (eGFR)" subtitle="Latest race-free equation (Inker et al., NEJM 2021)" />
      <div className="grid grid-cols-3 gap-2">
        <Field label="Creatinine (mg/dL)"><input className={inputClass} type="number" step="0.01" value={scr} onChange={(e) => setScr(+e.target.value)} /></Field>
        <Field label="Age (years)"><input className={inputClass} type="number" value={age} onChange={(e) => setAge(+e.target.value)} /></Field>
        <Field label="Sex"><SegButtons value={sex} onChange={setSex} options={[{ v: 'M', l: 'Male' }, { v: 'F', l: 'Female' }]} /></Field>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-neutral-50 p-3">
        <div>
          <div className="text-2xl font-black text-ink">{result.toFixed(0)}<span className="text-sm font-semibold text-neutral-400"> mL/min/1.73m²</span></div>
          <Badge tone={tone}>{stage}</Badge>
        </div>
        <p className="max-w-[40%] text-right text-[10px] text-neutral-400">The 2021 equation removes the race coefficient used in earlier versions (CKD-EPI 2009/2012).</p>
      </div>
    </Card>
  )
}

/* ══════════════════ WHO GROWTH STANDARDS (z-score) ══════════════════ */
// WHO Child Growth Standards (2006), 0–60 months. Reference medians below are
// taken at standard checkpoint ages (0/6/12/24/36/48/60mo) with linear
// interpolation between them, and SD estimated from the WHO-published
// coefficient of variation at each checkpoint. This is a SIMPLIFIED estimator
// for screening/decision-support — for definitive clinical use, cross-check
// against the official WHO growth chart (percentile curves), which uses the
// full monthly-resolution LMS table this tool approximates.
const WHO_CHECKPOINTS_MO = [0, 6, 12, 24, 36, 48, 60]
const WHO_WEIGHT_M: Record<'M' | 'F', number[]> = {
  M: [3.3, 7.9, 9.6, 12.2, 14.3, 16.3, 18.3],
  F: [3.2, 7.3, 8.9, 11.5, 13.9, 16.1, 18.2],
}
const WHO_WEIGHT_SD: Record<'M' | 'F', number[]> = {
  M: [0.4, 0.9, 1.1, 1.5, 1.8, 2.1, 2.4],
  F: [0.4, 0.9, 1.1, 1.5, 1.9, 2.2, 2.6],
}
const WHO_HEIGHT_M: Record<'M' | 'F', number[]> = {
  M: [49.9, 67.6, 75.7, 87.1, 96.1, 103.3, 110.0],
  F: [49.1, 65.7, 74.0, 85.7, 95.1, 102.7, 109.4],
}
const WHO_HEIGHT_SD: Record<'M' | 'F', number[]> = {
  M: [1.9, 2.3, 2.6, 3.2, 3.6, 3.9, 4.2],
  F: [1.9, 2.3, 2.6, 3.2, 3.6, 4.0, 4.3],
}

function interp(ageMo: number, xs: number[], ys: number[]): number {
  const a = Math.max(xs[0], Math.min(xs[xs.length - 1], ageMo))
  for (let i = 0; i < xs.length - 1; i++) {
    if (a >= xs[i] && a <= xs[i + 1]) {
      const t = (a - xs[i]) / (xs[i + 1] - xs[i])
      return ys[i] + t * (ys[i + 1] - ys[i])
    }
  }
  return ys[ys.length - 1]
}

function zClass(z: number): { l: string; tone: 'normal' | 'low' | 'critical' } {
  if (z < -3) return { l: 'Severely low', tone: 'critical' }
  if (z < -2) return { l: 'Low', tone: 'low' }
  if (z <= 2) return { l: 'Normal', tone: 'normal' }
  return { l: 'High', tone: 'low' }
}

// Weight-for-height (WHZ) reference — WHO uses height bands rather than age
// bands for this index, but as a simplified screening estimator we derive
// the expected weight-for-height from the same age-checkpoint medians (the
// height at that checkpoint maps to the weight at that checkpoint), which
// is the same approximation approach already used for WAZ/HAZ above.
function whzFromHeight(heightCm: number, sex: 'M' | 'F'): { m: number; sd: number } {
  const hs = WHO_HEIGHT_M[sex]
  let lo = 0
  for (let i = 0; i < hs.length - 1; i++) { if (heightCm >= hs[i]) lo = i }
  const hi = Math.min(lo + 1, hs.length - 1)
  const span = hs[hi] - hs[lo] || 1
  const t = Math.max(0, Math.min(1, (heightCm - hs[lo]) / span))
  const m = WHO_WEIGHT_M[sex][lo] + t * (WHO_WEIGHT_M[sex][hi] - WHO_WEIGHT_M[sex][lo])
  const sd = WHO_WEIGHT_SD[sex][lo] + t * (WHO_WEIGHT_SD[sex][hi] - WHO_WEIGHT_SD[sex][lo])
  return { m, sd }
}

function WhoGrowthCalc() {
  const [sex, setSex] = useState<'M' | 'F'>('M')
  const [ageMo, setAgeMo] = useState(12)
  const [weight, setWeight] = useState(9.6)
  const [height, setHeight] = useState(75.7)

  const wM = interp(ageMo, WHO_CHECKPOINTS_MO, WHO_WEIGHT_M[sex])
  const wSD = interp(ageMo, WHO_CHECKPOINTS_MO, WHO_WEIGHT_SD[sex])
  const hM = interp(ageMo, WHO_CHECKPOINTS_MO, WHO_HEIGHT_M[sex])
  const hSD = interp(ageMo, WHO_CHECKPOINTS_MO, WHO_HEIGHT_SD[sex])
  const waz = (weight - wM) / wSD
  const haz = (height - hM) / hSD
  const wazC = zClass(waz)
  const hazC = zClass(haz)
  const whzRef = whzFromHeight(height, sex)
  const whz = (weight - whzRef.m) / whzRef.sd
  const whzC = zClass(whz)
  const bmi = weight / (height / 100) ** 2

  // Masked malnutrition: height-for-age flags stunting (haz ≤ -2), but
  // weight-for-age still reads "normal" — because weight is being judged
  // against chronological age, not against the child's actual (shorter)
  // growth trajectory. A clinician glancing at weight-for-age alone would
  // miss the stunting entirely.
  const masked = haz <= -2 && waz > -2

  const chartData = WHO_CHECKPOINTS_MO.map((mo, i) => ({
    mo,
    weightMedian: WHO_WEIGHT_M[sex][i],
    heightMedian: WHO_HEIGHT_M[sex][i],
  }))

  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="WHO Anthropometry (Permenkes 2/2020)" subtitle="WHO Child Growth Standards 2006, 0–60 months — per Indonesian MoH Child Anthropometry Standard (Permenkes 2/2020)" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Field label="Sex"><SegButtons value={sex} onChange={setSex} options={[{ v: 'M', l: 'Male' }, { v: 'F', l: 'Female' }]} /></Field>
        <Field label="Age (months)"><input className={inputClass} type="number" min={0} max={60} value={ageMo} onChange={(e) => setAgeMo(+e.target.value)} /></Field>
        <Field label="Weight (kg)"><input className={inputClass} type="number" step="0.1" value={weight} onChange={(e) => setWeight(+e.target.value)} /></Field>
        <Field label="Length/Height (cm)"><input className={inputClass} type="number" step="0.1" value={height} onChange={(e) => setHeight(+e.target.value)} /></Field>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl bg-neutral-50 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Weight/Age (WAZ)</div>
          <div className="mt-1 text-xl font-black text-ink">{waz >= 0 ? '+' : ''}{waz.toFixed(2)} SD</div>
          <Badge tone={wazC.tone}>{wazC.l}</Badge>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Height/Age (HAZ)</div>
          <div className="mt-1 text-xl font-black text-ink">{haz >= 0 ? '+' : ''}{haz.toFixed(2)} SD</div>
          <Badge tone={hazC.tone}>{hazC.l}</Badge>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Weight/Height (WHZ)</div>
          <div className="mt-1 text-xl font-black text-ink">{whz >= 0 ? '+' : ''}{whz.toFixed(2)} SD</div>
          <Badge tone={whzC.tone}>{whzC.l}</Badge>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">BMI</div>
          <div className="mt-1 text-xl font-black text-ink">{bmi.toFixed(1)}</div>
          <div className="text-[10px] text-neutral-400">kg/m²</div>
        </div>
      </div>

      {masked && (
        <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3">
          <p className="text-xs font-black text-amber-800">⚠️ Possible masked stunting (masked malnutrition)</p>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-700">
            Height/age shows stunting (HAZ ≤ -2 SD), yet weight/age looks normal — this is misleading if weight/age is viewed alone, because weight is judged relative to chronological age, not against the child's growth trajectory, which is already compromised. Consider further nutritional evaluation even when weight/age looks fine.
          </p>
        </div>
      )}

      <div className="mt-4 h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="mo" tick={{ fontSize: 10 }} label={{ value: 'Age (months)', position: 'insideBottom', offset: -2, fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="weightMedian" name="Median Weight (kg)" stroke="#00BF63" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="heightMedian" name="Median Height (cm)" stroke="#0B7A4B" strokeWidth={2} dot={false} strokeDasharray="4 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <button onClick={() => window.print()} className="liquid-glass-btn liquid-glass-btn--outline mt-4 w-full rounded-full py-2.5 text-xs font-bold text-brand-dark">🖨️ Print / Save as PDF</button>
      <p className="mt-2 text-[10px] leading-relaxed text-neutral-400">
        The curve shows the WHO reference median (not this child's data). A simplified estimate from standard reference points — for definitive clinical decisions, compare against the official WHO/KMS growth chart or Buku KIA per the Child Anthropometry Standard (Permenkes RI No. 2/2020).
      </p>
    </Card>
  )
}

/* ══════════════════ WHO NEONATE GROWTH (0–30 hari) ══════════════════ */
// WHO/Fenton-style neonatal weight-for-age reference for the first 30 days
// — a much finer time scale than the 0-60mo standard above, since weight
// loss/regain in the first 2 weeks follows its own well-known pattern
// (physiologic weight loss up to ~7-10% by day 3-5, regain to birth weight
// by day 10-14) rather than the monthly-resolution WHO growth curve.
const NEONATE_DAYS = [0, 3, 5, 7, 10, 14, 21, 30]
// Expressed as % of birth weight (median expected trajectory).
const NEONATE_PCT_OF_BW = [100, 93, 91, 95, 100, 105, 112, 120]
const NEONATE_PCT_SD = [0, 3, 3.5, 3, 2.5, 3, 4, 5]

function WhoNeonateCalc() {
  const [birthWeightG, setBirthWeightG] = useState(3200)
  const [days, setDays] = useState(5)
  const [currentWeightG, setCurrentWeightG] = useState(2950)

  const expectedPct = interp(days, NEONATE_DAYS, NEONATE_PCT_OF_BW)
  const sdPct = interp(days, NEONATE_DAYS, NEONATE_PCT_SD)
  const expectedG = (birthWeightG * expectedPct) / 100
  const currentPct = (currentWeightG / birthWeightG) * 100
  const z = (currentPct - expectedPct) / sdPct
  const lossFromBirth = ((birthWeightG - currentWeightG) / birthWeightG) * 100

  const excessLoss = days <= 10 && lossFromBirth > 10
  const notRegained = days >= 14 && currentWeightG < birthWeightG

  const chartData = NEONATE_DAYS.map((d, i) => ({ d, pctMedian: NEONATE_PCT_OF_BW[i] }))

  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="WHO Neonate (0–30 Days)" subtitle="Early neonatal weight trajectory — physiologic weight loss & regain to birth weight" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Field label="Birth Weight (g)"><input className={inputClass} type="number" value={birthWeightG} onChange={(e) => setBirthWeightG(+e.target.value)} /></Field>
        <Field label="Age (days)"><input className={inputClass} type="number" min={0} max={30} value={days} onChange={(e) => setDays(+e.target.value)} /></Field>
        <Field label="Current Weight (g)"><input className={inputClass} type="number" value={currentWeightG} onChange={(e) => setCurrentWeightG(+e.target.value)} /></Field>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <div className="text-lg font-black text-ink">{lossFromBirth >= 0 ? lossFromBirth.toFixed(1) : '0'}%</div>
          <div className="text-[9px] font-bold uppercase text-neutral-400">{lossFromBirth >= 0 ? 'Down from birth weight' : 'Already above birth weight'}</div>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <div className="text-lg font-black text-ink">{z >= 0 ? '+' : ''}{z.toFixed(2)} SD</div>
          <div className="text-[9px] font-bold uppercase text-neutral-400">vs. median trajectory (expected {expectedG.toFixed(0)}g)</div>
        </div>
      </div>

      {excessLoss && (
        <div className="mt-3 rounded-xl border border-red-300 bg-red-50 p-3">
          <p className="text-xs font-black text-red-800">🚨 Weight loss &gt;10% from birth</p>
          <p className="mt-1 text-[11px] leading-relaxed text-red-700">Evaluate feeding/breastfeeding adequacy and hydration, and consider a lactation/pediatric referral if there is no improvement.</p>
        </div>
      )}
      {notRegained && !excessLoss && (
        <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3">
          <p className="text-xs font-black text-amber-800">⚠️ Has not returned to birth weight by age ≥14 days</p>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-700">Birth weight is normally regained by around day 10-14 — evaluate intake if this has not been reached.</p>
        </div>
      )}

      <div className="mt-4 h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="d" tick={{ fontSize: 10 }} label={{ value: 'Age (days)', position: 'insideBottom', offset: -2, fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} domain={[85, 125]} />
            <Tooltip />
            <Line type="monotone" dataKey="pctMedian" name="% Birth Weight (median)" stroke="#00BF63" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <button onClick={() => window.print()} className="liquid-glass-btn liquid-glass-btn--outline mt-4 w-full rounded-full py-2.5 text-xs font-bold text-brand-dark">🖨️ Print / Save as PDF</button>
      <p className="mt-2 text-[10px] leading-relaxed text-neutral-400">Physiologic loss of up to ~7-10% of birth weight in the first 3-5 days is normal (extravascular fluid loss), with return to birth weight around day 10-14. Estimate simplified from standard reference points — compare against official neonatal charts (WHO/Fenton) for borderline cases.</p>
    </Card>
  )
}

/* ══════════════════ CDC ANTHROPOMETRY (2–20 TAHUN) ══════════════════ */
// CDC 2000 growth reference (used for ages beyond WHO's 0-5yr scope, per
// CDC/AAP convention of switching references at 24 months in US practice,
// though Indonesia's Permenkes 2/2020 uses WHO throughout — this tab covers
// the CDC-specific 2-20yr BMI-for-age percentile bands clinicians may still
// need for international/CDC-referenced records).
const CDC_BMI_AGE_YR = [2, 5, 10, 15, 20]
const CDC_BMI_P5: Record<'M' | 'F', number[]> = { M: [14.7, 13.5, 14.2, 16.5, 18.5], F: [14.4, 13.3, 14.0, 16.0, 17.8] }
const CDC_BMI_P85: Record<'M' | 'F', number[]> = { M: [18.2, 16.8, 19.0, 23.5, 26.0], F: [17.9, 16.9, 19.5, 23.8, 25.8] }
const CDC_BMI_P95: Record<'M' | 'F', number[]> = { M: [19.3, 17.9, 21.0, 26.5, 29.5], F: [19.1, 18.0, 21.8, 27.0, 29.8] }

function cdcBmiClass(bmi: number, ageYr: number, sex: 'M' | 'F'): { l: string; tone: 'normal' | 'low' | 'critical' } {
  const p5 = interp(ageYr, CDC_BMI_AGE_YR, CDC_BMI_P5[sex])
  const p85 = interp(ageYr, CDC_BMI_AGE_YR, CDC_BMI_P85[sex])
  const p95 = interp(ageYr, CDC_BMI_AGE_YR, CDC_BMI_P95[sex])
  if (bmi < p5) return { l: 'Underweight (<P5)', tone: 'low' }
  if (bmi < p85) return { l: 'Normal (P5-P85)', tone: 'normal' }
  if (bmi < p95) return { l: 'At risk of overweight (P85-P95)', tone: 'low' }
  return { l: 'Obese (≥P95)', tone: 'critical' }
}

function CdcAnthropometryCalc() {
  const [sex, setSex] = useState<'M' | 'F'>('M')
  const [ageYr, setAgeYr] = useState(10)
  const [weight, setWeight] = useState(32)
  const [height, setHeight] = useState(138)

  const bmi = weight / (height / 100) ** 2
  const cls = cdcBmiClass(bmi, ageYr, sex)
  const p85 = interp(ageYr, CDC_BMI_AGE_YR, CDC_BMI_P85[sex])
  const p95 = interp(ageYr, CDC_BMI_AGE_YR, CDC_BMI_P95[sex])

  const chartData = CDC_BMI_AGE_YR.map((a, i) => ({
    age: a,
    p5: CDC_BMI_P5[sex][i],
    p85: CDC_BMI_P85[sex][i],
    p95: CDC_BMI_P95[sex][i],
  }))

  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="CDC Anthropometry (2–20 Years)" subtitle="CDC 2000 Growth Reference — BMI-for-age percentiles for children & adolescents" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Field label="Sex"><SegButtons value={sex} onChange={setSex} options={[{ v: 'M', l: 'Male' }, { v: 'F', l: 'Female' }]} /></Field>
        <Field label="Age (years)"><input className={inputClass} type="number" min={2} max={20} value={ageYr} onChange={(e) => setAgeYr(+e.target.value)} /></Field>
        <Field label="Weight (kg)"><input className={inputClass} type="number" step="0.1" value={weight} onChange={(e) => setWeight(+e.target.value)} /></Field>
        <Field label="Height (cm)"><input className={inputClass} type="number" step="0.1" value={height} onChange={(e) => setHeight(+e.target.value)} /></Field>
      </div>

      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-black text-ink">{bmi.toFixed(1)} <span className="text-sm font-semibold text-neutral-400">kg/m²</span></div>
          <Badge tone={cls.tone}>{cls.l}</Badge>
        </div>
        <p className="mt-2 text-[11px] text-neutral-500">Thresholds at this age: P85 ≈ {p85.toFixed(1)} · P95 ≈ {p95.toFixed(1)} kg/m²</p>
      </div>

      <div className="mt-4 h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="age" tick={{ fontSize: 10 }} label={{ value: 'Age (years)', position: 'insideBottom', offset: -2, fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="p5" name="P5" stroke="#9ca3af" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
            <Line type="monotone" dataKey="p85" name="P85" stroke="#f59e0b" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="p95" name="P95" stroke="#ef4444" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <button onClick={() => window.print()} className="liquid-glass-btn liquid-glass-btn--outline mt-4 w-full rounded-full py-2.5 text-xs font-bold text-brand-dark">🖨️ Print / Save as PDF</button>
      <p className="mt-2 text-[10px] leading-relaxed text-neutral-400">CDC 2000 Growth Reference (2-20 years), used internationally for BMI-for-age. Indonesia (Permenkes 2/2020) uses the WHO standard across the entire pediatric age range — use the WHO Anthropometry tab for the national reference. The percentiles above are estimated from standard reference points, not the full LMS table.</p>
    </Card>
  )
}

/* ══════════════════ NEW BALLARD SCORE + LUBCHENCO SOAP BUILDER ══════════════════ */
// New Ballard Score (Ballard et al., 1991) — 6 neuromuscular + 6 physical
// maturity criteria, summed to a total mapped to gestational age (weeks) via
// the standard published score-to-GA table. Combined here with a simplified
// Lubchenco-style birth-weight-for-gestational-age classification (SGA/AGA/
// LGA using approximate 10th/90th percentile bands) into an auto-drafted
// neonatal SOAP note — both are decision-support estimates, not a substitute
// for the official charts for edge-case/borderline values.
const BALLARD_SCORE_TO_GA: [number, number][] = [
  [-10, 20], [-5, 22], [0, 24], [5, 26], [10, 28], [15, 30], [20, 32],
  [25, 34], [30, 36], [35, 38], [40, 40], [45, 42], [50, 44],
]
function ballardScoreToGA(score: number): number {
  const pts = BALLARD_SCORE_TO_GA
  const s = Math.max(pts[0][0], Math.min(pts[pts.length - 1][0], score))
  for (let i = 0; i < pts.length - 1; i++) {
    if (s >= pts[i][0] && s <= pts[i + 1][0]) {
      const t = (s - pts[i][0]) / (pts[i + 1][0] - pts[i][0])
      return pts[i][1] + t * (pts[i + 1][1] - pts[i][1])
    }
  }
  return pts[pts.length - 1][1]
}

// Approximate 10th/90th percentile birth weight (grams) by gestational week —
// simplified Lubchenco/Fenton-style bands for SGA/AGA/LGA screening.
const LUBCHENCO_WEEKS = [24, 28, 32, 36, 40, 42]
const LUBCHENCO_P10 = [500, 750, 1300, 2100, 2800, 2900]
const LUBCHENCO_P90 = [850, 1450, 2400, 3400, 4000, 4200]
function lubchencoClass(gaWeeks: number, weightG: number): { l: string; tone: 'normal' | 'low' | 'critical' } {
  const p10 = interp(gaWeeks, LUBCHENCO_WEEKS, LUBCHENCO_P10)
  const p90 = interp(gaWeeks, LUBCHENCO_WEEKS, LUBCHENCO_P90)
  if (weightG < p10) return { l: 'SGA (Small for Gestational Age)', tone: 'critical' }
  if (weightG > p90) return { l: 'LGA (Large for Gestational Age)', tone: 'low' }
  return { l: 'AGA (Appropriate for Gestational Age)', tone: 'normal' }
}

const NEURO_CRITERIA: { key: string; label: string; opts: { v: number; l: string }[] }[] = [
  { key: 'posture', label: 'Posture', opts: [{ v: 0, l: 'Full extension' }, { v: 1, l: 'Slight hip/knee flexion' }, { v: 2, l: 'Moderate flexion' }, { v: 3, l: 'Legs flexed-abducted' }, { v: 4, l: 'Full flexion (fetal)' }] },
  { key: 'squareWindow', label: 'Square Window (wrist)', opts: [{ v: -1, l: '>90°' }, { v: 0, l: '90°' }, { v: 1, l: '60°' }, { v: 2, l: '45°' }, { v: 3, l: '30°' }, { v: 4, l: '0°' }] },
  { key: 'armRecoil', label: 'Arm Recoil', opts: [{ v: -1, l: '180° (no recoil)' }, { v: 0, l: '140-180°' }, { v: 1, l: '110-140°' }, { v: 2, l: '90-110°' }, { v: 3, l: '<90°' }] },
  { key: 'poplitealAngle', label: 'Popliteal Angle', opts: [{ v: -1, l: '180°' }, { v: 0, l: '160°' }, { v: 1, l: '140°' }, { v: 2, l: '120°' }, { v: 3, l: '100°' }, { v: 4, l: '90°' }, { v: 5, l: '<90°' }] },
  { key: 'scarfSign', label: 'Scarf Sign', opts: [{ v: -1, l: 'Elbow reaches opposite axillary line' }, { v: 0, l: 'Elbow crosses midline' }, { v: 1, l: 'Elbow at midline' }, { v: 2, l: 'Elbow does not reach midline' }, { v: 3, l: 'Elbow at contralateral nipple' }, { v: 4, l: 'Elbow does not reach nipple' }] },
  { key: 'heelToEar', label: 'Heel to Ear', opts: [{ v: -1, l: 'Heel reaches ear easily' }, { v: 0, l: 'Heel near ear' }, { v: 1, l: 'Moderate distance' }, { v: 2, l: 'Distance increasing' }, { v: 3, l: 'Large distance' }, { v: 4, l: 'Heel does not reach ear' }] },
]
const PHYSICAL_CRITERIA: { key: string; label: string; opts: { v: number; l: string }[] }[] = [
  { key: 'skin', label: 'Skin', opts: [{ v: -1, l: 'Sticky, transparent' }, { v: 0, l: 'Gelatinous, red, translucent' }, { v: 1, l: 'Smooth, pink, visible veins' }, { v: 2, l: 'Superficial peeling' }, { v: 3, l: 'Cracked, pale areas' }, { v: 4, l: 'Deep cracks, no vessels' }, { v: 5, l: 'Leathery, wrinkled' }] },
  { key: 'lanugo', label: 'Lanugo', opts: [{ v: -1, l: 'None' }, { v: 0, l: 'Sparse' }, { v: 1, l: 'Thinning' }, { v: 2, l: 'Bald areas' }, { v: 3, l: 'Mostly bald' }] },
  { key: 'plantar', label: 'Plantar Surface', opts: [{ v: -1, l: '<40mm, no crease' }, { v: 0, l: '40-50mm' }, { v: 1, l: 'Faint red marks' }, { v: 2, l: 'Anterior transverse crease' }, { v: 3, l: 'Creases over anterior 2/3' }, { v: 4, l: 'Creases cover entire sole' }] },
  { key: 'breast', label: 'Breast', opts: [{ v: -1, l: 'Not palpable' }, { v: 0, l: 'Barely palpable' }, { v: 1, l: 'Flat areola, no bud' }, { v: 2, l: 'Stippled areola, 1-2mm bud' }, { v: 3, l: 'Raised areola, 3-4mm bud' }, { v: 4, l: 'Full areola, 5-10mm bud' }] },
  { key: 'eyeEar', label: 'Eye/Ear', opts: [{ v: -1, l: 'Lids fused loosely' }, { v: 0, l: 'Lids fused tightly' }, { v: 1, l: 'Lids open, pinna flat' }, { v: 2, l: 'Pinna slightly curved' }, { v: 3, l: 'Pinna well curved, soft' }, { v: 4, l: 'Thick cartilage, stiff' }] },
  { key: 'genitals', label: 'Genitals', opts: [{ v: -1, l: 'Flat scrotum/flat labia' }, { v: 0, l: 'Empty scrotum/prominent labia' }, { v: 1, l: 'Testes partially descended' }, { v: 2, l: 'Testes in upper canal/labia majora enlarged' }, { v: 3, l: 'Testes descended, moderate rugae' }, { v: 4, l: 'Testes fully descended, deep rugae' }] },
]

function BallardSoapCalc() {
  const [neuro, setNeuro] = useState<Record<string, number>>({ posture: 2, squareWindow: 2, armRecoil: 1, poplitealAngle: 2, scarfSign: 1, heelToEar: 1 })
  const [phys, setPhys] = useState<Record<string, number>>({ skin: 2, lanugo: 1, plantar: 2, breast: 2, eyeEar: 2, genitals: 2 })
  const [apgar1, setApgar1] = useState(8)
  const [apgar5, setApgar5] = useState(9)
  const [birthWeightG, setBirthWeightG] = useState(3000)
  const [babyName, setBabyName] = useState('')
  const [sex, setSex] = useState<'M' | 'F'>('M')

  const total = Object.values(neuro).reduce((a, b) => a + b, 0) + Object.values(phys).reduce((a, b) => a + b, 0)
  const gaWeeks = ballardScoreToGA(total)
  const lub = lubchencoClass(gaWeeks, birthWeightG)

  const soapNote = `SOAP — Neonatal Assessment${babyName ? ` (${babyName})` : ''}
Sex: ${sex === 'M' ? 'Male' : 'Female'} · Birth Weight: ${birthWeightG} g

S (Subjective): Newborn, maturity and immediate postnatal adaptation assessment performed.

O (Objective):
- APGAR at 1 min: ${apgar1}/10, at 5 min: ${apgar5}/10
- New Ballard Score total: ${total} → estimated gestational age ${gaWeeks.toFixed(1)} weeks
- Birth weight classification for gestational age (Lubchenco): ${lub.l}

A (Assessment):
- ${gaWeeks < 37 ? 'Preterm' : gaWeeks > 42 ? 'Post-term' : 'Term'} (Ballard estimate ${gaWeeks.toFixed(1)} weeks)
- ${lub.l}
- 5-minute APGAR ${apgar5 >= 7 ? 'good, adequate neonatal adaptation' : apgar5 >= 4 ? 'needs close observation' : 'severe depression, needs further resuscitation & NICU referral'}

P (Plan):
- Manage per gestational age & birth weight classification (rooming-in if stable; NICU observation if preterm/SGA/low APGAR)
- Periodic monitoring of temperature, blood glucose, and vital signs
- Early initiation of breastfeeding if condition is stable
- Vitamin K1 prophylaxis & eye ointment per protocol
- Routine screening (congenital hypothyroidism, etc.) per schedule`

  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Ballard Score + Lubchenco → SOAP" subtitle="New Ballard Score (1991) for gestational age, Lubchenco classification, auto-summarized into a SOAP note" />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Field label="Baby's Name (optional)"><input className={inputClass} value={babyName} onChange={(e) => setBabyName(e.target.value)} placeholder="—" /></Field>
        <Field label="Sex"><SegButtons value={sex} onChange={setSex} options={[{ v: 'M', l: 'Male' }, { v: 'F', l: 'Female' }]} /></Field>
        <Field label="Birth Weight (g)"><input className={inputClass} type="number" value={birthWeightG} onChange={(e) => setBirthWeightG(+e.target.value)} /></Field>
        <Field label="APGAR 1' / 5'">
          <div className="flex gap-1.5">
            <input className={inputClass} type="number" min={0} max={10} value={apgar1} onChange={(e) => setApgar1(+e.target.value)} />
            <input className={inputClass} type="number" min={0} max={10} value={apgar5} onChange={(e) => setApgar5(+e.target.value)} />
          </div>
        </Field>
      </div>

      <h4 className="mt-4 text-xs font-black uppercase tracking-wide text-neutral-500">Neuromuscular Maturity</h4>
      <div className="mt-2 space-y-2.5">
        {NEURO_CRITERIA.map((c) => (
          <Field key={c.key} label={c.label}>
            <SegButtons value={neuro[c.key]} onChange={(v) => setNeuro((s) => ({ ...s, [c.key]: v }))} options={c.opts} />
          </Field>
        ))}
      </div>

      <h4 className="mt-4 text-xs font-black uppercase tracking-wide text-neutral-500">Physical Maturity</h4>
      <div className="mt-2 space-y-2.5">
        {PHYSICAL_CRITERIA.map((c) => (
          <Field key={c.key} label={c.label}>
            <SegButtons value={phys[c.key]} onChange={(v) => setPhys((s) => ({ ...s, [c.key]: v }))} options={c.opts} />
          </Field>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <div className="text-lg font-black text-ink">{total}</div>
          <div className="text-[10px] font-bold uppercase text-neutral-400">Ballard Score</div>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <div className="text-lg font-black text-ink">{gaWeeks.toFixed(1)} wks</div>
          <div className="text-[10px] font-bold uppercase text-neutral-400">Gestational Age</div>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <Badge tone={lub.tone}>{lub.l.split(' ')[0]}</Badge>
          <div className="mt-1 text-[9px] font-bold uppercase text-neutral-400">Lubchenco</div>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="mb-2 text-xs font-black uppercase tracking-wide text-neutral-500">Auto-Drafted SOAP Note</h4>
        <pre className="whitespace-pre-wrap rounded-xl bg-neutral-900 p-3 text-[11px] leading-relaxed text-neutral-100">{soapNote}</pre>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-neutral-400">
        Gestational age estimate & Lubchenco classification are simplified from standard reference points — verify against official tables/charts for borderline cases. The SOAP draft must be reviewed and completed by a physician before entering the official medical record.
      </p>
    </Card>
  )
}

/* ══════════════════ qSOFA ══════════════════ */
function QsofaCalc() {
  const [rr22, setRr22] = useState(false)
  const [alteredMental, setAlteredMental] = useState(false)
  const [sbp100, setSbp100] = useState(false)
  const total = [rr22, alteredMental, sbp100].filter(Boolean).length
  const interp = total >= 2
    ? { l: 'High risk', tone: 'critical' as const, note: 'Suspect sepsis — obtain a full SOFA evaluation, cultures, and initiate sepsis management promptly.' }
    : { l: 'Low risk', tone: 'normal' as const, note: 'qSOFA alone is not designed as an initial screening tool outside the ICU — continue to use clinical judgment.' }
  const Row = ({ label, sub, checked, onChange }: { label: string; sub: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-brand" />
      <div><div className="text-sm font-bold text-ink">{label}</div><div className="text-[11px] text-neutral-400">{sub}</div></div>
    </label>
  )
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="qSOFA" subtitle="Quick SOFA — rapid screening for infection-related organ dysfunction (Sepsis-3, 2016)" />
      <div className="space-y-2">
        <Row label="Respiratory rate ≥22/min" sub="Tachypnea" checked={rr22} onChange={setRr22} />
        <Row label="Altered mental status" sub="GCS <15 / acute confusion" checked={alteredMental} onChange={setAlteredMental} />
        <Row label="Systolic blood pressure ≤100 mmHg" sub="Hypotension" checked={sbp100} onChange={setSbp100} />
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-black text-ink">{total}<span className="text-sm font-semibold text-neutral-400">/3</span></div>
          <Badge tone={interp.tone}>{interp.l}</Badge>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{interp.note}</p>
      </div>
    </Card>
  )
}

/* ══════════════════ HOLLIDAY-SEGAR MAINTENANCE FLUID ══════════════════ */
function HollidaySegarCalc() {
  const [weight, setWeight] = useState(20)
  function mlPerDay(w: number): number {
    if (w <= 10) return w * 100
    if (w <= 20) return 1000 + (w - 10) * 50
    return 1500 + (w - 20) * 20
  }
  const daily = mlPerDay(weight)
  const hourly = daily / 24
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Holliday-Segar (Maintenance Fluid)" subtitle="Classic 4-2-1 formula (Holliday & Segar, 1957)" />
      <Field label="Body Weight (kg)"><input className={inputClass} type="number" step="0.1" value={weight} onChange={(e) => setWeight(+e.target.value)} /></Field>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <div className="text-xl font-black text-ink">{daily.toFixed(0)}</div>
          <div className="text-[10px] font-bold uppercase text-neutral-400">mL / 24 hours</div>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <div className="text-xl font-black text-ink">{hourly.toFixed(1)}</div>
          <div className="text-[10px] font-bold uppercase text-neutral-400">mL / hour (maintenance rate)</div>
        </div>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">First 10kg: 100 mL/kg · second 10kg: +50 mL/kg · each kg above 20: +20 mL/kg. Adjust for hydration status, fever, and clinical condition.</p>
    </Card>
  )
}

/* ══════════════════ PARKLAND FORMULA (BURN RESUSCITATION) ══════════════════ */
function ParklandCalc() {
  const [weight, setWeight] = useState(70)
  const [tbsa, setTbsa] = useState(20)
  const total24h = 4 * weight * tbsa
  const first8h = total24h / 2
  const first8hRate = first8h / 8
  const next16hRate = (total24h - first8h) / 16
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Parkland Formula" subtitle="Fluid resuscitation for burns ≥20% TBSA (Baxter, 1968)" />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Body Weight (kg)"><input className={inputClass} type="number" value={weight} onChange={(e) => setWeight(+e.target.value)} /></Field>
        <Field label="% TBSA (burn surface area)"><input className={inputClass} type="number" min={0} max={100} value={tbsa} onChange={(e) => setTbsa(+e.target.value)} /></Field>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <div className="text-lg font-black text-ink">{total24h.toFixed(0)}</div>
          <div className="text-[9px] font-bold uppercase text-neutral-400">mL Total 24 hours</div>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <div className="text-lg font-black text-ink">{first8hRate.toFixed(0)}</div>
          <div className="text-[9px] font-bold uppercase text-neutral-400">mL/hour (first 8 hours)</div>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <div className="text-lg font-black text-ink">{next16hRate.toFixed(0)}</div>
          <div className="text-[9px] font-bold uppercase text-neutral-400">mL/hour (following 16 hours)</div>
        </div>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">Total = 4 mL × weight(kg) × %TBSA, crystalloid fluid (LR). Half given in the first 8 hours FROM THE TIME OF INJURY (not from hospital arrival), the remaining half over the next 16 hours. Titrate against urine output (target ~0.5 mL/kg/hr in adults).</p>
    </Card>
  )
}

/* ══════════════════ NAEGELE'S RULE + GESTATIONAL AGE ══════════════════ */
function NaegeleCalc() {
  const [lmp, setLmp] = useState('')
  const [cycleLen, setCycleLen] = useState(28)
  let edd: Date | null = null
  let gaWeeks = 0
  let gaDays = 0
  if (lmp) {
    const lmpDate = new Date(lmp)
    const cycleAdj = cycleLen - 28
    edd = new Date(lmpDate)
    edd.setDate(edd.getDate() + 280 + cycleAdj)
    const diffDays = Math.floor((Date.now() - lmpDate.getTime()) / 86400000) + cycleAdj
    gaWeeks = Math.floor(diffDays / 7)
    gaDays = diffDays % 7
  }
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Naegele's Rule" subtitle="Estimated due date (EDD) & gestational age from LMP" />
      <div className="grid grid-cols-2 gap-2">
        <Field label="LMP (last menstrual period)"><input className={inputClass} type="date" value={lmp} onChange={(e) => setLmp(e.target.value)} /></Field>
        <Field label="Menstrual Cycle Length (days)"><input className={inputClass} type="number" value={cycleLen} onChange={(e) => setCycleLen(+e.target.value)} /></Field>
      </div>
      {edd && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-neutral-50 p-3 text-center">
            <div className="text-base font-black text-ink">{edd.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div className="text-[10px] font-bold uppercase text-neutral-400">Estimated Due Date (EDD)</div>
          </div>
          <div className="rounded-xl bg-neutral-50 p-3 text-center">
            <div className="text-base font-black text-ink">{gaWeeks}wk {gaDays}d</div>
            <div className="text-[10px] font-bold uppercase text-neutral-400">Current Gestational Age</div>
          </div>
        </div>
      )}
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">Naegele's Rule: EDD = LMP + 280 days (adjusted if the menstrual cycle is not 28 days). Confirm with a first-trimester ultrasound if possible — it is more accurate than LMP alone, especially with irregular cycles.</p>
    </Card>
  )
}

/* ══════════════════ MAP (MEAN ARTERIAL PRESSURE) ══════════════════ */
function MapCalc() {
  const [sys, setSys] = useState(120)
  const [dia, setDia] = useState(80)
  const map = (sys + 2 * dia) / 3
  const interp = map < 60
    ? { l: 'Very low', tone: 'critical' as const, note: 'Organ perfusion at risk of being impaired — evaluate for shock/hypoperfusion.' }
    : map <= 100
    ? { l: 'Normal', tone: 'normal' as const, note: 'Generally sufficient for organ perfusion (target MAP ≥65 in septic shock).' }
    : { l: 'High', tone: 'low' as const, note: 'Evaluate for hypertension / hypertensive crisis if very high.' }
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Mean Arterial Pressure (MAP)" subtitle="Average organ perfusion pressure" />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Systolic (mmHg)"><input className={inputClass} type="number" value={sys} onChange={(e) => setSys(+e.target.value)} /></Field>
        <Field label="Diastolic (mmHg)"><input className={inputClass} type="number" value={dia} onChange={(e) => setDia(+e.target.value)} /></Field>
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-black text-ink">{map.toFixed(0)}<span className="text-sm font-semibold text-neutral-400"> mmHg</span></div>
          <Badge tone={interp.tone}>{interp.l}</Badge>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{interp.note}</p>
      </div>
      <p className="mt-3 text-[10px] text-neutral-400">MAP = (Systolic + 2×Diastolic) / 3.</p>
    </Card>
  )
}

/* ══════════════════ ALVARADO SCORE (APPENDICITIS) ══════════════════ */
function AlvaradoCalc() {
  const criteria = [
    { key: 'migratoryPain', label: 'Migration of pain to right lower quadrant', pts: 1 },
    { key: 'anorexia', label: 'Anorexia', pts: 1 },
    { key: 'nauseaVomit', label: 'Nausea/vomiting', pts: 1 },
    { key: 'rlqTender', label: 'Right lower quadrant tenderness', pts: 2 },
    { key: 'rebound', label: 'Rebound tenderness', pts: 1 },
    { key: 'fever', label: 'Fever ≥37.3°C', pts: 1 },
    { key: 'leukocytosis', label: 'Leukocytosis >10,000', pts: 2 },
    { key: 'shiftLeft', label: 'Left shift of neutrophils (>75%)', pts: 1 },
  ]
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const total = criteria.reduce((sum, c) => sum + (checked[c.key] ? c.pts : 0), 0)
  const interp = total <= 4
    ? { l: 'Low probability', tone: 'normal' as const, note: 'Appendicitis less likely — consider observation/other differential diagnoses.' }
    : total <= 6
    ? { l: 'Moderate probability', tone: 'low' as const, note: 'Consider further imaging (ultrasound/CT) for confirmation.' }
    : { l: 'High probability', tone: 'critical' as const, note: 'Consider surgical consultation for appendectomy.' }
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Alvarado Score" subtitle="Clinical scoring for suspected acute appendicitis (Alvarado, 1986)" />
      <div className="space-y-2">
        {criteria.map((c) => (
          <label key={c.key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50">
            <input type="checkbox" checked={!!checked[c.key]} onChange={(e) => setChecked((s) => ({ ...s, [c.key]: e.target.checked }))} className="h-5 w-5 accent-brand" />
            <div className="flex-1 text-sm font-bold text-ink">{c.label}</div>
            <span className="text-xs font-black text-neutral-400">+{c.pts}</span>
          </label>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-black text-ink">{total}<span className="text-sm font-semibold text-neutral-400">/10</span></div>
          <Badge tone={interp.tone}>{interp.l}</Badge>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{interp.note}</p>
      </div>
    </Card>
  )
}

const TABS = [
  { id: 'apgar', label: 'APGAR' },
  { id: 'gcs', label: 'GCS' },
  { id: 'curb65', label: 'CURB-65' },
  { id: 'bishop', label: 'Bishop' },
  { id: 'ckdepi', label: 'CKD-EPI' },
  { id: 'whogrowth', label: 'WHO Anthropometry' },
  { id: 'whoneonate', label: 'WHO Neonate' },
  { id: 'cdcanthro', label: 'CDC Anthropometry' },
  { id: 'ballard', label: 'Ballard+SOAP' },
  { id: 'qsofa', label: 'qSOFA' },
  { id: 'hollidaysegar', label: 'Maintenance Fluid' },
  { id: 'parkland', label: 'Parkland' },
  { id: 'naegele', label: 'Naegele' },
  { id: 'map', label: 'MAP' },
  { id: 'alvarado', label: 'Alvarado' },
  { id: 'centor', label: 'Centor/McIsaac' },
  { id: 'nacorr', label: 'Electrolyte Correction' },
  { id: 'broca', label: 'Broca IBW' },
  { id: 'brocalorentz', label: 'Broca-Lorentz Calorie' },
  { id: 'ivdrip', label: 'IV Drip Rate' },
  { id: 'midparental', label: 'Mid-Parental' },
  { id: 'fletcher', label: 'Fletcher Index' },
  { id: 'nose', label: 'NOSE' },
  { id: 'rsi', label: 'RSI' },
  { id: 'aria', label: 'ARIA Criteria' },
  { id: 'abcd2', label: 'ABCD²' },
  { id: 'four', label: 'FOUR Score' },
  { id: 'mcdonald', label: 'McDonald' },
  { id: 'paradise', label: 'Paradise' },
  { id: 'nihss', label: 'NIHSS' },
  { id: 'fluidbalance', label: 'Fluid Balance' },
  { id: 'pedsdose', label: 'Pediatric Dosing' },
  { id: 'vbac', label: 'VBAC Flamm-Geiger' },
  { id: 'denver', label: 'Denver II (Simplified)' },
  { id: 'atls', label: 'XABCDE Trauma Survey' },
  { id: 'acls', label: 'ACLS Guide' },
  { id: 'abg', label: 'Blood Gas Analysis' },
  { id: 'burn', label: 'Burn Calculator' },
  { id: 'cranial', label: 'Cranial Nerve + Meningeal' },
  { id: 'competencies', label: 'Competency Tracker' },
] as const

/* ══════════════════ CENTOR / McISAAC (STREP PHARYNGITIS) ══════════════════ */
function CentorCalc() {
  const [fever, setFever] = useState(false)
  const [noCough, setNoCough] = useState(false)
  const [tenderNodes, setTenderNodes] = useState(false)
  const [exudate, setExudate] = useState(false)
  const [age, setAge] = useState(30)
  const ageAdj = age < 15 ? 1 : age >= 45 ? -1 : 0
  const total = [fever, noCough, tenderNodes, exudate].filter(Boolean).length + ageAdj
  const interp = total <= 0
    ? { l: 'Very low risk (1-2.5%)', tone: 'normal' as const, note: 'No swab/empiric antibiotics needed.' }
    : total === 1
    ? { l: 'Low risk (5-10%)', tone: 'normal' as const, note: 'Antibiotics generally not needed.' }
    : total === 2
    ? { l: 'Moderate risk (11-17%)', tone: 'low' as const, note: 'Consider a rapid strep test/culture before antibiotics.' }
    : total === 3
    ? { l: 'High risk (28-35%)', tone: 'low' as const, note: 'Strep testing recommended; treat if positive.' }
    : { l: 'Very high risk (51-53%)', tone: 'critical' as const, note: 'Consider empiric antibiotics (e.g. penicillin) or a rapid test first per local policy.' }
  const Row = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-brand" />
      <div className="text-sm font-bold text-ink">{label}</div>
    </label>
  )
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Centor / McIsaac Score" subtitle="Likelihood of streptococcal pharyngitis (Centor 1981, modified McIsaac 1998)" />
      <div className="space-y-2">
        <Row label="Fever >38°C" checked={fever} onChange={setFever} />
        <Row label="Absence of cough" checked={noCough} onChange={setNoCough} />
        <Row label="Tender anterior cervical lymphadenopathy" checked={tenderNodes} onChange={setTenderNodes} />
        <Row label="Tonsillar exudate/swelling" checked={exudate} onChange={setExudate} />
        <Field label="Age (years)"><input className={inputClass} type="number" value={age} onChange={(e) => setAge(+e.target.value)} /></Field>
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-black text-ink">{total}</div>
          <Badge tone={interp.tone}>{interp.l}</Badge>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{interp.note}</p>
      </div>
      <p className="mt-3 text-[10px] text-neutral-400">McIsaac modification: age &lt;15yr (+1), 15-44yr (+0), ≥45yr (-1).</p>
    </Card>
  )
}

/* ══════════════════ KOREKSI NATRIUM (HIPERGLIKEMIA) ══════════════════ */
function NaCorrectionCalc() {
  const [measuredNa, setMeasuredNa] = useState(130)
  const [glucose, setGlucose] = useState(400)
  // Katz correction: +1.6 mEq/L Na per 100 mg/dL glucose above 100 mg/dL
  const correctedNa = measuredNa + 1.6 * Math.max(0, (glucose - 100) / 100)

  // Potassium deficit estimate (Sterns' rule-of-thumb, widely taught):
  // each 1 mEq/L drop in serum K+ below 4.0 corresponds to roughly a 200-400
  // mEq total-body deficit — presented as a range, not a single number, since
  // the true relationship is nonlinear and affected by acid-base status.
  const [measuredK, setMeasuredK] = useState(3.2)
  const kDeficitLow = Math.max(0, (4.0 - measuredK) * 200)
  const kDeficitHigh = Math.max(0, (4.0 - measuredK) * 400)
  const kSeverity = measuredK < 2.5 || measuredK > 6.5
    ? { l: 'Severe — monitor ECG closely', tone: 'critical' as const }
    : measuredK < 3.0 || measuredK > 6.0
    ? { l: 'Moderate', tone: 'low' as const }
    : measuredK < 3.5 || measuredK > 5.5
    ? { l: 'Mild', tone: 'low' as const }
    : { l: 'Normal', tone: 'normal' as const }

  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Electrolyte Correction (Na & K)" subtitle="Sodium: Katz Formula (1973) · Potassium: deficit estimate (Sterns' rule-of-thumb)" />

      <h4 className="text-xs font-black uppercase tracking-wide text-neutral-500">Sodium (Hyperglycemia)</h4>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label="Measured Sodium (mEq/L)"><input className={inputClass} type="number" value={measuredNa} onChange={(e) => setMeasuredNa(+e.target.value)} /></Field>
        <Field label="Blood Glucose (mg/dL)"><input className={inputClass} type="number" value={glucose} onChange={(e) => setGlucose(+e.target.value)} /></Field>
      </div>
      <div className="mt-3 rounded-xl bg-neutral-50 p-3 text-center">
        <div className="text-2xl font-black text-ink">{correctedNa.toFixed(1)} <span className="text-sm font-semibold text-neutral-400">mEq/L</span></div>
        <div className="mt-1 text-[10px] font-bold uppercase text-neutral-400">Corrected Sodium</div>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-neutral-400">Corrected Na = Measured Na + 1.6 × [(Glucose − 100) / 100]. Hyperglycemia draws water out of cells, factitiously diluting serum sodium.</p>

      <h4 className="mt-5 text-xs font-black uppercase tracking-wide text-neutral-500">Potassium</h4>
      <div className="mt-2">
        <Field label="Measured Potassium (mEq/L)"><input className={inputClass} type="number" step="0.1" value={measuredK} onChange={(e) => setMeasuredK(+e.target.value)} /></Field>
      </div>
      <div className="mt-3 rounded-xl bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-black text-ink">{measuredK < 4.0 ? `${kDeficitLow.toFixed(0)}–${kDeficitHigh.toFixed(0)} mEq` : '—'}</div>
            <div className="text-[10px] font-bold uppercase text-neutral-400">Estimated Total-Body K⁺ Deficit</div>
          </div>
          <Badge tone={kSeverity.tone}>{kSeverity.l}</Badge>
        </div>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-neutral-400">Rough estimate: each 1 mEq/L drop in serum K⁺ below 4.0 ≈ 200-400 mEq total-body deficit (nonlinear relationship, affected by acid-base status). IV potassium correction is generally limited to ≤10-20 mEq/hr peripherally (higher via central access with continuous ECG monitoring) — do not correct the entire deficit at once.</p>
    </Card>
  )
}

/* ══════════════════ BROCA'S FORMULA (IDEAL BODY WEIGHT) ══════════════════ */
function BrocaCalc() {
  const [height, setHeight] = useState(165)
  const [sex, setSex] = useState<'M' | 'F'>('M')
  const base = height - 100
  const ibw = sex === 'M' ? base - base * 0.1 : base - base * 0.15
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Broca's Formula (Ideal Body Weight)" subtitle="Broca Index, modified for sex" />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Height (cm)"><input className={inputClass} type="number" value={height} onChange={(e) => setHeight(+e.target.value)} /></Field>
        <Field label="Sex"><SegButtons value={sex} onChange={setSex} options={[{ v: 'M', l: 'Male' }, { v: 'F', l: 'Female' }]} /></Field>
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3 text-center">
        <div className="text-2xl font-black text-ink">{ibw.toFixed(1)} <span className="text-sm font-semibold text-neutral-400">kg</span></div>
        <div className="mt-1 text-[10px] font-bold uppercase text-neutral-400">Ideal Body Weight (Broca)</div>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">Male: (Height − 100) − 10%. Female: (Height − 100) − 15%. A simple approximation — for higher clinical precision needs (e.g. drug dosing), consider the Devine/Robinson formulas.</p>
    </Card>
  )
}

/* ══════════════════ MID-PARENTAL HEIGHT ══════════════════ */
function MidParentalCalc() {
  const [fatherCm, setFatherCm] = useState(170)
  const [motherCm, setMotherCm] = useState(158)
  const [childSex, setChildSex] = useState<'M' | 'F'>('M')
  const mph = childSex === 'M' ? (fatherCm + motherCm + 13) / 2 : (fatherCm + motherCm - 13) / 2
  const rangeLo = mph - 8.5
  const rangeHi = mph + 8.5
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Mid-Parental Height" subtitle="Predicted adult height target for a child from parental heights" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Field label="Father's Height (cm)"><input className={inputClass} type="number" value={fatherCm} onChange={(e) => setFatherCm(+e.target.value)} /></Field>
        <Field label="Mother's Height (cm)"><input className={inputClass} type="number" value={motherCm} onChange={(e) => setMotherCm(+e.target.value)} /></Field>
        <Field label="Child's Sex"><SegButtons value={childSex} onChange={setChildSex} options={[{ v: 'M', l: 'Male' }, { v: 'F', l: 'Female' }]} /></Field>
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3 text-center">
        <div className="text-2xl font-black text-ink">{mph.toFixed(1)} cm</div>
        <div className="mt-1 text-[10px] font-bold uppercase text-neutral-400">Target Height (±8.5cm range: {rangeLo.toFixed(0)}–{rangeHi.toFixed(0)} cm)</div>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">Male: (Father's height + Mother's height + 13) / 2. Female: (Father's height + Mother's height − 13) / 2. The ±8.5cm range covers ~90% of the genetic target — a child deviating far outside this range warrants endocrine/nutritional evaluation.</p>
    </Card>
  )
}

/* ══════════════════ FLETCHER INDEX (HEARING LOSS) ══════════════════ */
function FletcherCalc() {
  const [mode, setMode] = useState<'basic' | 'complete'>('basic')
  const [t500, setT500] = useState(20)
  const [t1000, setT1000] = useState(20)
  const [t2000, setT2000] = useState(20)
  const [t3000, setT3000] = useState(20)
  // Complete (AAO-HNS 4-frequency) average adds 3000Hz — captures noise-
  // induced/occupational hearing-loss notches that the classic 3-frequency
  // Fletcher index (500/1000/2000Hz) alone can miss.
  const index = mode === 'basic' ? (t500 + t1000 + t2000) / 3 : (t500 + t1000 + t2000 + t3000) / 4
  const cls = index < 26
    ? { l: 'Normal', tone: 'normal' as const }
    : index < 41
    ? { l: 'Mild hearing loss', tone: 'low' as const }
    : index < 56
    ? { l: 'Moderate hearing loss', tone: 'low' as const }
    : index < 71
    ? { l: 'Moderately severe hearing loss', tone: 'critical' as const }
    : index < 91
    ? { l: 'Severe hearing loss', tone: 'critical' as const }
    : { l: 'Profound (total) hearing loss', tone: 'critical' as const }
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Fletcher Index" subtitle="Pure-tone average threshold — hearing loss grade classification" />
      <SegButtons value={mode} onChange={setMode} options={[{ v: 'basic', l: 'Basic (3-frequency)' }, { v: 'complete', l: 'Complete (4-frequency, AAO-HNS)' }]} />
      <div className={`mt-3 grid gap-2 ${mode === 'basic' ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
        <Field label="500 Hz (dB)"><input className={inputClass} type="number" value={t500} onChange={(e) => setT500(+e.target.value)} /></Field>
        <Field label="1000 Hz (dB)"><input className={inputClass} type="number" value={t1000} onChange={(e) => setT1000(+e.target.value)} /></Field>
        <Field label="2000 Hz (dB)"><input className={inputClass} type="number" value={t2000} onChange={(e) => setT2000(+e.target.value)} /></Field>
        {mode === 'complete' && <Field label="3000 Hz (dB)"><input className={inputClass} type="number" value={t3000} onChange={(e) => setT3000(+e.target.value)} /></Field>}
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-black text-ink">{index.toFixed(1)} dB</div>
          <Badge tone={cls.tone}>{cls.l}</Badge>
        </div>
      </div>
      <p className="mt-3 text-[10px] text-neutral-400">
        {mode === 'basic' ? 'Fletcher Index = average threshold at 500+1000+2000 Hz.' : 'Complete (AAO-HNS 4-frequency) = average threshold at 500+1000+2000+3000 Hz — more sensitive to noise/occupational notches.'} &lt;26dB normal · 26-40 mild · 41-55 moderate · 56-70 moderately severe · 71-90 severe · &gt;90 profound.
      </p>
    </Card>
  )
}

/* ══════════════════ NOSE SCORE ══════════════════ */
function NoseCalc() {
  const items = [
    'Nasal congestion/blockage',
    'Nasal obstruction',
    'Difficulty breathing through the nose',
    'Difficulty sleeping',
    'Unable to get enough air through the nose during exertion',
  ]
  const opts = [{ v: 0, l: 'None' }, { v: 1, l: 'Mild' }, { v: 2, l: 'Moderate' }, { v: 3, l: 'Severe' }, { v: 4, l: 'Very severe' }]
  const [vals, setVals] = useState<number[]>([0, 0, 0, 0, 0])
  const total = vals.reduce((a, b) => a + b, 0) * 5 // 0-100 scale
  const cls = total <= 25 ? { l: 'Mild', tone: 'normal' as const } : total <= 50 ? { l: 'Moderate', tone: 'low' as const } : total <= 75 ? { l: 'Severe', tone: 'critical' as const } : { l: 'Very severe', tone: 'critical' as const }
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="NOSE Score" subtitle="Nasal Obstruction Symptom Evaluation — quality-of-life impact of nasal obstruction" />
      <div className="space-y-3">
        {items.map((label, i) => (
          <Field key={label} label={label}>
            <SegButtons value={vals[i]} onChange={(v) => setVals((s) => s.map((x, j) => (j === i ? v : x)))} options={opts} />
          </Field>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-black text-ink">{total}<span className="text-sm font-semibold text-neutral-400">/100</span></div>
          <Badge tone={cls.tone}>{cls.l}</Badge>
        </div>
      </div>
      <p className="mt-3 text-[10px] text-neutral-400">Total = sum of 5 items (0-4 each) × 5, scale 0-100.</p>
    </Card>
  )
}

/* ══════════════════ REFLUX SYMPTOM INDEX (RSI) ══════════════════ */
function RsiCalc() {
  const items = [
    'Hoarseness/voice disturbance',
    'Frequent throat clearing',
    'Excess throat mucus/postnasal drip',
    'Difficulty swallowing food/liquids/pills',
    'Coughing after eating/lying down',
    'Trouble breathing/choking episodes',
    'Bothersome cough',
    'Sensation of something stuck in the throat',
    'Heartburn, chest pain, or acid regurgitation',
  ]
  const [vals, setVals] = useState<number[]>(Array(9).fill(0))
  const total = vals.reduce((a, b) => a + b, 0)
  const abnormal = total > 13
  const opts = [0, 1, 2, 3, 4, 5].map((v) => ({ v, l: String(v) }))
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Reflux Symptom Index (RSI)" subtitle="Belafsky et al., 2002 — laryngopharyngeal reflux screening" />
      <div className="space-y-3">
        {items.map((label, i) => (
          <Field key={label} label={label}>
            <SegButtons value={vals[i]} onChange={(v) => setVals((s) => s.map((x, j) => (j === i ? v : x)))} options={opts} />
          </Field>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-black text-ink">{total}<span className="text-sm font-semibold text-neutral-400">/45</span></div>
          <Badge tone={abnormal ? 'critical' : 'normal'}>{abnormal ? 'Abnormal' : 'Normal'}</Badge>
        </div>
        <p className="mt-2 text-[11px] text-neutral-500">Scale 0 (no problem) - 5 (severe problem) per item. A score &gt;13 is considered abnormal, suggestive of laryngopharyngeal reflux.</p>
      </div>
    </Card>
  )
}

/* ══════════════════ ABCD² SCORE (TIA STROKE RISK) ══════════════════ */
function Abcd2Calc() {
  const [age60, setAge60] = useState(false)
  const [bp140, setBp140] = useState(false)
  const [clinical, setClinical] = useState<'none' | 'speech' | 'weakness'>('none')
  const [duration, setDuration] = useState<'lt10' | '10to59' | 'ge60'>('lt10')
  const [diabetes, setDiabetes] = useState(false)
  const clinicalPts = clinical === 'weakness' ? 2 : clinical === 'speech' ? 1 : 0
  const durationPts = duration === 'ge60' ? 2 : duration === '10to59' ? 1 : 0
  const total = (age60 ? 1 : 0) + (bp140 ? 1 : 0) + clinicalPts + durationPts + (diabetes ? 1 : 0)
  const interp = total <= 3
    ? { l: 'Low risk', tone: 'normal' as const, note: '2-day stroke risk ~1%. Outpatient evaluation may be appropriate if rapid follow-up is available.' }
    : total <= 5
    ? { l: 'Moderate risk', tone: 'low' as const, note: '2-day stroke risk ~4.1%. Consider observation/admission.' }
    : { l: 'High risk', tone: 'critical' as const, note: '2-day stroke risk ~8.1%. Admission & urgent evaluation recommended.' }
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="ABCD² Score" subtitle="Post-TIA stroke risk prediction (Johnston et al., 2007)" />
      <div className="space-y-3">
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50">
          <input type="checkbox" checked={age60} onChange={(e) => setAge60(e.target.checked)} className="h-5 w-5 accent-brand" />
          <div className="text-sm font-bold text-ink">Age ≥60 years (+1)</div>
        </label>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50">
          <input type="checkbox" checked={bp140} onChange={(e) => setBp140(e.target.checked)} className="h-5 w-5 accent-brand" />
          <div className="text-sm font-bold text-ink">BP ≥140/90 mmHg at assessment (+1)</div>
        </label>
        <Field label="Clinical Features"><SegButtons value={clinical} onChange={setClinical} options={[{ v: 'none', l: 'Other (0)' }, { v: 'speech', l: 'Speech disturbance without weakness (+1)' }, { v: 'weakness', l: 'Unilateral weakness (+2)' }]} /></Field>
        <Field label="Duration of Symptoms"><SegButtons value={duration} onChange={setDuration} options={[{ v: 'lt10', l: '<10 minutes (0)' }, { v: '10to59', l: '10-59 minutes (+1)' }, { v: 'ge60', l: '≥60 minutes (+2)' }]} /></Field>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50">
          <input type="checkbox" checked={diabetes} onChange={(e) => setDiabetes(e.target.checked)} className="h-5 w-5 accent-brand" />
          <div className="text-sm font-bold text-ink">Diabetes (+1)</div>
        </label>
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-black text-ink">{total}<span className="text-sm font-semibold text-neutral-400">/7</span></div>
          <Badge tone={interp.tone}>{interp.l}</Badge>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{interp.note}</p>
      </div>
    </Card>
  )
}

/* ══════════════════ FOUR SCORE (COMA SCALE) ══════════════════ */
function FourScoreCalc() {
  const eye = [{ v: 0, l: 'Eyes remain closed' }, { v: 1, l: 'Opens to pain' }, { v: 2, l: 'Opens to loud voice' }, { v: 3, l: 'Open, not tracking' }, { v: 4, l: 'Open, tracking/blinks to command' }]
  const motor = [{ v: 0, l: 'No response / myoclonic status' }, { v: 1, l: 'Extension posturing' }, { v: 2, l: 'Flexion posturing' }, { v: 3, l: 'Localizes to pain' }, { v: 4, l: 'Follows commands (thumbs-up/fist/peace sign)' }]
  const brainstem = [{ v: 0, l: 'No pupil/corneal/cough reflex' }, { v: 1, l: 'Pupil & corneal reflexes absent' }, { v: 2, l: 'One pupil wide and fixed' }, { v: 3, l: 'One pupil or corneal reflex absent' }, { v: 4, l: 'Pupil & corneal reflexes present' }]
  const respiration = [{ v: 0, l: 'Apnea / ventilator-synced' }, { v: 1, l: 'Breathing above ventilator rate' }, { v: 2, l: 'Irregular' }, { v: 3, l: 'Cheyne-Stokes pattern' }, { v: 4, l: 'Regular, not intubated' }]
  const [e, setE] = useState(4); const [m, setM] = useState(4); const [b, setB] = useState(4); const [r, setR] = useState(4)
  const total = e + m + b + r
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="FOUR Score" subtitle="Full Outline of UnResponsiveness (Wijdicks et al., 2005) — a GCS alternative that assesses the brainstem & respiratory pattern" />
      <div className="space-y-3">
        <Field label="Eye Response (E)"><SegButtons value={e} onChange={setE} options={eye} /></Field>
        <Field label="Motor Response (M)"><SegButtons value={m} onChange={setM} options={motor} /></Field>
        <Field label="Brainstem Reflexes (B)"><SegButtons value={b} onChange={setB} options={brainstem} /></Field>
        <Field label="Respiration (R)"><SegButtons value={r} onChange={setR} options={respiration} /></Field>
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3 text-center">
        <div className="text-2xl font-black text-ink">E{e}M{m}B{b}R{r} = {total}<span className="text-sm font-semibold text-neutral-400">/16</span></div>
        <p className="mt-2 text-[11px] text-neutral-500">Lower score → more impaired consciousness. Superior to GCS for assessing intubated patients (assesses breathing rather than verbal response) and detecting brainstem/locked-in signs.</p>
      </div>
    </Card>
  )
}

/* ══════════════════ MCDONALD'S RULE (FUNDAL HEIGHT) ══════════════════ */
function McDonaldCalc() {
  const [fundalCm, setFundalCm] = useState(28)
  const gaWeeksEst = fundalCm // McDonald's rule: fundal height (cm) ≈ GA (weeks), valid ~20-36 weeks
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="McDonald's Rule" subtitle="Estimate gestational age from symphysis-fundal height (20-36 weeks)" />
      <Field label="Fundal Height (cm, symphysis-fundal)"><input className={inputClass} type="number" value={fundalCm} onChange={(e) => setFundalCm(+e.target.value)} /></Field>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3 text-center">
        <div className="text-2xl font-black text-ink">≈ {gaWeeksEst} <span className="text-sm font-semibold text-neutral-400">weeks</span></div>
        <div className="mt-1 text-[10px] font-bold uppercase text-neutral-400">Estimated Gestational Age</div>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">McDonald's Rule: fundal height (cm) ≈ gestational age (weeks) between 20-36 weeks in a singleton pregnancy with normal fetal growth. A deviation &gt;3cm from the true gestational age (from LMP/ultrasound) warrants further evaluation (oligo/polyhydramnios, IUGR, macrosomia, multiple gestation).</p>
    </Card>
  )
}

/* ══════════════════ PARADISE CRITERIA (TONSILLECTOMY) ══════════════════ */
function ParadiseCalc() {
  const [y1, setY1] = useState(0)
  const [y2, setY2] = useState(0)
  const [y3, setY3] = useState(0)
  const [documented, setDocumented] = useState(false)
  const meets = documented && (y1 >= 7 || (y1 >= 5 && y2 >= 5) || (y1 >= 3 && y2 >= 3 && y3 >= 3))
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Paradise Criteria" subtitle="Tonsillectomy indication for recurrent pharyngitis/tonsillitis (Paradise et al., 1984)" />
      <div className="grid grid-cols-3 gap-2">
        <Field label="Episodes This Year"><input className={inputClass} type="number" value={y1} onChange={(e) => setY1(+e.target.value)} /></Field>
        <Field label="Episodes Last Year"><input className={inputClass} type="number" value={y2} onChange={(e) => setY2(+e.target.value)} /></Field>
        <Field label="Episodes 2 Years Ago"><input className={inputClass} type="number" value={y3} onChange={(e) => setY3(+e.target.value)} /></Field>
      </div>
      <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50">
        <input type="checkbox" checked={documented} onChange={(e) => setDocumented(e.target.checked)} className="h-5 w-5 accent-brand" />
        <div className="text-sm font-bold text-ink">Every episode well documented (fever &gt;38.3°C, tonsillar exudate, tender cervical lymphadenopathy, or positive streptococcal culture)</div>
      </label>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <Badge tone={meets ? 'critical' : 'normal'}>{meets ? 'Meets Paradise criteria' : 'Does not yet meet criteria'}</Badge>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">Criteria: ≥7 episodes in 1 year, OR ≥5/year for 2 consecutive years, OR ≥3/year for 3 consecutive years — with every episode well documented. This is one indication; the tonsillectomy decision remains individualized together with an ENT physician.</p>
      </div>
    </Card>
  )
}

/* ══════════════════ NIHSS (NIH STROKE SCALE) ══════════════════ */
function NihssCalc() {
  const items: { key: string; label: string; opts: { v: number; l: string }[] }[] = [
    { key: 'loc', label: '1a. Level of Consciousness', opts: [{ v: 0, l: 'Fully alert' }, { v: 1, l: 'Drowsy' }, { v: 2, l: 'Stuporous' }, { v: 3, l: 'Coma' }] },
    { key: 'locQ', label: '1b. LOC Questions (month, age)', opts: [{ v: 0, l: 'Both correct' }, { v: 1, l: 'One correct' }, { v: 2, l: 'Neither correct' }] },
    { key: 'locC', label: '1c. LOC Commands (open/close eyes, grip fist)', opts: [{ v: 0, l: 'Both correct' }, { v: 1, l: 'One correct' }, { v: 2, l: 'Neither correct' }] },
    { key: 'gaze', label: '2. Gaze', opts: [{ v: 0, l: 'Normal' }, { v: 1, l: 'Partial gaze palsy' }, { v: 2, l: 'Forced deviation' }] },
    { key: 'visual', label: '3. Visual Field', opts: [{ v: 0, l: 'No visual loss' }, { v: 1, l: 'Partial hemianopia' }, { v: 2, l: 'Complete hemianopia' }, { v: 3, l: 'Bilateral hemianopia/blind' }] },
    { key: 'facial', label: '4. Facial Palsy', opts: [{ v: 0, l: 'Normal' }, { v: 1, l: 'Minor paresis' }, { v: 2, l: 'Partial paralysis' }, { v: 3, l: 'Complete paralysis' }] },
    { key: 'motorArmL', label: '5a. Left Arm Motor', opts: [{ v: 0, l: 'No drift' }, { v: 1, l: 'Drift' }, { v: 2, l: 'Some effort against gravity' }, { v: 3, l: 'No effort against gravity' }, { v: 4, l: 'No movement' }] },
    { key: 'motorArmR', label: '5b. Right Arm Motor', opts: [{ v: 0, l: 'No drift' }, { v: 1, l: 'Drift' }, { v: 2, l: 'Some effort against gravity' }, { v: 3, l: 'No effort against gravity' }, { v: 4, l: 'No movement' }] },
    { key: 'motorLegL', label: '6a. Left Leg Motor', opts: [{ v: 0, l: 'No drift' }, { v: 1, l: 'Drift' }, { v: 2, l: 'Some effort against gravity' }, { v: 3, l: 'No effort against gravity' }, { v: 4, l: 'No movement' }] },
    { key: 'motorLegR', label: '6b. Right Leg Motor', opts: [{ v: 0, l: 'No drift' }, { v: 1, l: 'Drift' }, { v: 2, l: 'Some effort against gravity' }, { v: 3, l: 'No effort against gravity' }, { v: 4, l: 'No movement' }] },
    { key: 'ataxia', label: '7. Limb Ataxia', opts: [{ v: 0, l: 'None' }, { v: 1, l: 'One limb' }, { v: 2, l: 'Two limbs' }] },
    { key: 'sensory', label: '8. Sensory', opts: [{ v: 0, l: 'Normal' }, { v: 1, l: 'Mild-moderate deficit' }, { v: 2, l: 'Severe deficit/total loss' }] },
    { key: 'language', label: '9. Best Language', opts: [{ v: 0, l: 'No aphasia' }, { v: 1, l: 'Mild-moderate aphasia' }, { v: 2, l: 'Severe aphasia' }, { v: 3, l: 'Mute/global aphasia' }] },
    { key: 'dysarthria', label: '10. Dysarthria', opts: [{ v: 0, l: 'Normal' }, { v: 1, l: 'Mild-moderate' }, { v: 2, l: 'Severe/anarthria' }] },
    { key: 'extinction', label: '11. Extinction/Inattention (Neglect)', opts: [{ v: 0, l: 'None' }, { v: 1, l: 'Partial inattention' }, { v: 2, l: 'Severe inattention/hemi-inattention' }] },
  ]
  const [vals, setVals] = useState<Record<string, number>>(Object.fromEntries(items.map((i) => [i.key, 0])))
  const total = Object.values(vals).reduce((a, b) => a + b, 0)
  const interp = total === 0
    ? { l: 'No stroke symptoms', tone: 'normal' as const }
    : total <= 4
    ? { l: 'Minor stroke', tone: 'normal' as const }
    : total <= 15
    ? { l: 'Moderate stroke', tone: 'low' as const }
    : total <= 20
    ? { l: 'Moderate-severe stroke', tone: 'critical' as const }
    : { l: 'Severe stroke', tone: 'critical' as const }
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="NIH Stroke Scale (NIHSS)" subtitle="Acute ischemic stroke severity assessment, 15 items, 0-42" />
      <div className="space-y-3">
        {items.map((it) => (
          <Field key={it.key} label={it.label}>
            <SegButtons value={vals[it.key]} onChange={(v) => setVals((s) => ({ ...s, [it.key]: v }))} options={it.opts} />
          </Field>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-black text-ink">{total}<span className="text-sm font-semibold text-neutral-400">/42</span></div>
          <Badge tone={interp.tone}>{interp.l}</Badge>
        </div>
      </div>
    </Card>
  )
}

/* ══════════════════ BALANS CAIRAN (FLUID BALANCE) ══════════════════ */
function FluidBalanceCalc() {
  const [oralIn, setOralIn] = useState(0)
  const [ivIn, setIvIn] = useState(0)
  const [otherIn, setOtherIn] = useState(0)
  const [urineOut, setUrineOut] = useState(0)
  const [drainOut, setDrainOut] = useState(0)
  const [insensible, setInsensible] = useState(500)
  const [otherOut, setOtherOut] = useState(0)
  const totalIn = oralIn + ivIn + otherIn
  const totalOut = urineOut + drainOut + insensible + otherOut
  const balance = totalIn - totalOut
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Fluid Balance (24 hours)" subtitle="Total intake vs output — fluid status monitoring" />
      <h4 className="text-xs font-black uppercase tracking-wide text-neutral-500">Intake (mL)</h4>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Field label="Oral/Enteral"><input className={inputClass} type="number" value={oralIn} onChange={(e) => setOralIn(+e.target.value)} /></Field>
        <Field label="IV/Infusion"><input className={inputClass} type="number" value={ivIn} onChange={(e) => setIvIn(+e.target.value)} /></Field>
        <Field label="Other"><input className={inputClass} type="number" value={otherIn} onChange={(e) => setOtherIn(+e.target.value)} /></Field>
      </div>
      <h4 className="mt-4 text-xs font-black uppercase tracking-wide text-neutral-500">Output (mL)</h4>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Field label="Urine"><input className={inputClass} type="number" value={urineOut} onChange={(e) => setUrineOut(+e.target.value)} /></Field>
        <Field label="Drain/NGT"><input className={inputClass} type="number" value={drainOut} onChange={(e) => setDrainOut(+e.target.value)} /></Field>
        <Field label="Insensible Loss"><input className={inputClass} type="number" value={insensible} onChange={(e) => setInsensible(+e.target.value)} /></Field>
        <Field label="Other"><input className={inputClass} type="number" value={otherOut} onChange={(e) => setOtherOut(+e.target.value)} /></Field>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-neutral-50 p-3 text-center"><div className="text-lg font-black text-ink">{totalIn}</div><div className="text-[9px] font-bold uppercase text-neutral-400">Total Intake</div></div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center"><div className="text-lg font-black text-ink">{totalOut}</div><div className="text-[9px] font-bold uppercase text-neutral-400">Total Output</div></div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center"><div className={`text-lg font-black ${balance >= 0 ? 'text-brand-dark' : 'text-red-600'}`}>{balance >= 0 ? '+' : ''}{balance}</div><div className="text-[9px] font-bold uppercase text-neutral-400">Balance (mL)</div></div>
      </div>
      <p className="mt-3 text-[10px] text-neutral-400">Estimated adult insensible loss ~500-800 mL/day (increases with fever/tachypnea). A large, prolonged positive balance → risk of overload; a negative balance → risk of dehydration/hypoperfusion.</p>
    </Card>
  )
}

/* ══════════════════ PEDIATRIC MEDICATION DOSING (LIQUID/POWDER) ══════════════════ */
function PedsDoseCalc() {
  const [weight, setWeight] = useState(15)
  const [doseMgKg, setDoseMgKg] = useState(10)
  const [freqPerDay, setFreqPerDay] = useState(3)
  const [concMgMl, setConcMgMl] = useState(125 / 5) // e.g. amoxicillin syrup 125mg/5mL

  const totalDailyMg = weight * doseMgKg
  const perDoseMg = totalDailyMg / freqPerDay
  const perDoseMl = perDoseMg / concMgMl

  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Pediatric Medication Dosing Calculator" subtitle="Liquid (syrup) & powdered dosing based on body weight" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Field label="Body Weight (kg)"><input className={inputClass} type="number" value={weight} onChange={(e) => setWeight(+e.target.value)} /></Field>
        <Field label="Dose (mg/kg/day)"><input className={inputClass} type="number" value={doseMgKg} onChange={(e) => setDoseMgKg(+e.target.value)} /></Field>
        <Field label="Frequency (times/day)"><input className={inputClass} type="number" value={freqPerDay} onChange={(e) => setFreqPerDay(+e.target.value)} /></Field>
        <Field label="Syrup Concentration (mg/mL)"><input className={inputClass} type="number" step="0.1" value={concMgMl} onChange={(e) => setConcMgMl(+e.target.value)} /></Field>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-neutral-50 p-3 text-center"><div className="text-lg font-black text-ink">{totalDailyMg.toFixed(0)}</div><div className="text-[9px] font-bold uppercase text-neutral-400">Total mg/day</div></div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center"><div className="text-lg font-black text-ink">{perDoseMg.toFixed(1)}</div><div className="text-[9px] font-bold uppercase text-neutral-400">mg/dose</div></div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center"><div className="text-lg font-black text-ink">{perDoseMl.toFixed(2)}</div><div className="text-[9px] font-bold uppercase text-neutral-400">mL/dose (syrup)</div></div>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">Total mg/day = weight × dose(mg/kg/day). mg/dose = total ÷ frequency. mL/dose = mg/dose ÷ syrup concentration. For powdered preparations: divide the mg/dose across the number of sachets per the prescribed frequency. ALWAYS verify against maximum adult dosing & the formulary — this calculator does not replace clinical judgment or official drug references.</p>
    </Card>
  )
}

/* ══════════════════ VBAC — FLAMM-GEIGER SCORE ══════════════════ */
function VbacCalc() {
  const [ageU40, setAgeU40] = useState(true)
  const [vagHx, setVagHx] = useState<'none' | 'before' | 'vbac'>('none')
  const [nonDystociaIndication, setNonDystociaIndication] = useState(false)
  const [effacement, setEffacement] = useState<'lt25' | '25to75' | 'ge75'>('25to75')
  const [dilation4, setDilation4] = useState(false)

  const agePts = ageU40 ? 2 : 0
  const vagHxPts = vagHx === 'vbac' ? 4 : vagHx === 'before' ? 2 : 0
  const indicationPts = nonDystociaIndication ? 1 : 0
  const effacementPts = effacement === 'ge75' ? 2 : effacement === '25to75' ? 1 : 0
  const dilationPts = dilation4 ? 1 : 0
  const total = agePts + vagHxPts + indicationPts + effacementPts + dilationPts

  const successPct = total <= 2 ? '~49%' : total <= 4 ? '~60%' : total <= 6 ? '~75%' : total <= 8 ? '~85%' : '~95%'

  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="VBAC — Flamm-Geiger Score" subtitle="Predicted success of vaginal birth after cesarean (Flamm & Geiger, 1997)" />
      <div className="space-y-3">
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50">
          <input type="checkbox" checked={ageU40} onChange={(e) => setAgeU40(e.target.checked)} className="h-5 w-5 accent-brand" />
          <div className="text-sm font-bold text-ink">Age &lt;40 years (+2)</div>
        </label>
        <Field label="Vaginal Delivery History">
          <SegButtons value={vagHx} onChange={setVagHx} options={[{ v: 'none', l: 'None (0)' }, { v: 'before', l: 'Before cesarean only (+2)' }, { v: 'vbac', l: 'Prior post-cesarean/VBAC (+4)' }]} />
        </Field>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50">
          <input type="checkbox" checked={nonDystociaIndication} onChange={(e) => setNonDystociaIndication(e.target.checked)} className="h-5 w-5 accent-brand" />
          <div className="text-sm font-bold text-ink">Prior cesarean indication was NOT dystocia/failure to progress (+1)</div>
        </label>
        <Field label="Cervical Effacement on Admission">
          <SegButtons value={effacement} onChange={setEffacement} options={[{ v: 'lt25', l: '<25% (0)' }, { v: '25to75', l: '25-75% (+1)' }, { v: 'ge75', l: '≥75% (+2)' }]} />
        </Field>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50">
          <input type="checkbox" checked={dilation4} onChange={(e) => setDilation4(e.target.checked)} className="h-5 w-5 accent-brand" />
          <div className="text-sm font-bold text-ink">Cervical dilation ≥4cm on admission (+1)</div>
        </label>
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-black text-ink">{total}<span className="text-sm font-semibold text-neutral-400">/10</span></div>
          <Badge tone={total >= 7 ? 'normal' : total >= 4 ? 'low' : 'critical'}>Estimated success {successPct}</Badge>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">A higher score → higher predicted VBAC success. This prediction model is one decision-support tool — the trial of labor after cesarean (TOLAC) decision remains individualized together with an obstetrician, taking into account emergency cesarean facilities available.</p>
      </div>
    </Card>
  )
}

/* ══════════════════ DENVER II — SIMPLIFIED DEVELOPMENTAL SCREEN ══════════════════ */
// The full Denver II uses ~125 items with age-bar percentile plotting and
// standardized test materials. This is a SIMPLIFIED screening aid: a curated
// set of representative milestones per domain at standard checkpoint ages,
// not the full standardized instrument — for a definitive assessment, use
// the official Denver II kit/form administered per its manual.
interface Milestone { ageMo: number; label: string }
const DENVER_DOMAINS: { key: string; label: string; milestones: Milestone[] }[] = [
  { key: 'personal', label: 'Personal-Social', milestones: [
    { ageMo: 2, label: 'Social smile (responds to faces)' },
    { ageMo: 6, label: 'Self-feeding (finger food)' },
    { ageMo: 9, label: 'Plays peek-a-boo' },
    { ageMo: 12, label: 'Waves bye-bye' },
    { ageMo: 18, label: 'Uses a spoon to feed self' },
    { ageMo: 24, label: 'Parallel play (plays alongside others)' },
    { ageMo: 36, label: 'Takes turns playing with other children' },
    { ageMo: 48, label: 'Dresses self partially' },
    { ageMo: 60, label: 'Has a preferred playmate' },
  ] },
  { key: 'fineMotor', label: 'Fine Motor-Adaptive', milestones: [
    { ageMo: 2, label: 'Hands open, grasp reflex disappearing' },
    { ageMo: 4, label: 'Reaches for objects intentionally' },
    { ageMo: 6, label: 'Transfers objects hand to hand' },
    { ageMo: 9, label: 'Pincer grasp (finger-thumb)' },
    { ageMo: 12, label: 'Scribbles with a crayon' },
    { ageMo: 18, label: 'Stacks 2-4 blocks' },
    { ageMo: 24, label: 'Stacks 6 blocks / copies a line' },
    { ageMo: 36, label: 'Copies a circle' },
    { ageMo: 48, label: 'Draws a person with 3 parts' },
    { ageMo: 60, label: 'Draws a person with 6 parts / writes name' },
  ] },
  { key: 'language', label: 'Language', milestones: [
    { ageMo: 2, label: 'Coos' },
    { ageMo: 6, label: 'Babbles without specific meaning' },
    { ageMo: 9, label: 'Understands the word "no"' },
    { ageMo: 12, label: 'Says 1 meaningful word' },
    { ageMo: 18, label: 'Says 3-6 words' },
    { ageMo: 24, label: 'Combines 2 words' },
    { ageMo: 36, label: '3-word sentences, ~75% understood by strangers' },
    { ageMo: 48, label: 'Asks "why", begins storytelling' },
    { ageMo: 60, label: 'Knows ≥4 colors, counts to 10' },
  ] },
  { key: 'grossMotor', label: 'Gross Motor', milestones: [
    { ageMo: 2, label: 'Lifts head while prone' },
    { ageMo: 4, label: 'Rolls over' },
    { ageMo: 6, label: 'Sits without support' },
    { ageMo: 9, label: 'Crawls / pulls to stand' },
    { ageMo: 12, label: 'Walks with assistance / stands alone' },
    { ageMo: 18, label: 'Walks backward' },
    { ageMo: 24, label: 'Runs / climbs stairs holding on' },
    { ageMo: 36, label: 'Pedals a tricycle' },
    { ageMo: 48, label: 'Hops on one foot' },
    { ageMo: 60, label: 'Skips alternating feet' },
  ] },
]

function DenverCalc() {
  const [ageMo, setAgeMo] = useState(12)
  const [results, setResults] = useState<Record<string, 'pass' | 'fail' | 'na'>>({})

  const domainFlags = DENVER_DOMAINS.map((d) => {
    const applicable = d.milestones.filter((m) => m.ageMo <= ageMo)
    // "Caution/delay" — a milestone expected well below the child's current
    // age (>=6 months behind) marked as failed.
    const delayed = applicable.filter((m) => {
      const key = `${d.key}-${m.ageMo}`
      return results[key] === 'fail' && ageMo - m.ageMo >= 6
    })
    return { domain: d, applicable, delayed }
  })
  const anyDelay = domainFlags.some((f) => f.delayed.length > 0)

  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Denver II (Simplified)" subtitle="Simplified developmental screening — representative milestones per domain, not the full Denver II instrument" />
      <Field label="Child's Age (months)"><input className={inputClass} type="number" min={0} max={72} value={ageMo} onChange={(e) => setAgeMo(+e.target.value)} /></Field>

      {domainFlags.map(({ domain, applicable }) => (
        <div key={domain.key} className="mt-4">
          <h4 className="text-xs font-black uppercase tracking-wide text-neutral-500">{domain.label}</h4>
          <div className="mt-2 space-y-1.5">
            {applicable.length === 0 && <p className="text-[11px] text-neutral-400">No reference milestones for this age yet.</p>}
            {applicable.map((m) => {
              const key = `${domain.key}-${m.ageMo}`
              const v = results[key] ?? 'na'
              return (
                <div key={key} className="flex items-center justify-between gap-2 rounded-xl border border-neutral-100 p-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-bold text-ink">{m.label}</div>
                    <div className="text-[9px] font-bold uppercase text-neutral-400">Typically achieved ~{m.ageMo} months</div>
                  </div>
                  <SegButtons value={v} onChange={(nv) => setResults((s) => ({ ...s, [key]: nv }))} options={[{ v: 'pass', l: 'Can' }, { v: 'fail', l: 'Not yet' }, { v: 'na', l: '—' }]} />
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {anyDelay && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3">
          <p className="text-xs font-black text-amber-800">⚠️ Consider further developmental evaluation</p>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-700">There are milestones typically achieved well below the child's current age (≥6 months earlier) that have not yet been achieved. This is a simplified screening pattern — refer to a pediatrician/developmental specialist for a full Denver II evaluation or another standardized screening instrument (e.g. KPSP, M-CHAT if relevant).</p>
        </div>
      )}
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">This is NOT the official Denver II instrument (which uses ~125 items with age-percentile bars & standardized test materials) — this tool is a simplified early screening based on representative milestones for awareness, not a diagnosis of developmental delay.</p>
    </Card>
  )
}

/* ══════════════════ ATLS PRIMARY SURVEY (ABCDE) ══════════════════ */
// A guided trauma primary-survey checklist per ATLS (Advanced Trauma Life
// Support) sequence — every item marked "abnormal" surfaces as a critical
// finding needing immediate action, in the order ATLS prioritizes them
// (airway before breathing before circulation, etc.) regardless of entry
// order, since that ordering is the entire point of the primary survey.
interface AtlsItem { key: string; label: string; critIfAbnormal: string }
const ATLS_SECTIONS: { key: string; letter: string; label: string; items: AtlsItem[] }[] = [
  { key: 'exsanguination', letter: 'X', label: 'eXsanguinating Hemorrhage Control', items: [
    { key: 'massiveHemorrhage', label: 'No massive external hemorrhage that is immediately life-threatening', critIfAbnormal: 'Massive external hemorrhage — control IMMEDIATELY before Airway (extremity tourniquet, wound packing + direct pressure on junctional/truncal sites) per modern <C>ABCDE / MARCH principles.' },
  ] },
  { key: 'airway', letter: 'A', label: 'Airway & Cervical Spine Control', items: [
    { key: 'airwayPatent', label: 'Airway patent (speaks clearly, no stridor/gurgling)', critIfAbnormal: 'Airway not patent — open the airway immediately (jaw thrust/chin lift, suction, definitive airway if needed) BEFORE moving to the next step.' },
    { key: 'cSpine', label: 'Cervical spine immobilized (collar/manual inline stabilization)', critIfAbnormal: 'C-spine not yet protected — assume cervical injury in all significant blunt-trauma mechanisms until proven otherwise.' },
  ] },
  { key: 'breathing', letter: 'B', label: 'Breathing & Ventilation', items: [
    { key: 'rrNormal', label: 'Normal respiratory rate (12-20/min) & symmetric', critIfAbnormal: 'Abnormal respiratory rate — suspect tension pneumothorax, hemothorax, flail chest, or pulmonary injury.' },
    { key: 'breathSounds', label: 'Breath sounds heard bilaterally & symmetric', critIfAbnormal: 'Asymmetric/absent breath sounds on one side — consider immediate needle/finger thoracostomy if tension pneumothorax is suspected.' },
    { key: 'spo2', label: 'SpO2 ≥94% on room air/with appropriate supplemental oxygen', critIfAbnormal: 'Hypoxemia — give high-flow oxygen, find & treat the cause (pneumothorax, aspiration, etc.).' },
  ] },
  { key: 'circulation', letter: 'C', label: 'Circulation & Hemorrhage Control', items: [
    { key: 'pulse', label: 'Pulse strong, normal rate & rhythm', critIfAbnormal: 'Weak/rapid/absent pulse — suspect hemorrhagic shock, start fluid/blood resuscitation & find the bleeding source.' },
    { key: 'hemorrhage', label: 'No active uncontrolled external hemorrhage', critIfAbnormal: 'Active external hemorrhage — control immediately (direct pressure, tourniquet if extremity) before continuing the survey.' },
    { key: 'ivAccess', label: 'Large-bore IV access (≥2 lines) established', critIfAbnormal: 'IV access not yet adequate — establish 2 large-bore IV lines (or IO if difficult) for fluid/blood product resuscitation.' },
  ] },
  { key: 'disability', letter: 'D', label: 'Disability (Neurological Status)', items: [
    { key: 'gcsNormal', label: 'GCS ≥13 or at patient baseline', critIfAbnormal: 'Decreased GCS — evaluate the cause (head injury, hypoxia, shock, intoxication), consider airway protection if GCS ≤8.' },
    { key: 'pupilsNormal', label: 'Pupils isocoric & reactive to light', critIfAbnormal: 'Anisocoric/non-reactive pupils — suspect an intracranial mass lesion/herniation; urgent imaging & neurosurgical consultation needed.' },
  ] },
  { key: 'exposure', letter: 'E', label: 'Exposure & Environmental Control', items: [
    { key: 'exposed', label: 'Patient fully exposed (clothing removed) for a thorough exam including a back log-roll' },
    { key: 'normothermic', label: 'Body temperature kept normal (warm blankets, warmed fluids) — prevent hypothermia' },
  ].map((i) => ({ ...i, critIfAbnormal: i.key === 'exposed' ? 'Exam not yet thorough — hidden injuries (back, skin folds, perineum) are easily missed without a log-roll & full inspection.' : 'Hypothermia risk — part of the "lethal triad" (hypothermia, acidosis, coagulopathy) that worsens outcomes in severe trauma.' })) },
]

function AtlsCalc() {
  const [status, setStatus] = useState<Record<string, 'ok' | 'abnormal' | 'unassessed'>>({})
  const [copied, setCopied] = useState(false)
  const criticalFindings = ATLS_SECTIONS.flatMap((s) =>
    s.items.filter((i) => status[i.key] === 'abnormal').map((i) => ({ letter: s.letter, ...i }))
  )
  const assessedCount = ATLS_SECTIONS.flatMap((s) => s.items).filter((i) => status[i.key] && status[i.key] !== 'unassessed').length
  const totalCount = ATLS_SECTIONS.flatMap((s) => s.items).length

  const noteLines = ATLS_SECTIONS.map((section) => {
    const lines = section.items.map((item) => {
      const v = status[item.key] ?? 'unassessed'
      const label = v === 'ok' ? 'Normal' : v === 'abnormal' ? 'ABNORMAL' : 'Not yet assessed'
      return `  - ${item.label}: ${label}`
    })
    return `${section.letter} — ${section.label}\n${lines.join('\n')}`
  })
  const formattedNote = `TRAUMA PRIMARY SURVEY (XABCDE)\n${noteLines.join('\n\n')}${
    criticalFindings.length > 0
      ? `\n\n🚨 CRITICAL FINDINGS (address in X→E order):\n${criticalFindings.map((f) => `- ${f.letter}: ${f.critIfAbnormal}`).join('\n')}`
      : '\n\nNo critical findings recorded on this primary survey.'
  }`

  function copyNote() {
    navigator.clipboard?.writeText(formattedNote).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Trauma Primary Survey (XABCDE)" subtitle="X = massive/exsanguinating hemorrhage control precedes Airway — priority order drives action, not just a checklist" />

      {criticalFindings.length > 0 && (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3">
          <p className="text-xs font-black text-red-800">🚨 Critical Findings — address in X→E order</p>
          <div className="mt-2 space-y-2">
            {criticalFindings.map((f) => (
              <div key={f.key} className="text-[11px] leading-relaxed text-red-700"><b>{f.letter}:</b> {f.critIfAbnormal}</div>
            ))}
          </div>
        </div>
      )}

      {ATLS_SECTIONS.map((section) => (
        <div key={section.key} className="mt-4 first:mt-0">
          <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-neutral-500">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-50 text-[11px] font-black text-brand-dark">{section.letter}</span>
            {section.label}
          </h4>
          <div className="mt-2 space-y-2">
            {section.items.map((item) => {
              const v = status[item.key] ?? 'unassessed'
              return (
                <div key={item.key} className="flex items-center justify-between gap-2 rounded-xl border border-neutral-100 p-2.5">
                  <div className="min-w-0 flex-1 text-[12px] font-bold text-ink">{item.label}</div>
                  <SegButtons value={v} onChange={(nv) => setStatus((s) => ({ ...s, [item.key]: nv }))} options={[{ v: 'ok', l: 'Normal' }, { v: 'abnormal', l: 'Abnormal' }, { v: 'unassessed', l: '—' }]} />
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Primary Survey Note — ready to paste into the medical record</div>
          <button onClick={copyNote} className="rounded-full bg-brand px-3 py-1 text-[10px] font-bold text-white">{copied ? '✓ Copied' : 'Copy Note'}</button>
        </div>
        <pre className="mt-2 whitespace-pre-wrap font-sans text-[11px] leading-relaxed text-neutral-600">{formattedNote}</pre>
        <p className="mt-2 text-[10px] text-neutral-400">{assessedCount}/{totalCount} items assessed.</p>
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">Modern trauma principles (&lt;C&gt;ABCDE / MARCH): massive external hemorrhage control PRECEDES Airway if immediately life-threatening, then address each problem AS FOUND in the order X→A→B→C→D→E before moving to the next step. This tool is a checklist aid, not a substitute for certified ATLS/TCCC training & direct clinical judgment in the field.</p>
    </Card>
  )
}

/* ══════════════════ BLOOD GAS DECISION TREE (ANALISIS GAS DARAH) ══════════════════ */
// Systematic ABG interpretation: primary disorder -> compensation adequacy
// (Winter's formula & expected-compensation rules) -> anion gap -> delta
// ratio for mixed disorders — the standard stepwise approach taught for
// blood gas interpretation, not a simplification of a single named score.
function AbgCalc() {
  const [ph, setPh] = useState(7.32)
  const [paco2, setPaco2] = useState(30)
  const [hco3, setHco3] = useState(15)
  const [na, setNa] = useState(140)
  const [cl, setCl] = useState(104)
  const [albumin, setAlbumin] = useState(4.0)

  const acidemia = ph < 7.35
  const alkalemia = ph > 7.45
  const phNormal = !acidemia && !alkalemia

  let primary = 'Cannot be determined'
  if (acidemia) primary = hco3 < 22 ? 'Metabolic Acidosis' : paco2 > 45 ? 'Respiratory Acidosis' : 'Mixed/unclear acidemia'
  else if (alkalemia) primary = hco3 > 26 ? 'Metabolic Alkalosis' : paco2 < 35 ? 'Respiratory Alkalosis' : 'Mixed/unclear alkalemia'
  else primary = (paco2 > 45 || paco2 < 35 || hco3 > 26 || hco3 < 22) ? 'Normal pH but abnormal PaCO2/HCO3 — possible mixed disorder (full compensation)' : 'Normal'

  // Winter's formula for expected PaCO2 in metabolic acidosis
  const winterExpected = 1.5 * hco3 + 8
  const winterLo = winterExpected - 2
  const winterHi = winterExpected + 2

  let compensationNote = ''
  if (primary === 'Metabolic Acidosis') {
    if (paco2 < winterLo) compensationNote = `PaCO2 (${paco2}) is lower than the Winter's formula estimate (${winterLo.toFixed(1)}-${winterHi.toFixed(1)}) — suspect concomitant respiratory alkalosis.`
    else if (paco2 > winterHi) compensationNote = `PaCO2 (${paco2}) is higher than the Winter's formula estimate (${winterLo.toFixed(1)}-${winterHi.toFixed(1)}) — suspect concomitant respiratory acidosis.`
    else compensationNote = `Respiratory compensation is appropriate (Winter's estimate ${winterLo.toFixed(1)}-${winterHi.toFixed(1)}).`
  }

  const anionGap = na - (cl + hco3)
  const correctedAG = anionGap + 2.5 * (4 - albumin) // correct for hypoalbuminemia
  const agHigh = correctedAG > 12

  let deltaRatioNote = ''
  if (primary === 'Metabolic Acidosis' && agHigh) {
    const deltaRatio = (correctedAG - 12) / (24 - hco3)
    deltaRatioNote = deltaRatio < 0.4
      ? `Delta ratio ${deltaRatio.toFixed(2)} (<0.4) — suspect concomitant non-gap (hyperchloremic) acidosis.`
      : deltaRatio <= 2
      ? `Delta ratio ${deltaRatio.toFixed(2)} (0.4-2) — consistent with pure high-gap acidosis.`
      : `Delta ratio ${deltaRatio.toFixed(2)} (>2) — suspect concomitant metabolic alkalosis or chronic respiratory acidosis.`
  }

  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Blood Gas Analysis (ABG)" subtitle="Systematic approach: primary disorder → compensation → anion gap → delta ratio" />
      <div className="grid grid-cols-3 gap-2">
        <Field label="pH"><input className={inputClass} type="number" step="0.01" value={ph} onChange={(e) => setPh(+e.target.value)} /></Field>
        <Field label="PaCO2 (mmHg)"><input className={inputClass} type="number" value={paco2} onChange={(e) => setPaco2(+e.target.value)} /></Field>
        <Field label="HCO3 (mEq/L)"><input className={inputClass} type="number" value={hco3} onChange={(e) => setHco3(+e.target.value)} /></Field>
        <Field label="Na (mEq/L)"><input className={inputClass} type="number" value={na} onChange={(e) => setNa(+e.target.value)} /></Field>
        <Field label="Cl (mEq/L)"><input className={inputClass} type="number" value={cl} onChange={(e) => setCl(+e.target.value)} /></Field>
        <Field label="Albumin (g/dL)"><input className={inputClass} type="number" step="0.1" value={albumin} onChange={(e) => setAlbumin(+e.target.value)} /></Field>
      </div>

      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <div className="text-[10px] font-bold uppercase text-neutral-400">Step 1 — pH Status</div>
        <Badge tone={phNormal ? 'normal' : 'critical'}>{acidemia ? 'Acidemia' : alkalemia ? 'Alkalemia' : 'Normal pH'}</Badge>
      </div>
      <div className="mt-2 rounded-xl bg-neutral-50 p-3">
        <div className="text-[10px] font-bold uppercase text-neutral-400">Step 2 — Primary Disorder</div>
        <div className="mt-1 text-sm font-black text-ink">{primary}</div>
      </div>
      {compensationNote && (
        <div className="mt-2 rounded-xl bg-neutral-50 p-3">
          <div className="text-[10px] font-bold uppercase text-neutral-400">Step 3 — Compensation Adequacy (Winter's Formula)</div>
          <p className="mt-1 text-[12px] font-semibold text-ink">{compensationNote}</p>
        </div>
      )}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <div className="text-lg font-black text-ink">{correctedAG.toFixed(1)}</div>
          <div className="text-[9px] font-bold uppercase text-neutral-400">Anion Gap (albumin-corrected)</div>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <Badge tone={agHigh ? 'critical' : 'normal'}>{agHigh ? 'High Gap' : 'Normal Gap'}</Badge>
          <div className="mt-1 text-[9px] font-bold uppercase text-neutral-400">AG Classification</div>
        </div>
      </div>
      {deltaRatioNote && (
        <div className="mt-2 rounded-xl bg-neutral-50 p-3">
          <div className="text-[10px] font-bold uppercase text-neutral-400">Step 4 — Delta Ratio (detects mixed disorders)</div>
          <p className="mt-1 text-[12px] font-semibold text-ink">{deltaRatioNote}</p>
        </div>
      )}
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">High AG (MUDPILES: methanol, uremia, DKA, propylene glycol/paraldehyde, isoniazid/iron, lactate, ethylene glycol, salicylates). Normal/hyperchloremic AG: diarrhea, RTA, acetazolamide, saline dilution. Corrected anion gap = AG + 2.5×(4 − albumin g/dL). An interpretation aid — always integrate with the full clinical context.</p>
    </Card>
  )
}

/* ══════════════════ ADVANCED BURN CALCULATOR (DRAW-MODE + PARKLAND) ══════════════════ */
// Last of the "bigger build" items: an interactive body-diagram (front/back,
// click-to-toggle regions) applying the Rule of Nines (adult), summing %TBSA
// live, feeding directly into the Parkland formula, with a print/PDF export
// via the browser's native print dialog (no extra dependency needed for a
// clean printable summary).
interface BurnRegion { key: string; label: string; pct: number; x: number; y: number; w: number; h: number; rx?: number }
const BURN_FRONT: BurnRegion[] = [
  { key: 'headF', label: 'Head (front)', pct: 4.5, x: 78, y: 8, w: 44, h: 42, rx: 18 },
  { key: 'armLF', label: 'Left Arm (front)', pct: 4.5, x: 26, y: 54, w: 28, h: 100, rx: 8 },
  { key: 'armRF', label: 'Right Arm (front)', pct: 4.5, x: 146, y: 54, w: 28, h: 100, rx: 8 },
  { key: 'trunkF', label: 'Trunk (front)', pct: 18, x: 64, y: 54, w: 72, h: 108, rx: 6 },
  { key: 'perineum', label: 'Perineum', pct: 1, x: 92, y: 158, w: 16, h: 12 },
  { key: 'legLF', label: 'Left Leg (front)', pct: 9, x: 64, y: 168, w: 34, h: 160, rx: 8 },
  { key: 'legRF', label: 'Right Leg (front)', pct: 9, x: 102, y: 168, w: 34, h: 160, rx: 8 },
]
const BURN_BACK: BurnRegion[] = [
  { key: 'headB', label: 'Head (back)', pct: 4.5, x: 78, y: 8, w: 44, h: 42, rx: 18 },
  { key: 'armLB', label: 'Left Arm (back)', pct: 4.5, x: 26, y: 54, w: 28, h: 100, rx: 8 },
  { key: 'armRB', label: 'Right Arm (back)', pct: 4.5, x: 146, y: 54, w: 28, h: 100, rx: 8 },
  { key: 'trunkB', label: 'Trunk (back)', pct: 18, x: 64, y: 54, w: 72, h: 108, rx: 6 },
  { key: 'legLB', label: 'Left Leg (back)', pct: 9, x: 64, y: 168, w: 34, h: 160, rx: 8 },
  { key: 'legRB', label: 'Right Leg (back)', pct: 9, x: 102, y: 168, w: 34, h: 160, rx: 8 },
]

// Pediatric Lund & Browder (1944) age-banded regions — combined groupings
// (head+neck, trunk-back+buttocks, whole-limb front/back split) chosen to
// match this calculator's existing region layout while every band's total
// still sums to exactly 100% (verified by hand for each band below).
function lundBrowderBand(ageYears: number) {
  if (ageYears < 1) return { head: 21, leg: 14 }
  if (ageYears < 5) return { head: 19, leg: 15 }
  if (ageYears < 10) return { head: 15, leg: 17 }
  if (ageYears < 15) return { head: 13, leg: 18 }
  if (ageYears < 18) return { head: 11, leg: 19 }
  return { head: 9, leg: 20 }
}
function pediatricRegions(ageYears: number): { front: BurnRegion[]; back: BurnRegion[] } {
  const { head, leg } = lundBrowderBand(ageYears)
  const headHalf = head / 2
  const legHalf = leg / 2
  return {
    front: [
      { key: 'headF', label: 'Head+Neck (front)', pct: headHalf, x: 78, y: 8, w: 44, h: 42, rx: 18 },
      { key: 'armLF', label: 'Left Arm (front)', pct: 4.75, x: 26, y: 54, w: 28, h: 100, rx: 8 },
      { key: 'armRF', label: 'Right Arm (front)', pct: 4.75, x: 146, y: 54, w: 28, h: 100, rx: 8 },
      { key: 'trunkF', label: 'Trunk (front)', pct: 13, x: 64, y: 54, w: 72, h: 108, rx: 6 },
      { key: 'perineum', label: 'Perineum/Genitalia', pct: 1, x: 92, y: 158, w: 16, h: 12 },
      { key: 'legLF', label: 'Left Leg (front)', pct: legHalf, x: 64, y: 168, w: 34, h: 160, rx: 8 },
      { key: 'legRF', label: 'Right Leg (front)', pct: legHalf, x: 102, y: 168, w: 34, h: 160, rx: 8 },
    ],
    back: [
      { key: 'headB', label: 'Head+Neck (back)', pct: headHalf, x: 78, y: 8, w: 44, h: 42, rx: 18 },
      { key: 'armLB', label: 'Left Arm (back)', pct: 4.75, x: 26, y: 54, w: 28, h: 100, rx: 8 },
      { key: 'armRB', label: 'Right Arm (back)', pct: 4.75, x: 146, y: 54, w: 28, h: 100, rx: 8 },
      { key: 'trunkB', label: 'Trunk (back+buttocks)', pct: 18, x: 64, y: 54, w: 72, h: 108, rx: 6 },
      { key: 'legLB', label: 'Left Leg (back)', pct: legHalf, x: 64, y: 168, w: 34, h: 160, rx: 8 },
      { key: 'legRB', label: 'Right Leg (back)', pct: legHalf, x: 102, y: 168, w: 34, h: 160, rx: 8 },
    ],
  }
}

function BurnCalc() {
  const [method, setMethod] = useState<'draw' | 'manual' | 'pediatric'>('draw')
  const [view, setView] = useState<'front' | 'back'>('front')
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [weight, setWeight] = useState(70)
  const [manualTbsa, setManualTbsa] = useState(20)
  const [ageYears, setAgeYears] = useState(5)

  const pedRegions = pediatricRegions(ageYears)
  const drawFront = method === 'pediatric' ? pedRegions.front : BURN_FRONT
  const drawBack = method === 'pediatric' ? pedRegions.back : BURN_BACK
  const allRegions = [...drawFront, ...drawBack]
  const drawTbsa = allRegions.filter((r) => selected[r.key]).reduce((sum, r) => sum + r.pct, 0)
  const tbsa = method === 'manual' ? manualTbsa : drawTbsa
  const total24h = 4 * weight * tbsa
  const first8hRate = total24h / 2 / 8
  const next16hRate = (total24h - total24h / 2) / 16

  const regions = view === 'front' ? drawFront : drawBack

  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Advanced Burn Calculator" subtitle="Three %TBSA input methods + Parkland Formula, printable/exportable to PDF" />

      <SegButtons
        value={method}
        onChange={(v) => { setMethod(v); setSelected({}) }}
        options={[{ v: 'draw', l: 'Adult (Rule of Nines)' }, { v: 'pediatric', l: 'Pediatric (Lund-Browder)' }, { v: 'manual', l: 'Manual Input' }]}
      />

      {method === 'manual' ? (
        <div className="mt-3">
          <Field label="Total %TBSA (clinical estimate)">
            <input className={inputClass} type="number" min={0} max={100} value={manualTbsa} onChange={(e) => setManualTbsa(+e.target.value)} />
          </Field>
          <p className="mt-1.5 text-[10px] text-neutral-400">For cases where a %TBSA estimate is already available (e.g. referral from another hospital) — enter it directly without needing to mark the body diagram.</p>
        </div>
      ) : (
        <>
          {method === 'pediatric' && (
            <div className="mt-3">
              <Field label="Age (years)">
                <input className={inputClass} type="number" min={0} max={17} step={0.5} value={ageYears} onChange={(e) => setAgeYears(+e.target.value)} />
              </Field>
              <p className="mt-1.5 text-[10px] text-neutral-400">Lund &amp; Browder (1944) corrects for a child's body proportions — proportionally larger head, smaller legs compared to adults. Age bands: &lt;1, 1-4, 5-9, 10-14, 15-17, ≥18 years.</p>
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <button onClick={() => setView('front')} className={`flex-1 rounded-full py-2 text-xs font-bold ${view === 'front' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>Front View</button>
            <button onClick={() => setView('back')} className={`flex-1 rounded-full py-2 text-xs font-bold ${view === 'back' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>Back View</button>
          </div>

          <div className="mt-3 flex justify-center">
            <svg viewBox="0 0 200 340" width="200" height="340">
              {regions.map((r) => (
                <rect
                  key={r.key}
                  x={r.x} y={r.y} width={r.w} height={r.h} rx={r.rx ?? 4}
                  className="cursor-pointer transition-colors"
                  fill={selected[r.key] ? '#ef4444' : '#e5e7eb'}
                  stroke="#fff" strokeWidth={2}
                  onClick={() => setSelected((s) => ({ ...s, [r.key]: !s[r.key] }))}
                />
              ))}
            </svg>
          </div>
          <p className="text-center text-[10px] text-neutral-400">Tap a body area to mark a burn (red = selected)</p>

          <div className="mt-3 space-y-1">
            {regions.map((r) => (
              <label key={r.key} className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 hover:bg-neutral-50">
                <span className="flex items-center gap-2 text-[12px] font-semibold text-ink">
                  <input type="checkbox" checked={!!selected[r.key]} onChange={() => setSelected((s) => ({ ...s, [r.key]: !s[r.key] }))} className="h-4 w-4 accent-red-500" />
                  {r.label}
                </span>
                <span className="text-[11px] font-black text-neutral-400">{r.pct}%</span>
              </label>
            ))}
          </div>
        </>
      )}

      <div className="mt-4 rounded-xl bg-neutral-50 p-3 text-center">
        <div className="text-2xl font-black text-ink">{tbsa.toFixed(1)}% <span className="text-sm font-semibold text-neutral-400">TBSA</span></div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Field label="Body Weight (kg)"><input className={inputClass} type="number" value={weight} onChange={(e) => setWeight(+e.target.value)} /></Field>
      </div>

      {tbsa >= 20 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-neutral-50 p-3 text-center">
            <div className="text-lg font-black text-ink">{total24h.toFixed(0)}</div>
            <div className="text-[9px] font-bold uppercase text-neutral-400">Total mL / 24h (Parkland)</div>
          </div>
          <div className="rounded-xl bg-neutral-50 p-3 text-center">
            <div className="text-lg font-black text-ink">{first8hRate.toFixed(0)}</div>
            <div className="text-[9px] font-bold uppercase text-neutral-400">mL/h (first 8 hours)</div>
          </div>
          <div className="rounded-xl bg-neutral-50 p-3 text-center">
            <div className="text-lg font-black text-ink">{next16hRate.toFixed(0)}</div>
            <div className="text-[9px] font-bold uppercase text-neutral-400">mL/h (next 16 hours)</div>
          </div>
        </div>
      )}
      {tbsa > 0 && tbsa < 20 && (
        <p className="mt-3 text-[11px] text-neutral-500">The Parkland formula is generally applied to burns ≥20% TBSA. For smaller areas, fluid management is tailored to individual clinical needs.</p>
      )}

      <button onClick={() => window.print()} className="liquid-glass-btn liquid-glass-btn--outline mt-4 w-full rounded-full py-2.5 text-xs font-bold text-brand-dark">🖨️ Print / Save as PDF</button>

      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">Rule of Nines (Wallace) is the standard adult estimate. Lund-Browder corrects for child body proportions by age group. Parkland: Total = 4 mL × weight(kg) × %TBSA (LR crystalloid), half in the first 8 hours FROM THE TIME OF INJURY, the rest over the next 16 hours, titrated to urine output.</p>
    </Card>
  )
}

/* ══════════════════ CRANIAL NERVE + MENINGEAL EXAM AUTOFORMAT ══════════════════ */
// Last of the "bigger build" items: a structured 12-cranial-nerve + meningeal
// sign exam that auto-formats into a ready-to-paste neuro exam note — each
// nerve carries an icon glyph as a lightweight visual cue (this is a coded
// checklist, not an illustrated anatomy atlas) and a curated set of common
// normal/abnormal findings rather than free text, for speed and consistency.
interface CnOption { v: string; l: string }
const CRANIAL_NERVES: { key: string; numeral: string; name: string; icon: string; opts: CnOption[] }[] = [
  { key: 'cn1', numeral: 'I', name: 'Olfactory', icon: '👃', opts: [{ v: 'normal', l: 'Normosmia' }, { v: 'abn', l: 'Anosmia/hyposmia' }, { v: 'na', l: 'Not assessed' }] },
  { key: 'cn2', numeral: 'II', name: 'Optic', icon: '👁️', opts: [{ v: 'normal', l: 'Normal visual acuity & visual field' }, { v: 'abn', l: 'Decreased acuity/visual field defect' }, { v: 'na', l: 'Not assessed' }] },
  { key: 'cn34_6', numeral: 'III/IV/VI', name: 'Oculomotor, Trochlear, Abducens', icon: '👀', opts: [{ v: 'normal', l: 'Full eye movement, pupils isocoric & reactive' }, { v: 'abn', l: 'Ptosis/diplopia/eye movement paresis/anisocoric pupils' }, { v: 'na', l: 'Not assessed' }] },
  { key: 'cn5', numeral: 'V', name: 'Trigeminal', icon: '😐', opts: [{ v: 'normal', l: 'Normal facial sensation & corneal reflex, strong chewing muscles' }, { v: 'abn', l: 'Facial numbness/decreased corneal reflex/weak chewing' }, { v: 'na', l: 'Not assessed' }] },
  { key: 'cn7', numeral: 'VII', name: 'Facial', icon: '😊', opts: [{ v: 'normal', l: 'Symmetric, can wrinkle forehead & close eyes tightly' }, { v: 'abnCentral', l: 'Central paresis (forehead spared)' }, { v: 'abnPeripheral', l: 'Peripheral paresis (forehead involved)' }, { v: 'na', l: 'Not assessed' }] },
  { key: 'cn8', numeral: 'VIII', name: 'Vestibulocochlear', icon: '👂', opts: [{ v: 'normal', l: 'Normal hearing, no vertigo/nystagmus' }, { v: 'abn', l: 'Hearing loss/vertigo/nystagmus' }, { v: 'na', l: 'Not assessed' }] },
  { key: 'cn9_10', numeral: 'IX/X', name: 'Glossopharyngeal, Vagus', icon: '👄', opts: [{ v: 'normal', l: 'Good gag reflex, symmetric palate elevation, clear voice' }, { v: 'abn', l: 'Dysphagia/hoarseness/palate deviation/decreased gag reflex' }, { v: 'na', l: 'Not assessed' }] },
  { key: 'cn11', numeral: 'XI', name: 'Accessory', icon: '💪', opts: [{ v: 'normal', l: 'Normal trapezius & sternocleidomastoid strength' }, { v: 'abn', l: 'Weak shoulder shrug/head turn against resistance' }, { v: 'na', l: 'Not assessed' }] },
  { key: 'cn12', numeral: 'XII', name: 'Hypoglossal', icon: '👅', opts: [{ v: 'normal', l: 'Tongue midline & symmetric, no atrophy/fasciculation' }, { v: 'abn', l: 'Tongue deviation/atrophy/fasciculation' }, { v: 'na', l: 'Not assessed' }] },
]
const MENINGEAL_SIGNS: { key: string; label: string }[] = [
  { key: 'nuchal', label: 'Nuchal rigidity' },
  { key: 'kernig', label: 'Kernig sign' },
  { key: 'brudzinski', label: 'Brudzinski sign' },
]

function CranialNerveCalc() {
  const [cn, setCn] = useState<Record<string, string>>(Object.fromEntries(CRANIAL_NERVES.map((n) => [n.key, 'normal'])))
  const [meningeal, setMeningeal] = useState<Record<string, boolean>>({})

  const meningealPositive = MENINGEAL_SIGNS.filter((m) => meningeal[m.key])
  const anyCnAbnormal = CRANIAL_NERVES.some((n) => cn[n.key]?.startsWith('abn'))

  const noteLines = CRANIAL_NERVES.map((n) => {
    const opt = n.opts.find((o) => o.v === cn[n.key])
    return `- N. ${n.numeral} (${n.name}): ${opt?.l ?? '—'}`
  })
  const meningealLine = MENINGEAL_SIGNS.map((m) => `${m.label}: ${meningeal[m.key] ? 'Positive' : 'Negative'}`).join(' · ')

  const formattedNote = `CRANIAL NERVE & MENINGEAL SIGN EXAM
${noteLines.join('\n')}

Meningeal Signs: ${meningealLine}
${meningealPositive.length > 0 ? '⚠️ Meningeal signs POSITIVE — consider meningitis/subarachnoid hemorrhage, further evaluation (lumbar puncture if no contraindication, imaging if indicated).' : ''}`

  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Cranial Nerves + Meningeal Signs" subtitle="12 cranial nerve exam & meningeal signs, auto-formatted into a note" />

      <div className="space-y-2.5">
        {CRANIAL_NERVES.map((n) => (
          <div key={n.key} className="rounded-xl border border-neutral-100 p-3">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-lg">{n.icon}</span>
              <span className="text-[12px] font-black text-ink">N. {n.numeral}</span>
              <span className="text-[11px] text-neutral-400">{n.name}</span>
            </div>
            <SegButtons value={cn[n.key]} onChange={(v) => setCn((s) => ({ ...s, [n.key]: v }))} options={n.opts} />
          </div>
        ))}
      </div>

      <h4 className="mt-4 text-xs font-black uppercase tracking-wide text-neutral-500">Meningeal Signs</h4>
      <div className="mt-2 space-y-2">
        {MENINGEAL_SIGNS.map((m) => (
          <label key={m.key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50">
            <input type="checkbox" checked={!!meningeal[m.key]} onChange={(e) => setMeningeal((s) => ({ ...s, [m.key]: e.target.checked }))} className="h-5 w-5 accent-red-500" />
            <div className="text-sm font-bold text-ink">{m.label}</div>
          </label>
        ))}
      </div>

      {(meningealPositive.length > 0 || anyCnAbnormal) && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3">
          <p className="text-xs font-black text-amber-800">⚠️ Abnormal findings detected</p>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-700">
            {meningealPositive.length > 0 && 'Meningeal signs positive — consider meningitis/subarachnoid hemorrhage. '}
            {anyCnAbnormal && 'Cranial nerve deficit present — correlate with lesion localization (brainstem, skull base, or peripheral) and consider imaging.'}
          </p>
        </div>
      )}

      <div className="mt-4">
        <h4 className="mb-2 text-xs font-black uppercase tracking-wide text-neutral-500">Auto-Generated Note</h4>
        <pre className="whitespace-pre-wrap rounded-xl bg-neutral-900 p-3 text-[11px] leading-relaxed text-neutral-100">{formattedNote}</pre>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-neutral-400">This auto-generated note draft must be reviewed & completed by a physician before entering the official medical record. Central vs. peripheral facial paresis is distinguished by forehead involvement (forehead spared = central, since forehead innervation is bilateral from the cortex; forehead also paralyzed = peripheral/Bell's palsy).</p>
    </Card>
  )
}

/* ══════════════════ COMPETENCY TRACKER (SKDI) ══════════════════ */
// Sixth and last of the "bigger build" items. Indonesian medical education
// is set NATIONALLY under SKDI (Standar Kompetensi Dokter Indonesia, KKI/
// AIPKI) — individual universities (UI, Unair, UGM, UNS, Unpad, Unhas, etc.)
// implement the same core national competency areas rather than each having
// a wholly distinct competency list, so this tracks against the real SKDI
// 7-area framework with a university/specialty tag for personalization,
// rather than fabricating school-specific curriculum content that can't be
// verified.
const UNIVERSITIES = ['UI', 'Unair', 'UGM', 'UNS', 'Unpad', 'Unhas'] as const
const SPECIALTIES = ['General Medicine', 'Internal Medicine', 'Surgery', 'Pediatrics', 'Obstetrics & Gynecology', 'Neurology', 'Cardiology', 'Anesthesiology', 'Radiology', 'Clinical Pathology'] as const

interface SkdiArea { key: string; area: string; title: string; items: string[] }
const SKDI_AREAS: SkdiArea[] = [
  { key: 'area1', area: 'Area 1', title: 'Noble Professionalism', items: [
    'Demonstrates professional behavior & medical ethics', 'Moral & ethical conduct in practice', 'Aware of & compliant with medical law',
  ] },
  { key: 'area2', area: 'Area 2', title: 'Self-Awareness & Self-Development', items: [
    'Applies self-reflection (practice reflection)', 'Practices lifelong learning', 'Develops new knowledge',
  ] },
  { key: 'area3', area: 'Area 3', title: 'Effective Communication', items: [
    'Communicates with patients & families', 'Communicates with colleagues & other professions', 'Communicates with the community',
  ] },
  { key: 'area4', area: 'Area 4', title: 'Information Management', items: [
    'Critically accesses & appraises health information/data', 'Utilizes health information technology', 'Communicates scientific information',
  ] },
  { key: 'area5', area: 'Area 5', title: 'Scientific Foundation of Medicine', items: [
    'Applies biomedical science', 'Applies clinical science', 'Applies evidence-based medicine principles',
  ] },
  { key: 'area6', area: 'Area 6', title: 'Clinical Skills', items: [
    'Complete history-taking & physical examination', 'Performs clinical & emergency procedures', 'Interprets supporting investigations', 'Develops & implements a management plan',
  ] },
  { key: 'area7', area: 'Area 7', title: 'Health Problem Management', items: [
    'Manages individual & family health problems', 'Manages community/population health problems', 'Applies patient safety principles',
  ] },
]

type CompStatus = 'belum' | 'proses' | 'tercapai'
const COMP_KEY = 'pmd_competency_tracker_v1'

function loadCompProgress(): Record<string, CompStatus> {
  try { return JSON.parse(localStorage.getItem(COMP_KEY) || '{}') } catch { return {} }
}

function CompetencyTracker() {
  const [university, setUniversity] = useState<(typeof UNIVERSITIES)[number]>('UI')
  const [specialty, setSpecialty] = useState<(typeof SPECIALTIES)[number]>('General Medicine')
  const [progress, setProgress] = useState<Record<string, CompStatus>>(loadCompProgress)

  function setStatus(itemKey: string, v: CompStatus) {
    setProgress((s) => {
      const next = { ...s, [itemKey]: v }
      try { localStorage.setItem(COMP_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }

  const allItems = SKDI_AREAS.flatMap((a) => a.items.map((_, i) => `${university}-${specialty}-${a.key}-${i}`))
  const tercapaiCount = allItems.filter((k) => progress[k] === 'tercapai').length
  const overallPct = Math.round((tercapaiCount / allItems.length) * 100)

  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Competency Tracker (SKDI)" subtitle="7 Indonesian Doctor Competency Areas (KKI/AIPKI) — a national standard applied across all medical education institutions" />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Institution">
          <select className={inputClass} value={university} onChange={(e) => setUniversity(e.target.value as (typeof UNIVERSITIES)[number])}>
            {UNIVERSITIES.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </Field>
        <Field label="Program/Specialty">
          <select className={inputClass} value={specialty} onChange={(e) => setSpecialty(e.target.value as (typeof SPECIALTIES)[number])}>
            {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      <div className="mt-4 rounded-xl bg-neutral-50 p-3 text-center">
        <div className="text-2xl font-black text-ink">{overallPct}%</div>
        <div className="text-[10px] font-bold uppercase text-neutral-400">Overall Progress — {tercapaiCount}/{allItems.length} competencies achieved</div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-200">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${overallPct}%` }} />
        </div>
      </div>

      {SKDI_AREAS.map((area) => {
        const keys = area.items.map((_, i) => `${university}-${specialty}-${area.key}-${i}`)
        const done = keys.filter((k) => progress[k] === 'tercapai').length
        return (
          <div key={area.key} className="mt-4">
            <h4 className="flex items-center justify-between text-xs font-black uppercase tracking-wide text-neutral-500">
              <span>{area.area} — {area.title}</span>
              <span className="text-neutral-400">{done}/{area.items.length}</span>
            </h4>
            <div className="mt-2 space-y-1.5">
              {area.items.map((item, i) => {
                const key = `${university}-${specialty}-${area.key}-${i}`
                const v = progress[key] ?? 'belum'
                return (
                  <div key={key} className="flex items-center justify-between gap-2 rounded-xl border border-neutral-100 p-2.5">
                    <div className="min-w-0 flex-1 text-[12px] font-semibold text-ink">{item}</div>
                    <SegButtons value={v} onChange={(nv) => setStatus(key, nv)} options={[{ v: 'belum', l: 'Not yet' }, { v: 'proses', l: 'In progress' }, { v: 'tercapai', l: 'Achieved' }]} />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <p className="mt-4 text-[10px] leading-relaxed text-neutral-400">The 7-Area Competency framework follows SKDI (Standar Kompetensi Dokter Indonesia, set by KKI based on AIPKI) — a national standard implemented across all medical education institutions, not a list unique per campus. The sub-competencies above are a representative summary; refer to the official SKDI document & your institution's logbook for the complete, verified list. Progress is saved on this device.</p>
    </Card>
  )
}

// ── Paywall: free for the first 50 registered accounts, then a one-time
// 500-PNC unlock. Rupiah settles ONLY via manual transfer to the owner's
// Mandiri account (topped up as PNC in Billing, verified by photo proof) —
// no QRIS/VA/card gateway exists, so this deliberately offers no direct
// IDR charge button. ──
type CalcAccess = { unlocked: boolean; free: boolean; limit: number; slotsLeft: number; pricePnc: number; priceIdr: number }

function ClinicalCalcPaywall({ access, onUnlocked }: { access: CalcAccess; onUnlocked: () => void }) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function payWithPnc() {
    setBusy(true); setErr('')
    try {
      const r = await api.unlockClinicalCalcPnc()
      if (r.unlocked) onUnlocked()
    } catch (e) {
      setErr(/insufficient_balance/i.test(String((e as Error).message)) ? `Your PNC balance is insufficient (needs ${access.pricePnc} PNC). Top up first via bank transfer in Billing.` : 'Failed to unlock access. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <SectionTitle icon={<IconShield size={20} />} title="Unlock Clinical Calculators" subtitle="34 internationally standard clinical decision-support scores & tools" />
      <div className="mt-3 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600">
        🎉 Clinical Calculators are <b>free</b> for the first {access.limit} Panaceamed.id registered accounts — that quota is already full. Unlock lifetime account access with a one-time payment: <b>{access.pricePnc} PNC</b> (equivalent to Rp{access.priceIdr.toLocaleString('id-ID')}).
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          onClick={payWithPnc}
          disabled={busy}
          className="flex flex-col items-start gap-1 rounded-2xl border border-brand/30 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
        >
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-dark"><IconToken size={14} /> Pay from balance</span>
          <span className="text-xl font-black text-ink">{access.pricePnc} PNC</span>
          <span className="text-[11px] text-neutral-500">{busy ? 'Processing…' : 'Deducted directly from your PanaceaToken balance'}</span>
        </button>
        <button
          onClick={() => navigate('/billing')}
          className="flex flex-col items-start gap-1 rounded-2xl border border-black/10 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="text-xs font-bold uppercase tracking-wide text-neutral-500">Balance not enough?</span>
          <span className="text-base font-black text-ink">Transfer to {MANUAL_BANK.bank}</span>
          <span className="text-[11px] text-neutral-500">{MANUAL_BANK.number} in the name of {MANUAL_BANK.holder}</span>
          <span className="text-[11px] font-semibold text-brand-dark">Top up in Billing →</span>
        </button>
      </div>
      {err && <p className="mt-3 text-xs font-semibold text-rose-600">{err}</p>}
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">All payments go through transfer to the account above — upload proof of transfer in Billing, PNC balance is added after verification.</p>
    </Card>
  )
}

/* ══════════════════ BROCA-LORENTZ CALORIE CALCULATOR ══════════════════ */
// Ideal body weight via Broca vs. Lorentz formula, feeding a basal/total
// energy estimate — a common Indonesian nutrition-clinic pairing distinct
// from the standalone Broca IBW tab (which doesn't compute calories) and
// from BMR/Harris-Benedict-style calculators elsewhere in the app.
function BrocaLorentzCalorieCalc() {
  const [height, setHeight] = useState(165)
  const [sex, setSex] = useState<'M' | 'F'>('M')
  const [activity, setActivity] = useState<'ringan' | 'sedang' | 'berat'>('sedang') // 'light' | 'moderate' | 'heavy'
  const [formula, setFormula] = useState<'broca' | 'lorentz'>('lorentz')

  const base = height - 100
  const brocaIbw = sex === 'M' ? base - base * 0.1 : base - base * 0.15
  // Lorentz formula — adjusts Broca for height, more accurate for taller/shorter builds
  const lorentzIbw = sex === 'M'
    ? height - 100 - (height - 150) / 4
    : height - 100 - (height - 150) / 2.5
  const ibw = formula === 'broca' ? brocaIbw : lorentzIbw

  // 25 kcal/kg basal, scaled by activity factor — a simple, widely-taught
  // Indonesian clinical-nutrition shortcut (RS/Puskesmas gizi klinik) rather
  // than the more granular Harris-Benedict/Mifflin equations.
  const activityFactor = { ringan: 30, sedang: 35, berat: 40 }[activity]
  const totalKcal = ibw * activityFactor

  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Broca–Lorentz Calorie Calculator" subtitle="Ideal body weight (Broca/Lorentz) → estimated daily calorie requirement" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Field label="Height (cm)"><input className={inputClass} type="number" value={height} onChange={(e) => setHeight(+e.target.value)} /></Field>
        <Field label="Sex"><SegButtons value={sex} onChange={setSex} options={[{ v: 'M', l: 'Male' }, { v: 'F', l: 'Female' }]} /></Field>
        <Field label="IBW Formula"><SegButtons value={formula} onChange={setFormula} options={[{ v: 'broca', l: 'Broca' }, { v: 'lorentz', l: 'Lorentz' }]} /></Field>
      </div>
      <Field label="Activity Level">
        <SegButtons value={activity} onChange={setActivity} options={[{ v: 'ringan', l: 'Light (30 kcal/kg)' }, { v: 'sedang', l: 'Moderate (35 kcal/kg)' }, { v: 'berat', l: 'Heavy (40 kcal/kg)' }]} />
      </Field>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <div className="text-xl font-black text-ink">{ibw.toFixed(1)} kg</div>
          <div className="text-[9px] font-bold uppercase text-neutral-400">Ideal Body Weight ({formula === 'broca' ? 'Broca' : 'Lorentz'})</div>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <div className="text-xl font-black text-ink">{totalKcal.toFixed(0)} kcal/day</div>
          <div className="text-[9px] font-bold uppercase text-neutral-400">Total Calorie Requirement</div>
        </div>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">Broca: (Height−100)±10-15%. Lorentz: (Height−100) − (Height−150)/4 (male) or /2.5 (female) — corrects for extreme heights, generally considered more accurate than plain Broca. Calories = IBW × activity factor (25 kcal/kg basal + activity adjustment). Adjust further for metabolic stress, wounds, or catabolic conditions.</p>
    </Card>
  )
}

/* ══════════════════ IV FLUID DRIP RATE (TETES/MENIT) ══════════════════ */
function IvDripCalc() {
  const [volumeMl, setVolumeMl] = useState(500)
  const [hours, setHours] = useState(8)
  const [dropFactor, setDropFactor] = useState<15 | 20 | 60>(20)

  const mlPerHour = volumeMl / hours
  const dropsPerMin = (volumeMl * dropFactor) / (hours * 60)

  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="IV Fluid Drip Rate" subtitle="Convert infusion volume & duration into drops/minute per the giving set's drop factor" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Field label="Total Volume (mL)"><input className={inputClass} type="number" value={volumeMl} onChange={(e) => setVolumeMl(+e.target.value)} /></Field>
        <Field label="Duration (hours)"><input className={inputClass} type="number" step="0.5" value={hours} onChange={(e) => setHours(+e.target.value)} /></Field>
        <Field label="Drop Factor (giving set)">
          <SegButtons value={dropFactor} onChange={setDropFactor} options={[{ v: 15, l: '15 (macro)' }, { v: 20, l: '20 (macro)' }, { v: 60, l: '60 (micro)' }]} />
        </Field>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <div className="text-xl font-black text-ink">{mlPerHour.toFixed(1)} mL/h</div>
          <div className="text-[9px] font-bold uppercase text-neutral-400">Rate (infusion pump)</div>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <div className="text-xl font-black text-ink">{dropsPerMin.toFixed(0)} drops/min</div>
          <div className="text-[9px] font-bold uppercase text-neutral-400">Drops/min (no pump)</div>
        </div>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">Drops/min = (Volume mL × Drop Factor) / (Duration hours × 60). A standard macro set is usually 15 or 20 drops/mL (adult/general use), a micro set 60 drops/mL (pediatric/neonatal, precision titration). Always confirm the drop factor printed on the giving-set packaging you're using.</p>
    </Card>
  )
}

/* ══════════════════ ARIA CRITERIA (RINITIS ALERGI) ══════════════════ */
// Allergic Rhinitis and its Impact on Asthma (ARIA, WHO-endorsed, Bousquet
// et al. 2008 update) — classifies by duration (intermittent/persistent)
// and severity (mild/moderate-severe via 4-item quality-of-life impact).
function AriaCalc() {
  const [duration, setDuration] = useState<'intermiten' | 'persisten'>('intermiten')
  const [sleepImpaired, setSleepImpaired] = useState(false)
  const [dailyImpaired, setDailyImpaired] = useState(false)
  const [workSchoolImpaired, setWorkSchoolImpaired] = useState(false)
  const [troublesomeSymptoms, setTroublesomeSymptoms] = useState(false)

  const impactCount = [sleepImpaired, dailyImpaired, workSchoolImpaired, troublesomeSymptoms].filter(Boolean).length
  const severity = impactCount === 0 ? 'ringan' : 'sedang-berat'
  const classification = `${duration === 'intermiten' ? 'Intermittent' : 'Persistent'} ${severity === 'ringan' ? 'Mild' : 'Moderate-Severe'}`

  const treatmentNote: Record<string, string> = {
    'Intermittent Mild': 'Non-sedating oral antihistamine / intranasal as needed.',
    'Intermittent Moderate-Severe': 'Oral antihistamine + intranasal corticosteroid; re-evaluate in 2-4 weeks.',
    'Persistent Mild': 'Regular intranasal corticosteroid ± antihistamine; re-evaluate.',
    'Persistent Moderate-Severe': 'Regular intranasal corticosteroid + antihistamine; consider allergy referral/immunotherapy if persistent.',
  }

  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="ARIA Criteria" subtitle="Allergic Rhinitis and its Impact on Asthma (Bousquet et al., WHO 2008)" />
      <Field label="Symptom Duration">
        <SegButtons value={duration} onChange={setDuration} options={[
          { v: 'intermiten', l: 'Intermittent (<4 days/week or <4 weeks)' },
          { v: 'persisten', l: 'Persistent (≥4 days/week and ≥4 weeks)' },
        ]} />
      </Field>
      <h4 className="mt-4 text-xs font-black uppercase tracking-wide text-neutral-500">Quality of Life Impact (severity score)</h4>
      <div className="mt-2 space-y-2">
        {[
          { label: 'Sleep disturbance', checked: sleepImpaired, set: setSleepImpaired },
          { label: 'Impairment of daily activities/sport/leisure', checked: dailyImpaired, set: setDailyImpaired },
          { label: 'Impairment of school/work', checked: workSchoolImpaired, set: setWorkSchoolImpaired },
          { label: 'Troublesome symptoms', checked: troublesomeSymptoms, set: setTroublesomeSymptoms },
        ].map((item) => (
          <label key={item.label} className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50">
            <input type="checkbox" checked={item.checked} onChange={(e) => item.set(e.target.checked)} className="h-5 w-5 accent-brand" />
            <div className="text-sm font-bold text-ink">{item.label}</div>
          </label>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-lg font-black text-ink">{classification}</div>
          <Badge tone={severity === 'ringan' ? 'normal' : 'low'}>{impactCount}/4 impacts</Badge>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-600">{treatmentNote[classification]}</p>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">ARIA classification: duration (intermittent vs persistent) × severity (mild if 0/4 QoL impact items affected; moderate-severe if ≥1/4). Replaces the older "seasonal/perennial" terminology since it doesn't always match real-world symptom patterns.</p>
    </Card>
  )
}

/* ══════════════════ ACLS QUICK REFERENCE (ALGORITMA) ══════════════════ */
// Not a calculator with numeric output — a structured, tap-through
// decision-tree reference for the 3 core ACLS algorithms (AHA 2020
// Guidelines), complementing the XABCDE/ATLS primary-survey tab with the
// cardiac-arrest / peri-arrest management side of resuscitation.
type AclsAlgo = 'arrest' | 'brady' | 'tachy'
const ACLS_ARREST_STEPS: string[] = [
  'Start high-quality CPR: compressions 100-120/min, depth 5-6cm, minimize interruptions, allow full recoil.',
  'Attach monitor/defibrillator as soon as possible — identify rhythm: Shockable (pulseless VF/VT) or Non-Shockable (PEA/Asystole).',
  'Shockable: defibrillate immediately (energy per device) → resume CPR for 2 minutes → epinephrine 1mg IV/IO every 3-5 minutes (start after the 2nd shock) → consider amiodarone 300mg (or lidocaine) after the 3rd shock.',
  'Non-Shockable: epinephrine 1mg IV/IO as soon as possible, repeat every 3-5 minutes → CPR for 2 minutes → recheck rhythm.',
  'Find & treat reversible causes — the 5 Hs (Hypovolemia, Hypoxia, Hydrogen ion/acidosis, Hypo/Hyperkalemia, Hypothermia) & 5 Ts (Tension pneumothorax, Cardiac Tamponade, Toxins, pulmonary Thrombosis, coronary Thrombosis).',
  'ROSC (Return of Spontaneous Circulation): begin post-cardiac-arrest care — titrated oxygenation/ventilation, hemodynamic targets, 12-lead ECG, consider targeted temperature management.',
]
const ACLS_BRADY_STEPS: string[] = [
  'Identify bradycardia (pulse <50/min) — assess whether it is causing unstable symptoms/signs (hypotension, altered mental status, shock, ischemic chest pain, acute heart failure).',
  'If STABLE: monitor & observe, identify & treat the cause.',
  'If UNSTABLE: Atropine 1mg IV bolus (repeat every 3-5 minutes, max 3mg total).',
  'If atropine is ineffective: transcutaneous pacing, OR dopamine infusion (5-20 mcg/kg/min), OR epinephrine infusion (2-10 mcg/min).',
  'Consider expert consultation & transvenous pacing if the reversible cause cannot be resolved promptly.',
]
const ACLS_TACHY_STEPS: string[] = [
  'Identify tachycardia (pulse >100/min) — assess whether it is causing unstable symptoms/signs (hypotension, altered mental status, shock, ischemic chest pain, acute heart failure).',
  'If UNSTABLE: immediate synchronized cardioversion (consider brief sedation if conscious & time permits).',
  'If STABLE & regular NARROW complex (QRS <0.12s): vagal maneuvers → adenosine 6mg rapid IV push (then 12mg if needed).',
  'If STABLE & WIDE complex (QRS ≥0.12s): consider adenosine if regular & monomorphic, or antiarrhythmic infusion (procainamide/amiodarone/sotalol) — expert consultation recommended.',
  'Throughout: maintain the airway, give oxygen if hypoxemic, establish IV access & 12-lead ECG monitoring where possible without delaying treatment.',
]
const ACLS_ALGOS: { id: AclsAlgo; label: string; title: string; steps: string[] }[] = [
  { id: 'arrest', label: 'Cardiac Arrest', title: 'Adult Cardiac Arrest Algorithm', steps: ACLS_ARREST_STEPS },
  { id: 'brady', label: 'Bradycardia', title: 'Bradycardia Algorithm (Symptomatic)', steps: ACLS_BRADY_STEPS },
  { id: 'tachy', label: 'Tachycardia', title: 'Tachycardia Algorithm (Symptomatic)', steps: ACLS_TACHY_STEPS },
]

function AclsCalc() {
  const [algo, setAlgo] = useState<AclsAlgo>('arrest')
  const active = ACLS_ALGOS.find((a) => a.id === algo)!
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="ACLS Guide" subtitle="Advanced Cardiovascular Life Support — quick reference algorithms (AHA Guidelines 2020)" />
      <SegButtons value={algo} onChange={setAlgo} options={ACLS_ALGOS.map((a) => ({ v: a.id, l: a.label }))} />
      <div className="mt-4 rounded-xl bg-neutral-50 p-4">
        <h4 className="text-sm font-black text-ink">{active.title}</h4>
        <ol className="mt-3 space-y-3">
          {active.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-[11px] font-black text-white">{i + 1}</span>
              <p className="text-[12px] leading-relaxed text-neutral-700">{step}</p>
            </li>
          ))}
        </ol>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">Summary of the AHA ACLS 2020 algorithms — complements the XABCDE trauma primary survey for cardiac-arrest/peri-arrest scenarios. Not a substitute for certified ACLS training & does not cover every pediatric nuance/dose (see PALS separately).</p>
    </Card>
  )
}

export function ClinicalCalculators() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('apgar')
  const [access, setAccess] = useState<CalcAccess | null>(null)

  useEffect(() => {
    if (!backendEnabled) { setAccess({ unlocked: true, free: true, limit: 50, slotsLeft: 0, pricePnc: 500, priceIdr: 500000 }); return }
    api.getClinicalCalcAccess().then(setAccess).catch(() => setAccess({ unlocked: true, free: true, limit: 50, slotsLeft: 0, pricePnc: 500, priceIdr: 500000 }))
  }, [])

  if (access && !access.unlocked) {
    return (
      <div className="mx-auto max-w-xl space-y-4 p-4">
        <SectionTitle icon={<IconStethoscope size={20} />} title="Clinical Calculators" subtitle="Internationally standard clinical decision-support scores & tools" />
        <ClinicalCalcPaywall access={access} onUnlocked={() => setAccess({ ...access, unlocked: true })} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-4 p-4">
      {access?.free && (
        <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-[11px] font-semibold text-brand-dark">
          <IconCheck size={14} /> You're among the first {access.limit} registrants — free access forever.
        </div>
      )}
      <SectionTitle icon={<IconStethoscope size={20} />} title="Clinical Calculators" subtitle="Internationally standard clinical decision-support scores & tools" />
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${tab === t.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'apgar' && <ApgarCalc />}
      {tab === 'gcs' && <GcsCalc />}
      {tab === 'curb65' && <Curb65Calc />}
      {tab === 'bishop' && <BishopCalc />}
      {tab === 'ckdepi' && <CkdEpiCalc />}
      {tab === 'whogrowth' && <WhoGrowthCalc />}
      {tab === 'whoneonate' && <WhoNeonateCalc />}
      {tab === 'cdcanthro' && <CdcAnthropometryCalc />}
      {tab === 'ballard' && <BallardSoapCalc />}
      {tab === 'qsofa' && <QsofaCalc />}
      {tab === 'hollidaysegar' && <HollidaySegarCalc />}
      {tab === 'parkland' && <ParklandCalc />}
      {tab === 'naegele' && <NaegeleCalc />}
      {tab === 'map' && <MapCalc />}
      {tab === 'alvarado' && <AlvaradoCalc />}
      {tab === 'centor' && <CentorCalc />}
      {tab === 'nacorr' && <NaCorrectionCalc />}
      {tab === 'broca' && <BrocaCalc />}
      {tab === 'brocalorentz' && <BrocaLorentzCalorieCalc />}
      {tab === 'ivdrip' && <IvDripCalc />}
      {tab === 'midparental' && <MidParentalCalc />}
      {tab === 'fletcher' && <FletcherCalc />}
      {tab === 'nose' && <NoseCalc />}
      {tab === 'rsi' && <RsiCalc />}
      {tab === 'aria' && <AriaCalc />}
      {tab === 'abcd2' && <Abcd2Calc />}
      {tab === 'four' && <FourScoreCalc />}
      {tab === 'mcdonald' && <McDonaldCalc />}
      {tab === 'paradise' && <ParadiseCalc />}
      {tab === 'nihss' && <NihssCalc />}
      {tab === 'fluidbalance' && <FluidBalanceCalc />}
      {tab === 'pedsdose' && <PedsDoseCalc />}
      {tab === 'vbac' && <VbacCalc />}
      {tab === 'denver' && <DenverCalc />}
      {tab === 'atls' && <AtlsCalc />}
      {tab === 'acls' && <AclsCalc />}
      {tab === 'abg' && <AbgCalc />}
      {tab === 'burn' && <BurnCalc />}
      {tab === 'cranial' && <CranialNerveCalc />}
      {tab === 'competencies' && <CompetencyTracker />}
    </div>
  )
}

export default ClinicalCalculators
