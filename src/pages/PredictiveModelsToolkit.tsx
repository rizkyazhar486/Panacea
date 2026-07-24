import { useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconGauge } from '../components/icons'
import { getDemo } from '../lib/profile'

// ─────────────────────────────────────────────────────────────────────────────
// Predictive Models Toolkit — six small, real mathematical models in one
// page: an autophagy-onset timing estimate, a cortisol awakening response
// curve, a sauna-to-cardio equivalence converter, an ultra-processed-food
// (NOVA-style) scorer, a glycemic-load optimizer, and a "healthspan
// dividend" habit-compounding projection. Every model here is illustrative
// math applied to population-average parameters, not a personalized
// biological measurement — framed accordingly. Pure client-side, no
// external API.
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'autophagy' | 'cortisol' | 'sauna' | 'nova' | 'glycemic' | 'healthspan'

function AutophagyTiming() {
  const [weightKg, setWeightKg] = useState(() => getDemo().weightKg || 70)
  const [bodyFatPct, setBodyFatPct] = useState(20)
  const [lastMealHoursAgo, setLastMealHoursAgo] = useState(2)
  // Illustrative model: glycogen stores ~ liver glycogen (~100-120g) depleted
  // over roughly 12-16h at typical resting glucose utilization, faster with
  // lower body fat / higher activity. This is a rough population-average
  // heuristic, not a measurement of the user's actual glycogen or autophagy.
  const leanMassFactor = 1 - bodyFatPct / 100
  const baseHours = 14 - leanMassFactor * 2
  const hoursRemaining = Math.max(0, baseHours - lastMealHoursAgo)
  const autophagyStarted = hoursRemaining <= 0

  return (
    <Card className="!p-5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Weight (kg)"><input className={inputClass} type="number" value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value) || 0)} /></Field>
        <Field label="Body fat %"><input className={inputClass} type="number" value={bodyFatPct} onChange={(e) => setBodyFatPct(Number(e.target.value) || 0)} /></Field>
        <Field label="Hours since last meal"><input className={inputClass} type="number" value={lastMealHoursAgo} onChange={(e) => setLastMealHoursAgo(Number(e.target.value) || 0)} /></Field>
      </div>
      <div className="mt-3 rounded-xl bg-brand/10 p-4 text-center">
        {autophagyStarted
          ? <div className="text-lg font-black text-brand-dark">Likely in early autophagy range</div>
          : <><div className="text-2xl font-black text-brand-dark">~{hoursRemaining.toFixed(1)}h</div><div className="text-[11px] text-neutral-500">until likely glycogen depletion / autophagy upregulation begins</div></>}
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-neutral-500">
        Illustrative estimate based on typical liver glycogen depletion timing (roughly 12-16h fasted,
        varies with body composition and activity) — not a direct measurement of your glycogen or
        autophagy status, which can only be assessed in a research lab.
      </p>
    </Card>
  )
}

function CortisolAwakening() {
  const [wakeTime, setWakeTime] = useState('06:30')
  const [lightWithin, setLightWithin] = useState(30)
  const [coffeeWithin, setCoffeeWithin] = useState(60)
  const points = useMemo(() => {
    const pts: { min: number; level: number }[] = []
    for (let min = 0; min <= 120; min += 5) {
      // Illustrative CAR curve: peaks ~30-45min after waking, morning light
      // exposure sharpens/raises the peak somewhat, early caffeine blunts the
      // natural curve's decline. This is a stylized shape, not measured cortisol.
      const peak = 30 + (lightWithin <= 30 ? -5 : lightWithin <= 60 ? 0 : 10)
      let level = 40 + 60 * Math.exp(-((min - peak) ** 2) / (2 * 25 ** 2))
      if (min > 90 && coffeeWithin <= 60) level += 8
      pts.push({ min, level: Math.max(20, Math.min(100, level)) })
    }
    return pts
  }, [lightWithin, coffeeWithin])

  return (
    <Card className="!p-5">
      <div className="grid grid-cols-3 gap-3">
        <Field label="Wake time"><input className={inputClass} type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} /></Field>
        <Field label="Daylight within (min)"><input className={inputClass} type="number" value={lightWithin} onChange={(e) => setLightWithin(Number(e.target.value) || 0)} /></Field>
        <Field label="Coffee within (min)"><input className={inputClass} type="number" value={coffeeWithin} onChange={(e) => setCoffeeWithin(Number(e.target.value) || 0)} /></Field>
      </div>
      <svg viewBox="0 0 300 100" className="mt-3 w-full">
        <polyline fill="none" stroke="#00BF63" strokeWidth="2" points={points.map((p) => `${p.min * 2.4},${100 - p.level}`).join(' ')} />
      </svg>
      <p className="mt-2 text-center text-[11px] text-neutral-400">Illustrative shape from {wakeTime} · 0-120 min after waking</p>
      <p className="mt-3 text-[12px] leading-relaxed text-neutral-500">
        A stylized visualization of the well-documented cortisol awakening response pattern (a natural
        rise peaking ~30-45 min after waking) — not your measured cortisol, which requires a saliva or
        blood test at multiple timepoints.
      </p>
    </Card>
  )
}

function SaunaEquivalent() {
  const [minutes, setMinutes] = useState(20)
  const [tempC, setTempC] = useState(80)
  // Illustrative: published sauna studies show heart rates of ~100-150bpm at
  // 80°C sessions, comparable to a brisk walk/light jog. Rough linear scaling
  // by time and temperature above a resting baseline of 70°C sauna.
  const intensityFactor = Math.max(0.5, (tempC - 60) / 20)
  const equivalentWalkMin = Math.round(minutes * intensityFactor * 0.8)
  return (
    <Card className="!p-5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Session length (min)"><input className={inputClass} type="number" value={minutes} onChange={(e) => setMinutes(Number(e.target.value) || 0)} /></Field>
        <Field label="Temperature (°C)"><input className={inputClass} type="number" value={tempC} onChange={(e) => setTempC(Number(e.target.value) || 0)} /></Field>
      </div>
      <div className="mt-3 rounded-xl bg-brand/10 p-4 text-center">
        <div className="text-2xl font-black text-brand-dark">≈ {equivalentWalkMin} min brisk walk</div>
        <div className="text-[11px] text-neutral-500">Estimated cardiovascular strain equivalence</div>
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-neutral-500">
        Based on published heart-rate data from sauna studies (elevated HR similar to light-moderate
        aerobic exercise) — a rough population-average comparison, not a personal calorie or fitness
        measurement. Regular sauna use (4-7x/week) is separately associated with lower cardiovascular
        mortality in observational cohorts.
      </p>
    </Card>
  )
}

const NOVA_MARKERS = ['high-fructose corn syrup', 'hydrogenated oil', 'artificial flavor', 'artificial color', 'emulsifier', 'maltodextrin', 'protein isolate', 'modified starch', 'preservative', 'flavor enhancer', 'msg']
function NovaScorer() {
  const [text, setText] = useState('')
  const hits = useMemo(() => {
    const lower = text.toLowerCase()
    return NOVA_MARKERS.filter((m) => lower.includes(m))
  }, [text])
  const score = Math.max(0, 100 - hits.length * 15)
  const band = score >= 80 ? ['Mostly minimally-processed', 'brand'] : score >= 50 ? ['Moderately processed', 'low'] : ['Heavily processed', 'critical']
  return (
    <Card className="!p-5">
      <p className="text-[13px] text-neutral-500">Paste an ingredient list or a list of foods you ate — this scans for common ultra-processing markers (a NOVA-inspired heuristic, not the official NOVA classification methodology).</p>
      <textarea className={`${inputClass} mt-2 min-h-24`} placeholder="e.g. sugar, high-fructose corn syrup, modified starch, natural flavor…" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="mt-3 rounded-xl bg-brand/10 p-4 text-center">
        <div className="text-2xl font-black text-brand-dark">{score}/100</div>
        <Badge tone={band[1] as 'brand' | 'low' | 'critical'}>{band[0]}</Badge>
      </div>
      {hits.length > 0 && <p className="mt-2 text-[12px] text-neutral-500">Flagged: {hits.join(', ')}</p>}
    </Card>
  )
}

const GI_FOODS = [
  { name: 'White rice', gi: 73, carbsPer100: 28 },
  { name: 'Brown rice', gi: 68, carbsPer100: 23 },
  { name: 'White bread', gi: 75, carbsPer100: 49 },
  { name: 'Oats', gi: 55, carbsPer100: 66 },
  { name: 'Banana', gi: 51, carbsPer100: 23 },
  { name: 'Sweet potato', gi: 63, carbsPer100: 20 },
  { name: 'Lentils', gi: 32, carbsPer100: 20 },
  { name: 'Apple', gi: 36, carbsPer100: 14 },
]
function GlycemicOptimizer() {
  const [foodIdx, setFoodIdx] = useState(0)
  const [grams, setGrams] = useState(150)
  const [addFiber, setAddFiber] = useState(false)
  const [addFat, setAddFat] = useState(false)
  const food = GI_FOODS[foodIdx]
  const carbs = (food.carbsPer100 * grams) / 100
  let gl = (food.gi * carbs) / 100
  if (addFiber) gl *= 0.8
  if (addFat) gl *= 0.85
  const band = gl <= 10 ? ['Low', 'brand'] : gl <= 20 ? ['Medium', 'low'] : ['High', 'critical']
  return (
    <Card className="!p-5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Food">
          <select className={inputClass} value={foodIdx} onChange={(e) => setFoodIdx(Number(e.target.value))}>
            {GI_FOODS.map((f, i) => <option key={f.name} value={i}>{f.name}</option>)}
          </select>
        </Field>
        <Field label="Amount (g)"><input className={inputClass} type="number" value={grams} onChange={(e) => setGrams(Number(e.target.value) || 0)} /></Field>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={() => setAddFiber((v) => !v)} className={`flex-1 rounded-xl py-2 text-[12px] font-bold ${addFiber ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>+ Fiber (veg/salad)</button>
        <button onClick={() => setAddFat((v) => !v)} className={`flex-1 rounded-xl py-2 text-[12px] font-bold ${addFat ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>+ Fat/protein</button>
      </div>
      <div className="mt-3 rounded-xl bg-brand/10 p-4 text-center">
        <div className="text-2xl font-black text-brand-dark">{gl.toFixed(1)}</div>
        <Badge tone={band[1] as 'brand' | 'low' | 'critical'}>{band[0]} glycemic load</Badge>
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">
        Glycemic load = (GI × carbs per serving) / 100 — adding fiber or fat/protein before/with a
        high-GI food is well-documented to blunt the resulting glucose spike, modeled here as an
        illustrative reduction, not a measurement of your actual blood sugar response.
      </p>
    </Card>
  )
}

function HealthspanDividend() {
  const [habits, setHabits] = useState({ exercise: true, sleep: true, diet: false, noSmoke: true, social: false })
  const active = Object.values(habits).filter(Boolean).length
  const yearsPerHabit = 1.5 // illustrative, roughly informed by observational cohort effect sizes for combined lifestyle factors
  const years = active * yearsPerHabit
  const points = useMemo(() => Array.from({ length: 31 }, (_, y) => ({ year: y, value: (years / 30) * y * y * 0.05 + (years / 30) * y })), [years])
  const maxVal = points[points.length - 1]?.value || 1

  return (
    <Card className="!p-5">
      <p className="text-[13px] text-neutral-500">Toggle the habits you maintain consistently — based on combined-lifestyle-factor effect sizes seen in large cohort studies (e.g. never smoking, regular exercise, healthy diet, healthy BMI, moderate alcohol).</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(Object.keys(habits) as (keyof typeof habits)[]).map((k) => (
          <button key={k} onClick={() => setHabits((h) => ({ ...h, [k]: !h[k] }))} className={`rounded-xl py-2 text-[12px] font-bold capitalize ${habits[k] ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
            {k === 'noSmoke' ? 'Never smoke' : k}
          </button>
        ))}
      </div>
      <div className="mt-3 rounded-xl bg-brand/10 p-4 text-center">
        <div className="text-3xl font-black text-brand-dark">+{years.toFixed(1)} years</div>
        <div className="text-[11px] text-neutral-500">Illustrative projected healthy-life addition, sustained over decades</div>
      </div>
      <svg viewBox="0 0 300 100" className="mt-3 w-full">
        <polyline fill="none" stroke="#00BF63" strokeWidth="2" points={points.map((p) => `${p.year * 9.6},${100 - (p.value / maxVal) * 90}`).join(' ')} />
      </svg>
      <p className="mt-2 text-[11px] text-neutral-400">Compounding effect over a 30-year horizon</p>
    </Card>
  )
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'autophagy', label: 'Autophagy Timing' },
  { id: 'cortisol', label: 'Cortisol Curve' },
  { id: 'sauna', label: 'Sauna Equivalent' },
  { id: 'nova', label: 'Ultra-Processed Scorer' },
  { id: 'glycemic', label: 'Glycemic Load' },
  { id: 'healthspan', label: 'Healthspan Dividend' },
]

export function PredictiveModelsToolkit() {
  const [tab, setTab] = useState<Tab>('autophagy')
  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconGauge size={20} />} title="Predictive Models Toolkit" subtitle="Six real mathematical models in one place" />
        <p className="mt-2 text-[13px] leading-relaxed text-amber-700 dark:text-amber-300">
          Every model here applies published, population-average patterns to your inputs — none of them
          measure your actual biology directly. Think of these as educated illustrations, not lab results.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${tab === t.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>{t.label}</button>
          ))}
        </div>
      </Card>

      {tab === 'autophagy' && <AutophagyTiming />}
      {tab === 'cortisol' && <CortisolAwakening />}
      {tab === 'sauna' && <SaunaEquivalent />}
      {tab === 'nova' && <NovaScorer />}
      {tab === 'glycemic' && <GlycemicOptimizer />}
      {tab === 'healthspan' && <HealthspanDividend />}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Illustrative educational models based on published research patterns — not personalized
        measurements, lab results, or medical advice.
      </div>
    </div>
  )
}

export default PredictiveModelsToolkit
