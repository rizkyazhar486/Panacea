import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconActivity, IconGauge, IconHeart, IconRun, IconTimer, IconChartUp } from '../components/icons'
import { useStore } from '../lib/store'

// ─────────────────────────────────────────────────────────────────────────────
// Lab Performa — data-driven calculators for the full strength/endurance/speed
// battery requested: RPE, thresholds (AT/MLSS/LT/VT/OBLA/RCP/CP/HHb/VLaMax),
// power (1RM/PPO/W-kg/TMW/FTP/MMP), speed/agility (MSS/ASR/accel/stride/
// reaction/Illinois/bleep), respiratory & environment (VE/VCO2/breathing/heat/
// hydration/altitude), load management (TSS/MAP/Karvonen/rep-max), and economy
// & durability. Every value is entered manually (from a watch, lab test, or
// field test) — this runs entirely offline, values persist per-metric in
// localStorage so nothing is lost between visits.
// ─────────────────────────────────────────────────────────────────────────────

type Tone = 'brand' | 'low' | 'critical' | 'neutral' | 'normal' | 'high'

function useMetricState(id: string, defaults: Record<string, number>) {
  const key = 'pm_lab_' + id
  const [vals, setVals] = useState<Record<string, number>>(() => {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(key) || '{}') } } catch { return defaults }
  })
  const set = (k: string, v: number) => setVals((old) => {
    const n = { ...old, [k]: v }
    try { localStorage.setItem(key, JSON.stringify(n)) } catch { /* ignore */ }
    return n
  })
  return [vals, set] as const
}

interface Inp { key: string; label: string; unit?: string; default?: number }
function MetricCard({ id, name, emoji, inputs, compute, unit, note, interpret }: {
  id: string; name: string; emoji: string; inputs: Inp[]
  compute: (v: Record<string, number>) => number | string
  unit?: string; note: string
  interpret?: (result: number | string, v: Record<string, number>) => { label: string; tone: Tone } | null
}) {
  const defaults = Object.fromEntries(inputs.map((i) => [i.key, i.default ?? 0]))
  const [vals, set] = useMetricState(id, defaults)
  const result = compute(vals)
  const interp = interpret ? interpret(result, vals) : null
  const display = typeof result === 'number' ? (Number.isFinite(result) ? result.toFixed(result % 1 === 0 ? 0 : 1) : '—') : result
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-extrabold">{emoji} {name}</div>
        {interp && <Badge tone={interp.tone}>{interp.label}</Badge>}
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {inputs.map((inp) => (
          <Field key={inp.key} label={inp.label + (inp.unit ? ` (${inp.unit})` : '')}>
            <input className={inputClass} type="number" step="any" value={vals[inp.key] || ''} placeholder="0"
              onChange={(e) => set(inp.key, +e.target.value)} />
          </Field>
        ))}
      </div>
      <div className="mt-2.5 rounded-xl bg-neutral-50 p-3">
        <div className="text-xl font-extrabold text-brand-dark">{display}<span className="ml-1 text-xs font-medium text-neutral-400">{unit}</span></div>
        <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">{note}</p>
      </div>
    </div>
  )
}

const TABS = [
  'Threshold & Metabolic', 'Strength & Power', 'Speed & Agility', 'Field Tests',
  'Respiratory & Environment', 'Load & Management', 'Economy & Durability',
] as const
type Tab = typeof TABS[number]

export function PerformanceLab() {
  const [tab, setTab] = useState<Tab>('Threshold & Metabolic')
  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconGauge size={20} />} title="Performance Lab" subtitle="Full battery of strength, endurance & speed tests and calculators — manual/lab-based" />
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
          Fill in values from a watch, lab equipment (lactate, NIRS, power meter) or field tests. Everything is stored offline on your device.
          Before starting a heavy program, first complete the <a href="#/assessment" className="font-bold text-brand-dark underline">Initial Assessment</a> (movement patterns, pain, injury risk, asymmetry).
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={'rounded-full px-3 py-1.5 text-[11px] font-bold transition ' + (tab === t ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500')}>{t}</button>
          ))}
        </div>
      </Card>

      {tab === 'Threshold & Metabolic' && <ThresholdTab />}
      {tab === 'Strength & Power' && <PowerTab />}
      {tab === 'Speed & Agility' && <SpeedTab />}
      {tab === 'Field Tests' && <FieldTestTab />}
      {tab === 'Respiratory & Environment' && <RespiratoryTab />}
      {tab === 'Load & Management' && <LoadTab />}
      {tab === 'Economy & Durability' && <EconomyTab />}
    </div>
  )
}

/* ══════════════════ 1. THRESHOLD & METABOLIC ══════════════════ */
function ThresholdTab() {
  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconHeart size={20} />} title="Threshold & Metabolic" subtitle="RPE, AT, MLSS, LT/VT, OBLA, RCP, Critical Power, HHb, VLaMax" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <RpeCard />
        <MetricCard id="at" name="Anaerobic Threshold (AT)" emoji="⚡" unit="bpm"
          inputs={[{ key: 'hrmax', label: 'HRmax', default: 190 }]}
          compute={(v) => v.hrmax * 0.88}
          note="Estimated HR at anaerobic threshold ≈ 85-90% HRmax (Meyer 2005). The point where lactate begins to rise sharply above baseline."
        />
        <MetricCard id="mlss" name="MLSS (Max Lactate Steady State)" emoji="🩸" unit="W/pace"
          inputs={[{ key: 'ftp', label: 'FTP / Threshold Power', default: 200 }]}
          compute={(v) => v.ftp * 0.95}
          note="MLSS — the highest intensity at which lactate remains stable (not continuously rising). Generally ~95% of FTP/threshold power."
        />
        <MetricCard id="rcp" name="Respiratory Compensation Point (RCP)" emoji="🫁" unit="bpm"
          inputs={[{ key: 'hrmax', label: 'HRmax', default: 190 }]}
          compute={(v) => v.hrmax * 0.92}
          note="RCP ≈ 90-95% HRmax — the point where ventilation rises sharply beyond VCO2, usually close to LT2/VT2."
        />
        <MetricCard id="cp" name="Critical Power (2-point)" emoji="🔋" unit="W"
          inputs={[{ key: 'p1', label: 'Test 1 Power', unit: 'W', default: 320 }, { key: 't1', label: 'Test 1 Time', unit: 'sec', default: 180 },
            { key: 'p2', label: 'Test 2 Power', unit: 'W', default: 250 }, { key: 't2', label: 'Test 2 Time', unit: 'sec', default: 720 }]}
          compute={(v) => { const cp = (v.p1 * v.t1 - v.p2 * v.t2) / (v.t1 - v.t2); return Number.isFinite(cp) ? cp : 0 }}
          note="Monod-Scherrer 2-point model: CP = (P1×t1 − P2×t2)/(t1−t2). W' (anaerobic capacity) = (P1−CP)×t1."
        />
        <VtLtCard />
        <MetricCard id="tte" name="Time to Exhaustion (TTE)" emoji="⏳" unit="minutes"
          inputs={[{ key: 'p', label: 'Target Power', unit: 'W', default: 280 }, { key: 'cp', label: 'Critical Power', unit: 'W', default: 250 }, { key: 'wprime', label: "W' Capacity", unit: 'kJ', default: 20 }]}
          compute={(v) => v.p > v.cp ? (v.wprime * 1000) / (v.p - v.cp) / 60 : Infinity}
          note="TTE = W'/(P−CP). Predicts how long you can sustain effort above Critical Power before exhaustion."
        />
        <MetricCard id="hhb" name="HHb Breakpoint (manual from NIRS)" emoji="🩻" unit="W/pace"
          inputs={[{ key: 'val', label: 'Power/pace at breakpoint', default: 0 }]}
          compute={(v) => v.val}
          note="The point where muscle deoxyhemoglobin begins to rise sharply (from a lab NIRS device) — usually close to RCP/VT2. Enter your lab test result."
        />
        <MetricCard id="obla" name="OBLA (Onset Blood Lactate, 4mmol)" emoji="🧪" unit="W/pace"
          inputs={[{ key: 'val', label: 'Power/pace at 4mmol lactate', default: 0 }]}
          compute={(v) => v.val}
          note="Fixed reference of 4 mmol/L blood lactate (multi-stage protocol + blood sampling). Enter your lab test result."
        />
        <MetricCard id="vlamax" name="VLaMax (Glycolytic Power)" emoji="🔥" unit="mmol/L/sec"
          inputs={[{ key: 'larest', label: 'Resting Lactate', unit: 'mmol', default: 1 }, { key: 'lapeak', label: 'Peak Lactate', unit: 'mmol', default: 8 }, { key: 'sprint', label: 'Sprint Duration', unit: 'sec', default: 15 }]}
          compute={(v) => (v.lapeak - v.larest) / v.sprint}
          note="Simple estimate from a ~15-second maximal sprint. High VLaMax = glycolytic-dominant (sprinter); low = aerobic-dominant (endurance). Full lab protocols (e.g. INSCYD) are more precise."
        />
        <LactateRecoveryCard />
      </div>
      <MetabolicMapCard />
    </Card>
  )
}

function RpeCard() {
  const [rpe, setRpe] = useState(5)
  const [dur, setDur] = useState(45)
  const load = rpe * dur
  const BORG = ['', 'Very, very light', 'Very light', 'Light', 'Fairly light', 'Moderate', 'Somewhat hard', 'Hard', 'Very hard', 'Very, very hard', 'Maximal']
  return (
    <div className="rounded-2xl border border-neutral-100 p-4 sm:col-span-2">
      <div className="text-sm font-extrabold">😤 RPE (Borg CR-10) & Training Load</div>
      <div className="mt-2 flex items-center gap-3">
        <input type="range" min={1} max={10} value={rpe} onChange={(e) => setRpe(+e.target.value)} className="flex-1" />
        <span className="w-10 text-center text-lg font-extrabold text-brand-dark">{rpe}</span>
      </div>
      <div className="mt-1 text-[11px] text-neutral-500">{BORG[rpe]}</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label="Duration (minutes)"><input className={inputClass} type="number" value={dur} onChange={(e) => setDur(+e.target.value)} /></Field>
        <div className="rounded-xl bg-neutral-50 p-2.5">
          <div className="text-[9px] font-bold uppercase text-neutral-400">Training Load (sRPE)</div>
          <div className="text-lg font-extrabold text-brand-dark">{load}</div>
        </div>
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">Foster method: Load = RPE × duration. Basis for the Acute:Chronic Workload Ratio on the Athlete page.</p>
    </div>
  )
}

function VtLtCard() {
  const [vo2, setVo2] = useState(41)
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="text-sm font-extrabold">🌬️ Ventilatory & Lactate Threshold</div>
      <Field label="VO₂max (ml/kg/min)"><input className={inputClass} type="number" value={vo2} onChange={(e) => setVo2(+e.target.value)} /></Field>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">VT1/LT1</div><div className="text-base font-extrabold text-brand-dark">{(vo2 * 0.6).toFixed(1)}</div></div>
        <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">VT2/LT2</div><div className="text-base font-extrabold text-brand-dark">{(vo2 * 0.85).toFixed(1)}</div></div>
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">VT1/LT1 ≈ 55-65% VO₂max (lactate starts to rise slightly). VT2/LT2 ≈ 80-90% VO₂max (anaerobic threshold/RCP). Skinner & McLellan two-threshold model.</p>
    </div>
  )
}

function LactateRecoveryCard() {
  const [peak, setPeak] = useState(8)
  const [active, setActive] = useState(true)
  const [min, setMin] = useState(15)
  const halfLife = active ? 15 : 25
  const remaining = peak * Math.pow(0.5, min / halfLife)
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="text-sm font-extrabold">📉 Lactate Accumulation & Recovery</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label="Peak Lactate (mmol)"><input className={inputClass} type="number" value={peak} onChange={(e) => setPeak(+e.target.value)} /></Field>
        <Field label="Minutes after peak"><input className={inputClass} type="number" value={min} onChange={(e) => setMin(+e.target.value)} /></Field>
      </div>
      <div className="mt-2 flex gap-1.5">
        <button onClick={() => setActive(true)} className={'flex-1 rounded-xl py-1.5 text-[11px] font-bold ' + (active ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500')}>Active Recovery</button>
        <button onClick={() => setActive(false)} className={'flex-1 rounded-xl py-1.5 text-[11px] font-bold ' + (!active ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500')}>Passive Recovery</button>
      </div>
      <div className="mt-2 rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">Estimated Remaining Lactate</div><div className="text-lg font-extrabold text-brand-dark">{remaining.toFixed(1)} mmol</div></div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">Lactate half-life ≈15 minutes (active recovery/light jogging) vs ≈25 minutes (passive/rest). Exponential decay model.</p>
    </div>
  )
}

// Illustrative fat/CHO oxidation & lactate curve across zones — mirrors the
// classic "Metabolic Map" shape (fat peaks mid-intensity, then shuts off;
// lactate rises steeply near threshold).
function MetabolicMapCard() {
  const zones = [1, 2, 3, 4, 5, 6]
  const pts = zones.map((z) => {
    const hrPct = 45 + z * 9 // Z1≈54% .. Z6≈99%
    const fat = Math.max(0, 70 - Math.abs(hrPct - 58) * 1.7)
    const cho = 100 - fat
    const lac = 0.8 + Math.pow(hrPct / 100, 6) * 9
    return { z, hrPct, fat, cho, lac }
  })
  const W = 320, H = 140, pad = 24
  const x = (i: number) => pad + (i / (zones.length - 1)) * (W - pad * 2)
  const yPct = (v: number) => H - pad - (v / 100) * (H - pad * 2)
  const yLac = (v: number) => H - pad - (v / 10) * (H - pad * 2)
  const path = (get: (p: typeof pts[number]) => number) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${get(p).toFixed(1)}`).join(' ')
  return (
    <div className="mt-3 rounded-2xl bg-ink p-4 text-white">
      <div className="text-sm font-extrabold">🗺️ The Metabolic Map — Response to Training</div>
      <p className="text-[10px] text-white/50">Illustration of fat/carbohydrate oxidation & lactate per zone (not your direct test results)</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full">
        <path d={path((p) => yPct(p.fat))} fill="none" stroke="#f59e0b" strokeWidth="2" />
        <path d={path((p) => yPct(p.cho))} fill="none" stroke="#ef4444" strokeWidth="2" />
        <path d={path((p) => yLac(p.lac))} fill="none" stroke="#38bdf8" strokeWidth="2" />
        {pts.map((p, i) => <text key={p.z} x={x(i)} y={H - 6} fontSize="8" fill="rgba(255,255,255,0.5)" textAnchor="middle">Z{p.z}</text>)}
      </svg>
      <div className="mt-1 flex flex-wrap gap-3 text-[10px]">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />Fat Oxidation %</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />Carb Oxidation %</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-400" />Lactate (mmol)</span>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-white/70">The "Fat Max" peak typically sits at Z2 (±60% HRmax) — key for base training that uses fat as fuel. Above Z4, fat burning nearly stops ("No Fat Burning") and the body switches entirely to carbohydrate while lactate builds up quickly.</p>
    </div>
  )
}

/* ══════════════════ 2. STRENGTH & POWER ══════════════════ */
function PowerTab() {
  const [ex, setEx] = useState('Back Squat')
  const [w, setW] = useState(60)
  const [reps, setReps] = useState(5)
  const epley = w * (1 + reps / 30)
  const brzycki = reps < 37 ? w / (1.0278 - 0.0278 * reps) : 0
  const oneRm = (epley + brzycki) / 2
  const pctUsed = oneRm > 0 ? (w / oneRm) * 100 : 0
  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconActivity size={20} />} title="Strength & Power" subtitle="1RM, PPO, power-to-weight ratio, total mechanical work, FTP, MMP" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-neutral-100 p-4 sm:col-span-2">
          <div className="text-sm font-extrabold">🏋️ 1 Rep Max (1RM) & Submaximal Rep Test</div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Field label="Movement">
              <select className={inputClass} value={ex} onChange={(e) => setEx(e.target.value)}>
                {['Back Squat', 'Bench Press', 'Deadlift', 'Overhead Press'].map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Load (kg)"><input className={inputClass} type="number" value={w} onChange={(e) => setW(+e.target.value)} /></Field>
            <Field label="Reps"><input className={inputClass} type="number" value={reps} onChange={(e) => setReps(+e.target.value)} /></Field>
            <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">1RM ({ex})</div><div className="text-lg font-extrabold text-brand-dark">{oneRm.toFixed(0)} kg</div></div>
          </div>
          <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">Average of Epley (w×(1+reps/30)) & Brzycki (w/(1.0278−0.0278×reps)). This load is ≈{pctUsed.toFixed(0)}% of your 1RM — a safe submaximal test without lifting to full failure.</p>
        </div>

        <MetricCard id="ppo" name="Peak Power Output (Sayers, jump)" emoji="💥" unit="Watts"
          inputs={[{ key: 'jump', label: 'Jump Height', unit: 'cm', default: 40 }, { key: 'mass', label: 'Body Weight', unit: 'kg', default: 65 }]}
          compute={(v) => 51.9 * v.jump + 48.9 * v.mass - 2007}
          note="Sayers (1999) formula from Countermovement Jump: PPO = 51.9×height(cm) + 48.9×mass(kg) − 2007."
        />
        <MetricCard id="pbw" name="Power-to-Body-Weight Ratio" emoji="⚖️" unit="W/kg"
          inputs={[{ key: 'power', label: 'Power', unit: 'W', default: 250 }, { key: 'mass', label: 'Body Weight', unit: 'kg', default: 65 }]}
          compute={(v) => v.power / v.mass}
          interpret={(r) => { const n = r as number; return { label: n >= 5 ? 'Pro/Elite Class' : n >= 4 ? 'Very Good' : n >= 3 ? 'Good' : n >= 2 ? 'Recreational' : 'Beginner', tone: n >= 4 ? 'brand' : n >= 2.5 ? 'low' : 'neutral' } }}
          note="Common cycling FTP/kg benchmarks: <2 beginner, 2-3 recreational, 3-4 good, 4-5 very good, 5-6 pro class, 6+ world class."
        />
        <MetricCard id="tmw" name="Total Mechanical Work / Workload" emoji="🔧" unit="kJ"
          inputs={[{ key: 'power', label: 'Average Power', unit: 'W', default: 200 }, { key: 'time', label: 'Duration', unit: 'minutes', default: 60 }]}
          compute={(v) => (v.power * v.time * 60) / 1000}
          note="Work (kJ) = Power(W) × time(sec) ÷ 1000. Measure of the total mechanical 'work' of a session — approximates calories burned from muscular sources."
        />
        <MetricCard id="ftp" name="Functional Threshold Power (FTP)" emoji="🚴" unit="Watts"
          inputs={[{ key: 'p20', label: '20-minute Test Power', unit: 'W', default: 260 }]}
          compute={(v) => v.p20 * 0.95}
          note="FTP ≈ 95% of average power from a 20-minute time-trial test (Allen & Coggan). Practical proxy for cycling lactate threshold."
        />
        <MetricCard id="mmp" name="Mean Max Power (single point)" emoji="📊" unit="W"
          inputs={[{ key: 'dur', label: 'Duration', unit: 'sec', default: 300 }, { key: 'power', label: 'Best Power at this duration', unit: 'W', default: 280 }]}
          compute={(v) => v.power}
          note="Record the best point on your power-duration curve (e.g. 5s, 1min, 5min, 20min) to build a Mean Max Power profile over time."
        />
      </div>
    </Card>
  )
}

/* ══════════════════ 3. SPEED & AGILITY ══════════════════ */
function SpeedTab() {
  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconRun size={20} />} title="Speed & Agility" subtitle="MSS, ASR, acceleration, stride rate, reaction & Illinois Agility" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <MetricCard id="mss" name="Maximal Sprinting Speed (MSS)" emoji="🚀" unit="km/h"
          inputs={[{ key: 'val', label: 'Measured top speed (GPS/gate)', unit: 'km/h', default: 28 }]}
          compute={(v) => v.val}
          note="Measured maximal sprint speed. Team/sprint context: recreational <24, trained 24-28, elite 28-35+ km/h."
        />
        <MetricCard id="asr" name="Anaerobic Speed Reserve (ASR)" emoji="➕" unit="km/h"
          inputs={[{ key: 'mss', label: 'MSS', unit: 'km/h', default: 28 }, { key: 'vvo2', label: 'vVO₂max', unit: 'km/h', default: 18 }]}
          compute={(v) => v.mss - v.vvo2}
          note="ASR = MSS − speed at VO₂max. Pure anaerobic-speed capacity, important for repeated sprints & team sports."
        />
        <MetricCard id="accel" name="Acceleration (short sprint)" emoji="⚡" unit="m/s²"
          inputs={[{ key: 'dist', label: 'Distance', unit: 'm', default: 20 }, { key: 'time', label: 'Time', unit: 'sec', default: 3.2 }]}
          compute={(v) => (2 * v.dist) / (v.time * v.time)}
          note="From standstill (s=½at²): a = 2×distance ÷ time². Tested via 10-30m sprint from a standing start."
        />
        <MetricCard id="stride" name="Stride Rate (Cadence)" emoji="👟" unit="steps/min"
          inputs={[{ key: 'steps', label: 'Number of steps', default: 170 }, { key: 'time', label: 'Time', unit: 'sec', default: 60 }]}
          compute={(v) => (v.steps / v.time) * 60}
          interpret={(r) => { const n = r as number; return { label: n >= 170 ? 'Optimal' : n >= 160 ? 'Adequate' : 'Low', tone: n >= 170 ? 'brand' : 'low' } }}
          note="Typical target running cadence is 170-190 steps/minute — a higher cadence generally reduces impact/injury risk."
        />
        <ReactionTimeCard />
        <IllinoisCard />
      </div>
    </Card>
  )
}

function ReactionTimeCard() {
  const [state, setState] = useState<'idle' | 'waiting' | 'go' | 'early'>('idle')
  const [trials, setTrials] = useState<number[]>([])
  const tRef = useRef(0)
  const timerRef = useRef<number | null>(null)
  function start() {
    setState('waiting')
    const delay = 1000 + Math.random() * 3000
    timerRef.current = window.setTimeout(() => { tRef.current = performance.now(); setState('go') }, delay)
  }
  function click() {
    if (state === 'waiting') { if (timerRef.current) clearTimeout(timerRef.current); setState('early'); return }
    if (state === 'go') { const rt = performance.now() - tRef.current; setTrials((t) => [...t.slice(-4), rt]); setState('idle') }
  }
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])
  const avg = trials.length ? trials.reduce((a, b) => a + b, 0) / trials.length : 0
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="text-sm font-extrabold">⏱️ Reaction Time Test</div>
      <button onClick={state === 'idle' ? start : click}
        className={'mt-2 flex h-24 w-full items-center justify-center rounded-xl text-sm font-black text-white transition ' +
          (state === 'waiting' ? 'bg-rose-500' : state === 'go' ? 'bg-brand' : state === 'early' ? 'bg-amber-500' : 'bg-neutral-800')}>
        {state === 'idle' ? 'Press to start' : state === 'waiting' ? 'Wait for green…' : state === 'go' ? 'PRESS NOW!' : 'Too soon — try again'}
      </button>
      <div className="mt-2 rounded-xl bg-neutral-50 p-2.5">
        <div className="text-[9px] font-bold uppercase text-neutral-400">Average ({trials.length} trials)</div>
        <div className="text-lg font-extrabold text-brand-dark">{avg > 0 ? avg.toFixed(0) : '—'} ms</div>
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">Average adult ≈200-250ms; elite athletes can be &lt;180ms. Repeat 5× for a stable result.</p>
    </div>
  )
}

function IllinoisCard() {
  const [t, setT] = useState(17)
  const [g, setG] = useState<'M' | 'F'>('M')
  const bands = g === 'M'
    ? [[15.2, 'Excellent'], [16.1, 'Good'], [18.1, 'Average'], [19.3, 'Fair'], [999, 'Poor']] as const
    : [[17.0, 'Excellent'], [17.9, 'Good'], [21.7, 'Average'], [23.0, 'Fair'], [999, 'Poor']] as const
  const label = bands.find(([max]) => t <= max)?.[1] ?? 'Poor'
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="text-sm font-extrabold">🔀 Illinois Agility Test</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label="Time (seconds)"><input className={inputClass} type="number" step="0.1" value={t} onChange={(e) => setT(+e.target.value)} /></Field>
        <Field label="Gender">
          <select className={inputClass} value={g} onChange={(e) => setG(e.target.value as 'M' | 'F')}><option value="M">Male</option><option value="F">Female</option></select>
        </Field>
      </div>
      <div className="mt-2"><Badge tone={label === 'Excellent' || label === 'Good' ? 'brand' : label === 'Average' ? 'low' : 'critical'}>{label}</Badge></div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">Standard 10m cone track measures multi-directional agility — important for team sports/martial arts.</p>
    </div>
  )
}

/* ══════════════════ 4. FIELD TESTS ══════════════════ */
function FieldTestTab() {
  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconTimer size={20} />} title="Field Tests" subtitle="Vertical jump, broad jump, handgrip, multi-stage fitness test (bleep)" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <MetricCard id="vjump" name="Vertical Jump" emoji="⬆️" unit="cm"
          inputs={[{ key: 'cm', label: 'Jump Height', unit: 'cm', default: 40 }]}
          compute={(v) => v.cm}
          interpret={(r) => { const n = r as number; return { label: n >= 65 ? 'Elite' : n >= 55 ? 'Very Good' : n >= 45 ? 'Good' : n >= 35 ? 'Average' : 'Below Average', tone: n >= 55 ? 'brand' : n >= 40 ? 'low' : 'neutral' } }}
          note="Countermovement jump — proxy for explosive leg power. Elite jump/sprint athletes are typically &gt;60cm."
        />
        <MetricCard id="bjump" name="Standing Broad Jump" emoji="🦘" unit="cm"
          inputs={[{ key: 'cm', label: 'Jump Distance', unit: 'cm', default: 200 }]}
          compute={(v) => v.cm}
          interpret={(r) => { const n = r as number; return { label: n >= 250 ? 'Elite' : n >= 220 ? 'Good' : n >= 180 ? 'Average' : 'Below Average', tone: n >= 220 ? 'brand' : n >= 180 ? 'low' : 'neutral' } }}
          note="Horizontal leg power — correlates with sprint performance & change of direction."
        />
        <GripCard />
        <BleepTestCard />
      </div>
    </Card>
  )
}

function GripCard() {
  const [r, setR] = useState(38)
  const [l, setL] = useState(36)
  const [bw, setBw] = useState(65)
  const avg = (r + l) / 2
  const asym = Math.max(r, l) > 0 ? (Math.abs(r - l) / Math.max(r, l)) * 100 : 0
  const ratio = avg / bw
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="text-sm font-extrabold">✊ Handgrip Dynamometer</div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Field label="Right (kg)"><input className={inputClass} type="number" value={r} onChange={(e) => setR(+e.target.value)} /></Field>
        <Field label="Left (kg)"><input className={inputClass} type="number" value={l} onChange={(e) => setL(+e.target.value)} /></Field>
        <Field label="Weight (kg)"><input className={inputClass} type="number" value={bw} onChange={(e) => setBw(+e.target.value)} /></Field>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">Average</div><div className="text-lg font-extrabold text-brand-dark">{avg.toFixed(1)} kg</div></div>
        <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">Ratio / Weight</div><div className="text-lg font-extrabold text-brand-dark">{ratio.toFixed(2)}</div></div>
      </div>
      {asym > 10 && <div className="mt-2"><Badge tone="critical">⚠️ Asymmetry {asym.toFixed(0)}% — more than 10%</Badge></div>}
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">Grip strength is one of the strongest predictors of mortality (PURE study). A left-right asymmetry &gt;10% indicates a potential imbalance that needs correcting.</p>
    </div>
  )
}

function BleepTestCard() {
  const [level, setLevel] = useState(8)
  const speed = 8 + (level - 1) * 0.5
  const vo2 = 5.857 * speed - 19.458
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="text-sm font-extrabold">🔔 Multi-Stage Fitness Test (Bleep)</div>
      <Field label="Level reached (1-21)"><input className={inputClass} type="number" min={1} max={21} value={level} onChange={(e) => setLevel(+e.target.value)} /></Field>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">Final Speed</div><div className="text-lg font-extrabold text-brand-dark">{speed.toFixed(1)} km/h</div></div>
        <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">Estimated VO₂max</div><div className="text-lg font-extrabold text-brand-dark">{vo2.toFixed(1)}</div></div>
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">Léger & Gadoury (1989) formula: VO₂max = 5.857×speed(km/h) − 19.458. Field estimate, not a substitute for a lab test.</p>
    </div>
  )
}

/* ══════════════════ 5. RESPIRATORY & ENVIRONMENT ══════════════════ */
function RespiratoryTab() {
  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconChartUp size={20} />} title="Respiratory & Environment" subtitle="Ventilation, heat, hydration, acclimation vs altitude acclimatization" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <VentilationCard />
        <MetricCard id="tidal" name="Breathing Rate & Tidal Volume" emoji="🫁" unit="mL"
          inputs={[{ key: 'rr', label: 'Breathing rate', unit: '/min', default: 40 }, { key: 've', label: 'Minute Ventilation', unit: 'L/min', default: 100 }]}
          compute={(v) => (v.ve * 1000) / v.rr}
          note="Tidal Volume ≈ Minute Ventilation(mL) ÷ breathing rate. Normal resting breathing rate is 12-20/min, and can exceed 50/min at maximal effort."
        />
        <HydrationCard />
        <HeatStrainCard />
        <AltitudeCard />
        <IfCard />
      </div>
    </Card>
  )
}

function VentilationCard() {
  const [ve, setVe] = useState(100)
  const [vo2, setVo2] = useState(3.2)
  const [vco2, setVco2] = useState(3.4)
  const veVo2 = ve / vo2
  const veVco2 = ve / vco2
  const rer = vco2 / vo2
  return (
    <div className="rounded-2xl border border-neutral-100 p-4 sm:col-span-2">
      <div className="text-sm font-extrabold">💨 Ventilatory Equivalent (VE/VO₂, VE/VCO₂) & RER</div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Field label="VE (L/min)"><input className={inputClass} type="number" value={ve} onChange={(e) => setVe(+e.target.value)} /></Field>
        <Field label="VO₂ (L/min)"><input className={inputClass} type="number" step="0.1" value={vo2} onChange={(e) => setVo2(+e.target.value)} /></Field>
        <Field label="VCO₂ (L/min)"><input className={inputClass} type="number" step="0.1" value={vco2} onChange={(e) => setVco2(+e.target.value)} /></Field>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">VE/VO₂</div><div className="text-base font-extrabold text-brand-dark">{veVo2.toFixed(1)}</div></div>
        <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">VE/VCO₂</div><div className="text-base font-extrabold text-brand-dark">{veVco2.toFixed(1)}</div></div>
        <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">RER</div><div className="text-base font-extrabold text-brand-dark">{rer.toFixed(2)}</div></div>
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">VE/VO₂ rises sharply without VE/VCO₂ rising = VT1. Both rising together = VT2/RCP. RER &gt;1.0 indicates increased anaerobic contribution/hyperventilation.</p>
    </div>
  )
}

function HydrationCard() {
  const [pre, setPre] = useState(65)
  const [post, setPost] = useState(64)
  const [fluid, setFluid] = useState(0.5)
  const [hrs, setHrs] = useState(1)
  const rate = (pre - post + fluid) / hrs
  const lossPct = ((pre - post) / pre) * 100
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="text-sm font-extrabold">💧 Sweat Rate & Hydration</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label="Weight before (kg)"><input className={inputClass} type="number" step="0.1" value={pre} onChange={(e) => setPre(+e.target.value)} /></Field>
        <Field label="Weight after (kg)"><input className={inputClass} type="number" step="0.1" value={post} onChange={(e) => setPost(+e.target.value)} /></Field>
        <Field label="Fluid consumed (L)"><input className={inputClass} type="number" step="0.1" value={fluid} onChange={(e) => setFluid(+e.target.value)} /></Field>
        <Field label="Duration (hours)"><input className={inputClass} type="number" step="0.1" value={hrs} onChange={(e) => setHrs(+e.target.value)} /></Field>
      </div>
      <div className="mt-2 rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">Sweat Rate</div><div className="text-lg font-extrabold text-brand-dark">{rate.toFixed(2)} L/hour</div></div>
      {lossPct > 2 && <div className="mt-2"><Badge tone="critical">⚠️ Weight loss {lossPct.toFixed(1)}% — significant dehydration</Badge></div>}
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">A loss &gt;2% of body weight reduces performance & increases heat illness risk. 1L fluid ≈ 1kg.</p>
    </div>
  )
}

function HeatStrainCard() {
  const [temp, setTemp] = useState(30)
  const [hum, setHum] = useState(70)
  const risk = temp >= 32 || (temp >= 28 && hum >= 70) ? { l: 'High Risk', tone: 'critical' as const }
    : temp >= 24 ? { l: 'Moderate Risk', tone: 'low' as const } : { l: 'Low Risk', tone: 'brand' as const }
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="text-sm font-extrabold">🌡️ Heat Strain</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label="Temperature (°C)"><input className={inputClass} type="number" value={temp} onChange={(e) => setTemp(+e.target.value)} /></Field>
        <Field label="Humidity (%)"><input className={inputClass} type="number" value={hum} onChange={(e) => setHum(+e.target.value)} /></Field>
      </div>
      <div className="mt-2"><Badge tone={risk.tone}>{risk.l}</Badge></div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">A simple WBGT-style estimate. Temp &gt;32°C or (&gt;28°C + humidity &gt;70%) — lower intensity, increase hydration & acclimatization.</p>
    </div>
  )
}

function AltitudeCard() {
  const [alt, setAlt] = useState(2000)
  const [days, setDays] = useState(5)
  const neededDays = Math.max(7, (alt / 1000) * 7)
  const pct = Math.min(100, (days / neededDays) * 100)
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="text-sm font-extrabold">⛰️ Adaptation vs Altitude Acclimatization</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label="Altitude (m)"><input className={inputClass} type="number" value={alt} onChange={(e) => setAlt(+e.target.value)} /></Field>
        <Field label="Days at altitude"><input className={inputClass} type="number" value={days} onChange={(e) => setDays(+e.target.value)} /></Field>
      </div>
      <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-neutral-100"><div className="absolute inset-y-0 left-0 rounded-full bg-brand" style={{ width: `${pct}%` }} /></div>
      <div className="mt-1 text-[11px] font-bold text-brand-dark">{pct.toFixed(0)}% acclimatized (estimated ~{neededDays.toFixed(0)} days for full adaptation)</div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">
        <b>Acclimatization</b> = short-term individual physiological adjustment (days-weeks): increased red blood cell production, ventilation. <b>Adaptation</b> = long-term genetic/population-level change (generations) in high-altitude populations.
      </p>
    </div>
  )
}

function IfCard() {
  const [start, setStart] = useState('12:00')
  const [end, setEnd] = useState('20:00')
  const toH = (s: string) => { const [h, m] = s.split(':').map(Number); return h + m / 60 }
  const window = (toH(end) - toH(start) + 24) % 24
  const fasting = 24 - window
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="text-sm font-extrabold">⏳ Intermittent Fasting & Training Timing</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label="Eating window start"><input className={inputClass} type="time" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
        <Field label="Eating window end"><input className={inputClass} type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">Eating Window</div><div className="text-base font-extrabold text-brand-dark">{window.toFixed(1)} hours</div></div>
        <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">Fasting</div><div className="text-base font-extrabold text-brand-dark">{fasting.toFixed(1)} hours</div></div>
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">Zone 2/light sessions are safe while fasted (fat-adapted). High-intensity/strength sessions should ideally be scheduled within the eating window so glycogen is sufficient.</p>
    </div>
  )
}

/* ══════════════════ 6. LOAD & MANAGEMENT ══════════════════ */
function LoadTab() {
  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconGauge size={20} />} title="Load & Management" subtitle="TSS, MAP, Karvonen HR zones, rep-max, work & fatigue" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <TssCard />
        <MetricCard id="map" name="Mean Arterial Pressure (MAP)" emoji="🩺" unit="mmHg"
          inputs={[{ key: 'sbp', label: 'Systolic', unit: 'mmHg', default: 120 }, { key: 'dbp', label: 'Diastolic', unit: 'mmHg', default: 80 }]}
          compute={(v) => v.dbp + (v.sbp - v.dbp) / 3}
          interpret={(r) => { const n = r as number; return { label: n >= 70 && n <= 100 ? 'Optimal' : n > 100 ? 'High' : 'Low', tone: n >= 70 && n <= 100 ? 'brand' : 'critical' } }}
          note="MAP = DBP + ⅓(SBP−DBP). Optimal range ≈70-100 mmHg — adequate organ perfusion."
        />
        <KarvonenCard />
        <HrMaxCard />
        <TrainingLoadRecapCard />
      </div>
    </Card>
  )
}

function TssCard() {
  const [dur, setDur] = useState(60)
  const [np, setNp] = useState(220)
  const [ftp, setFtp] = useState(250)
  const ifactor = np / ftp
  const tss = (dur * 60 * np * ifactor) / (ftp * 3600) * 100
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="text-sm font-extrabold">📐 Training Stress Score (TSS)</div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Field label="Duration (min)"><input className={inputClass} type="number" value={dur} onChange={(e) => setDur(+e.target.value)} /></Field>
        <Field label="NP (W)"><input className={inputClass} type="number" value={np} onChange={(e) => setNp(+e.target.value)} /></Field>
        <Field label="FTP (W)"><input className={inputClass} type="number" value={ftp} onChange={(e) => setFtp(+e.target.value)} /></Field>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">Intensity Factor</div><div className="text-base font-extrabold text-brand-dark">{ifactor.toFixed(2)}</div></div>
        <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">TSS</div><div className="text-base font-extrabold text-brand-dark">{tss.toFixed(0)}</div></div>
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">TSS = (duration × NP × IF)/(FTP × 3600) × 100. 100 TSS ≈ 1 hour all-out at FTP. &gt;150/session = heavy load, needs extra recovery.</p>
    </div>
  )
}

function KarvonenCard() {
  const [hrmax, setHrmax] = useState(190)
  const [hrrest, setHrrest] = useState(60)
  const [lo, setLo] = useState(60)
  const [hi, setHi] = useState(70)
  const target = (pct: number) => Math.round((hrmax - hrrest) * (pct / 100) + hrrest)
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="text-sm font-extrabold">🎯 Training HR Zones (Karvonen)</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label="HRmax"><input className={inputClass} type="number" value={hrmax} onChange={(e) => setHrmax(+e.target.value)} /></Field>
        <Field label="Resting HR"><input className={inputClass} type="number" value={hrrest} onChange={(e) => setHrrest(+e.target.value)} /></Field>
        <Field label="Low intensity (%)"><input className={inputClass} type="number" value={lo} onChange={(e) => setLo(+e.target.value)} /></Field>
        <Field label="High intensity (%)"><input className={inputClass} type="number" value={hi} onChange={(e) => setHi(+e.target.value)} /></Field>
      </div>
      <div className="mt-2 rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">Target HR Range</div><div className="text-lg font-extrabold text-brand-dark">{target(lo)}–{target(hi)} bpm</div></div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">Karvonen: Target = (HRmax−HRrest)×%intensity + HRrest. More personalized than %HRmax alone since it accounts for Heart Rate Reserve.</p>
    </div>
  )
}

function HrMaxCard() {
  const [age, setAge] = useState(26)
  const [g, setG] = useState<'M' | 'F'>('M')
  const classic = 220 - age
  const tanaka = 208 - 0.7 * age
  const gulati = 206 - 0.88 * age
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="text-sm font-extrabold">❤️ HRmax Estimate</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label="Age"><input className={inputClass} type="number" value={age} onChange={(e) => setAge(+e.target.value)} /></Field>
        <Field label="Gender"><select className={inputClass} value={g} onChange={(e) => setG(e.target.value as 'M' | 'F')}><option value="M">Male</option><option value="F">Female</option></select></Field>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-neutral-50 p-2"><div className="text-[8px] font-bold text-neutral-400">220-age</div><div className="text-base font-extrabold text-brand-dark">{classic}</div></div>
        <div className="rounded-xl bg-neutral-50 p-2"><div className="text-[8px] font-bold text-neutral-400">Tanaka</div><div className="text-base font-extrabold text-brand-dark">{tanaka.toFixed(0)}</div></div>
        {g === 'F' && <div className="rounded-xl bg-neutral-50 p-2"><div className="text-[8px] font-bold text-neutral-400">Gulati (F)</div><div className="text-base font-extrabold text-brand-dark">{gulati.toFixed(0)}</div></div>}
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">Tanaka (208−0.7×age) is generally more accurate than 220-age. Gulati (206−0.88×age) is specifically validated for women.</p>
    </div>
  )
}

// Read-only recap pulling the same acuteLoad/chronicLoad the Athlete page
// already collects — keeps ATL/CTL/TSB consistent across pages without a
// second editable copy of the same data.
function TrainingLoadRecapCard() {
  const data = useMemo(() => { try { return JSON.parse(localStorage.getItem('pm_athlete_profile') || '{}') } catch { return {} } }, [])
  const acute = data.acuteLoad || 0, chronic = data.chronicLoad || 0
  const acwr = chronic > 0 ? acute / chronic : 0
  const ctl = chronic / 7, atl = acute / 7, tsb = ctl - atl
  return (
    <div className="rounded-2xl border border-neutral-100 p-4 sm:col-span-2">
      <div className="text-sm font-extrabold">📋 Load Summary (from the Athlete page)</div>
      <div className="mt-2 grid grid-cols-4 gap-2 text-center">
        <div className="rounded-xl bg-neutral-50 p-2"><div className="text-[8px] font-bold text-neutral-400">ACWR</div><div className="text-base font-extrabold text-brand-dark">{acwr > 0 ? acwr.toFixed(2) : '—'}</div></div>
        <div className="rounded-xl bg-neutral-50 p-2"><div className="text-[8px] font-bold text-neutral-400">CTL (Fitness)</div><div className="text-base font-extrabold text-brand-dark">{chronic > 0 ? ctl.toFixed(0) : '—'}</div></div>
        <div className="rounded-xl bg-neutral-50 p-2"><div className="text-[8px] font-bold text-neutral-400">ATL (Fatigue)</div><div className="text-base font-extrabold text-brand-dark">{acute > 0 ? atl.toFixed(0) : '—'}</div></div>
        <div className="rounded-xl bg-neutral-50 p-2"><div className="text-[8px] font-bold text-neutral-400">TSB (Form)</div><div className="text-base font-extrabold text-brand-dark">{chronic > 0 ? tsb.toFixed(0) : '—'}</div></div>
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">This data is edited from the <a href="#/athlete" className="font-bold text-brand-dark underline">Athlete page</a> — shown here so all load metrics are visible in one Lab.</p>
    </div>
  )
}

/* ══════════════════ 7. ECONOMY & DURABILITY ══════════════════ */
function EconomyTab() {
  const { state } = useStore()
  const last = state.gpsActivities?.[state.gpsActivities.length - 1]
  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconRun size={20} />} title="Economy & Durability" subtitle="Running/cycling economy, durability, GPS summary" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <MetricCard id="re" name="Running Economy" emoji="🏃" unit="mL/kg/km"
          inputs={[{ key: 'vo2', label: 'Submaximal VO₂', unit: 'ml/kg/min', default: 40 }, { key: 'speed', label: 'Speed', unit: 'km/h', default: 12 }]}
          compute={(v) => (v.vo2 * 60) / v.speed}
          interpret={(r) => { const n = r as number; return { label: n <= 170 ? 'Very Economical' : n <= 200 ? 'Good' : 'Room to Improve', tone: n <= 190 ? 'brand' : 'low' } }}
          note="Lower = more oxygen-efficient at the same speed. Elite marathon runners are ≈150-170 mL/kg/km."
        />
        <MetricCard id="ge" name="Cycling Gross Efficiency" emoji="🚴" unit="%"
          inputs={[{ key: 'power', label: 'Power output', unit: 'W', default: 200 }, { key: 'vo2', label: 'VO₂', unit: 'L/min', default: 2.8 }]}
          compute={(v) => (v.power / (v.vo2 * 348.3)) * 100}
          note="GE% = Power(W) ÷ (VO₂(L/min) × 348.3W) × 100 — estimated from the O₂ energy equivalent ≈20.9kJ/L. Trained cyclists ≈20-23%."
        />
        <DurabilityCard />
        <div className="rounded-2xl border border-neutral-100 p-4">
          <div className="text-sm font-extrabold">📍 Last GPS Activity Summary</div>
          {last ? (
            <div className="mt-2 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-neutral-50 p-2"><div className="text-[8px] font-bold text-neutral-400">Distance</div><div className="text-base font-extrabold text-brand-dark">{last.distKm.toFixed(2)} km</div></div>
              <div className="rounded-xl bg-neutral-50 p-2"><div className="text-[8px] font-bold text-neutral-400">Avg Speed</div><div className="text-base font-extrabold text-brand-dark">{last.avgSpeedKmh.toFixed(1)} km/h</div></div>
            </div>
          ) : <p className="mt-2 text-[11px] text-neutral-400">No GPS activity recorded yet.</p>}
          <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">Elevation & terrain (flat/rolling/hilly) appear directly while recording in the GPS Tracker (Home).</p>
        </div>
      </div>
    </Card>
  )
}

function DurabilityCard() {
  const [first, setFirst] = useState(300)
  const [last, setLast] = useState(270)
  const decay = ((first - last) / first) * 100
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="text-sm font-extrabold">🛡️ Durability (Performance Decline)</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label="Power/speed, early segment"><input className={inputClass} type="number" value={first} onChange={(e) => setFirst(+e.target.value)} /></Field>
        <Field label="Power/speed, late segment"><input className={inputClass} type="number" value={last} onChange={(e) => setLast(+e.target.value)} /></Field>
      </div>
      <div className="mt-2 rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">Decline</div><div className="text-lg font-extrabold text-brand-dark">{decay.toFixed(1)}%</div></div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">Use a unit where a higher number = better (power/speed, not pace). Low durability (&lt;5% decline) indicates very good endurance in long sessions.</p>
    </div>
  )
}

export default PerformanceLab
