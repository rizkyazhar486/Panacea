import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass } from '../components/ui'
import { IconActivity } from '../components/icons'
import { getDemo } from '../lib/profile'

// ─────────────────────────────────────────────────────────────────────────────
// Daily Hydration Calculator — pure arithmetic, no external API. Baseline is
// the commonly-cited clinical rule of thumb of ~30-35 mL/kg/day for a healthy
// adult at rest in a temperate climate (used widely in nutrition & geriatric
// references); this tool uses 33 mL/kg as the midpoint. Add-ons for exercise
// (ACSM guidance: roughly replace 400-800 mL of sweat loss per hour of
// activity, depending on intensity), hot/humid climate (+500 mL/day is a
// common practical adjustment), pregnancy (+300 mL/day) and breastfeeding
// (+700 mL/day) follow IOM/EFSA total-water-intake guidance. These are
// population averages — thirst, urine color, and a clinician's advice (e.g.
// for kidney/heart/liver conditions where fluid may need to be RESTRICTED)
// should always override a generic calculator.
// ─────────────────────────────────────────────────────────────────────────────

type Intensity = 'none' | 'light' | 'moderate' | 'intense'
const INTENSITY_ML_PER_HOUR: Record<Intensity, number> = { none: 0, light: 400, moderate: 600, intense: 800 }

export function HydrationCalculator() {
  const demo = getDemo()
  const [weightKg, setWeightKg] = useState(demo.weightKg || 70)
  const [exerciseMin, setExerciseMin] = useState(0)
  const [intensity, setIntensity] = useState<Intensity>('moderate')
  const [hotClimate, setHotClimate] = useState(false)
  const [pregnant, setPregnant] = useState(false)
  const [breastfeeding, setBreastfeeding] = useState(false)

  const baseMl = weightKg * 33
  const exerciseMl = (exerciseMin / 60) * INTENSITY_ML_PER_HOUR[intensity]
  const climateMl = hotClimate ? 500 : 0
  const pregnancyMl = pregnant ? 300 : 0
  const breastfeedingMl = breastfeeding ? 700 : 0
  const totalMl = baseMl + exerciseMl + climateMl + pregnancyMl + breastfeedingMl
  const totalL = totalMl / 1000
  const glasses = Math.round(totalMl / 250)

  const rows = [
    { label: 'Baseline (33 mL/kg body weight)', ml: baseMl },
    { label: `Exercise (${exerciseMin} min, ${intensity})`, ml: exerciseMl },
    { label: 'Hot/humid climate', ml: climateMl },
    { label: 'Pregnancy', ml: pregnancyMl },
    { label: 'Breastfeeding', ml: breastfeedingMl },
  ].filter((r) => r.ml > 0)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Daily Hydration Calculator" subtitle="Estimate your daily fluid target from weight, activity & climate" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          This is a population-average estimate, not a personal prescription. Thirst and pale-yellow urine
          are the best everyday guides for most healthy people. If you have a kidney, heart, or liver
          condition where fluid may need to be <b>restricted</b>, follow your clinician's guidance instead
          of this number.
        </p>
      </Card>

      <Card className="!p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Body weight (kg)">
            <input className={inputClass} type="number" min={30} max={200} value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Exercise today (minutes)">
            <input className={inputClass} type="number" min={0} max={600} value={exerciseMin} onChange={(e) => setExerciseMin(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Exercise intensity">
            <select className={inputClass} value={intensity} onChange={(e) => setIntensity(e.target.value as Intensity)}>
              <option value="none">No exercise</option>
              <option value="light">Light (easy walk, gentle yoga)</option>
              <option value="moderate">Moderate (jog, cycling, gym session)</option>
              <option value="intense">Intense (hard training, hot/humid, heavy sweating)</option>
            </select>
          </Field>
          <div className="flex flex-col justify-end gap-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-600">
              <input type="checkbox" checked={hotClimate} onChange={(e) => setHotClimate(e.target.checked)} className="h-4 w-4 accent-brand" /> Hot / humid climate
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-600">
              <input type="checkbox" checked={pregnant} onChange={(e) => setPregnant(e.target.checked)} className="h-4 w-4 accent-brand" /> Pregnant
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-600">
              <input type="checkbox" checked={breastfeeding} onChange={(e) => setBreastfeeding(e.target.checked)} className="h-4 w-4 accent-brand" /> Breastfeeding
            </label>
          </div>
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Your estimated daily target</div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-black text-brand-dark">{totalL.toFixed(1)} L</span>
          <span className="text-sm font-semibold text-neutral-500">≈ {glasses} glasses (250 mL each)</span>
        </div>
        <div className="mt-4 space-y-1.5">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-2 text-[12px]">
              <span className="w-52 shrink-0 truncate text-neutral-500">{r.label}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                <span className="block h-full rounded-full bg-sky-400" style={{ width: `${(r.ml / totalMl) * 100}%` }} />
              </span>
              <span className="w-14 shrink-0 text-right font-semibold text-neutral-600">{Math.round(r.ml)} mL</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-neutral-400">
          Includes water from all beverages and food (roughly 20% of intake typically comes from food).
          Spread intake across the day rather than drinking it all at once.
        </p>
      </Card>
    </div>
  )
}

export default HydrationCalculator
