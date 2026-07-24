import { useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'
import { CopyNote } from '../components/CopyNote'

// ─────────────────────────────────────────────────────────────────────────────
// Fluid & Electrolyte Calculators — maintenance (Holliday-Segar), fluid
// resuscitation (adult sepsis/shock + pediatric PALS boluses), and common
// electrolyte corrections (corrected sodium for hyperglycemia, Adrogue-Madias
// sodium correction rate, potassium deficit estimate). Pure arithmetic,
// standard published formulas, no external API. Bedside estimates only.
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'maintenance' | 'resuscitation' | 'electrolytes'

function holliday(weightKg: number): number {
  if (weightKg <= 10) return 100 * weightKg
  if (weightKg <= 20) return 1000 + 50 * (weightKg - 10)
  return 1500 + 20 * (weightKg - 20)
}

function MaintenanceFluid() {
  const [weightKg, setWeightKg] = useState(70)
  const dailyMl = holliday(weightKg)
  const hourlyMl = dailyMl / 24
  const naMeq = weightKg <= 10 ? 3 * weightKg : weightKg <= 20 ? 30 + 2 * (weightKg - 10) : 50 + (weightKg - 20)
  const kMeq = weightKg <= 10 ? 2 * weightKg : weightKg <= 20 ? 20 + 1 * (weightKg - 10) : 30 + 0.5 * (weightKg - 20)
  const summary = `Maintenance fluid (Holliday-Segar), BB ${weightKg}kg: ${dailyMl.toFixed(0)} mL/day (${hourlyMl.toFixed(1)} mL/hr). Na ~${naMeq.toFixed(0)} mEq/day, K ~${kMeq.toFixed(0)} mEq/day.`
  return (
    <Card className="!p-5">
      <p className="text-[13px] text-neutral-500">Holliday-Segar "4-2-1" rule — daily maintenance fluid need by weight, plus an approximate daily electrolyte allowance (2-3 mEq/kg Na, 1-2 mEq/kg K, roughly capped per the standard bands below).</p>
      <Field label="Weight (kg)">
        <input className={inputClass} type="number" min={1} step={0.1} value={weightKg || ''} onChange={(e) => setWeightKg(Number(e.target.value) || 0)} />
      </Field>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-brand/10 p-3 text-center">
          <div className="text-[11px] font-bold text-neutral-500">Daily (100-50-20)</div>
          <div className="text-2xl font-black text-brand-dark">{dailyMl.toFixed(0)} mL</div>
        </div>
        <div className="rounded-xl bg-brand/10 p-3 text-center">
          <div className="text-[11px] font-bold text-neutral-500">Rate (4-2-1)</div>
          <div className="text-2xl font-black text-brand-dark">{hourlyMl.toFixed(1)} mL/hr</div>
        </div>
      </div>
      <div className="mt-3 flex justify-between text-[13px] text-neutral-600 dark:text-neutral-300">
        <span>Approx. daily Na allowance</span><b>{naMeq.toFixed(0)} mEq</b>
      </div>
      <div className="flex justify-between text-[13px] text-neutral-600 dark:text-neutral-300">
        <span>Approx. daily K allowance</span><b>{kMeq.toFixed(0)} mEq</b>
      </div>
      <div className="mt-3"><CopyNote text={summary} /></div>
    </Card>
  )
}

function FluidResuscitation() {
  const [weightKg, setWeightKg] = useState(70)
  const [scenario, setScenario] = useState<'adult-sepsis' | 'peds-shock' | 'burns'>('adult-sepsis')
  const [tbsaPct, setTbsaPct] = useState(20)

  const result = useMemo(() => {
    if (scenario === 'adult-sepsis') {
      const ml = 30 * weightKg
      return { label: '30 mL/kg crystalloid bolus (Surviving Sepsis Campaign) over the first 3h, reassess perfusion', ml, extra: null as string | null }
    }
    if (scenario === 'peds-shock') {
      const ml = 20 * weightKg
      return { label: '20 mL/kg isotonic crystalloid bolus (PALS), reassess after each bolus, repeat as needed', ml, extra: null }
    }
    // Parkland formula for burns
    const total = 4 * weightKg * tbsaPct
    const first8h = total / 2
    return { label: `Parkland formula: 4 mL x ${weightKg}kg x ${tbsaPct}% TBSA — first half over 8h from time of burn, remainder over next 16h`, ml: total, extra: `First 8h: ${first8h.toFixed(0)} mL (${(first8h / 8).toFixed(0)} mL/hr) · Next 16h: ${first8h.toFixed(0)} mL (${(first8h / 16).toFixed(0)} mL/hr)` }
  }, [scenario, weightKg, tbsaPct])

  const summary = `Fluid resuscitation (${scenario}), BB ${weightKg}kg${scenario === 'burns' ? `, TBSA ${tbsaPct}%` : ''}: ${result.ml.toFixed(0)} mL total. ${result.label}${result.extra ? ' — ' + result.extra : ''}`

  return (
    <Card className="!p-5">
      <p className="text-[13px] text-neutral-500">Weight-based crystalloid resuscitation volumes for common shock/burn scenarios. Always reassess perfusion (MAP, lactate, urine output, capillary refill) between boluses — these are starting-point estimates, not fixed prescriptions.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => setScenario('adult-sepsis')} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${scenario === 'adult-sepsis' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>Adult Sepsis/Shock</button>
        <button onClick={() => setScenario('peds-shock')} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${scenario === 'peds-shock' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>Pediatric Shock (PALS)</button>
        <button onClick={() => setScenario('burns')} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${scenario === 'burns' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>Burns (Parkland)</button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label="Weight (kg)">
          <input className={inputClass} type="number" min={1} step={0.1} value={weightKg || ''} onChange={(e) => setWeightKg(Number(e.target.value) || 0)} />
        </Field>
        {scenario === 'burns' && (
          <Field label="TBSA burned (%)">
            <input className={inputClass} type="number" min={1} max={100} value={tbsaPct || ''} onChange={(e) => setTbsaPct(Number(e.target.value) || 0)} />
          </Field>
        )}
      </div>
      <div className="mt-3 rounded-xl bg-brand/10 p-3 text-center">
        <div className="text-[11px] font-bold text-neutral-500">{result.label}</div>
        <div className="mt-1 text-2xl font-black text-brand-dark">{result.ml.toFixed(0)} mL</div>
        {result.extra && <div className="mt-1 text-[12px] text-neutral-600 dark:text-neutral-300">{result.extra}</div>}
      </div>
      <div className="mt-3"><CopyNote text={summary} /></div>
    </Card>
  )
}

type ElecTab = 'corrected-na' | 'na-correction-rate' | 'k-deficit'
function Electrolytes() {
  const [eTab, setETab] = useState<ElecTab>('corrected-na')

  const [measuredNa, setMeasuredNa] = useState(130)
  const [glucose, setGlucose] = useState(400)
  const correctedNa = measuredNa + 1.6 * ((glucose - 100) / 100)

  const [currentNa, setCurrentNa] = useState(120)
  const [targetNa, setTargetNa] = useState(130)
  const [weightKgR, setWeightKgR] = useState(70)
  const [sexR, setSexR] = useState<'M' | 'F'>('M')
  const tbw = weightKgR * (sexR === 'M' ? 0.6 : 0.5)
  const naChangePerL = (140 - currentNa) / (tbw + 1) // simplified Adrogue-Madias with 1L infusate Na=140 (0.9% saline)
  const litersFor10 = naChangePerL !== 0 ? 10 / naChangePerL : 0

  const [currentK, setCurrentK] = useState(3.0)
  const [weightKgK, setWeightKgK] = useState(70)
  const kDeficitLow = (4.0 - currentK) * weightKgK * 0.3 // illustrative deficit range, ~0.2-0.4 mEq/kg per 0.1 drop below 4
  const kDeficitHigh = (4.0 - currentK) * weightKgK * 0.6

  return (
    <Card className="!p-5">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setETab('corrected-na')} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${eTab === 'corrected-na' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>Corrected Sodium</button>
        <button onClick={() => setETab('na-correction-rate')} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${eTab === 'na-correction-rate' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>Na Correction Rate</button>
        <button onClick={() => setETab('k-deficit')} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${eTab === 'k-deficit' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>K Deficit Estimate</button>
      </div>

      {eTab === 'corrected-na' && (
        <div className="mt-4">
          <p className="text-[13px] text-neutral-500">Adjusts measured sodium for hyperglycemia-driven osmotic dilution — Katz formula: +1.6 mEq/L Na for every 100 mg/dL glucose above 100.</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Measured Na (mEq/L)"><input className={inputClass} type="number" value={measuredNa || ''} onChange={(e) => setMeasuredNa(Number(e.target.value) || 0)} /></Field>
            <Field label="Glucose (mg/dL)"><input className={inputClass} type="number" value={glucose || ''} onChange={(e) => setGlucose(Number(e.target.value) || 0)} /></Field>
          </div>
          <div className="mt-3 rounded-xl bg-brand/10 p-3 text-center">
            <div className="text-[11px] font-bold text-neutral-500">Corrected sodium</div>
            <div className="text-2xl font-black text-brand-dark">{correctedNa.toFixed(1)} mEq/L</div>
          </div>
          <div className="mt-3"><CopyNote text={`Corrected Na = ${measuredNa} + 1.6 x ((${glucose}-100)/100) = ${correctedNa.toFixed(1)} mEq/L [Katz formula]`} /></div>
        </div>
      )}

      {eTab === 'na-correction-rate' && (
        <div className="mt-4">
          <p className="text-[13px] text-neutral-500">Simplified Adrogue-Madias estimate — how much serum Na rises per liter of 0.9% saline (Na 154 mEq/L) infused. Correct chronic hyponatremia no faster than 8-10 mEq/L per 24h to avoid osmotic demyelination.</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Current Na (mEq/L)"><input className={inputClass} type="number" value={currentNa || ''} onChange={(e) => setCurrentNa(Number(e.target.value) || 0)} /></Field>
            <Field label="Target Na (mEq/L)"><input className={inputClass} type="number" value={targetNa || ''} onChange={(e) => setTargetNa(Number(e.target.value) || 0)} /></Field>
            <Field label="Weight (kg)"><input className={inputClass} type="number" value={weightKgR || ''} onChange={(e) => setWeightKgR(Number(e.target.value) || 0)} /></Field>
            <Field label="Sex">
              <select className={inputClass} value={sexR} onChange={(e) => setSexR(e.target.value as 'M' | 'F')}>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </Field>
          </div>
          <div className="mt-3 rounded-xl bg-brand/10 p-3 text-center">
            <div className="text-[11px] font-bold text-neutral-500">Estimated rise per 1L of 0.9% saline</div>
            <div className="text-2xl font-black text-brand-dark">{naChangePerL.toFixed(2)} mEq/L</div>
            <div className="mt-1 text-[12px] text-neutral-600 dark:text-neutral-300">≈ {litersFor10.toFixed(2)} L to raise Na by 10 mEq/L — target ≤8-10 mEq/L per 24h</div>
          </div>
          <div className="mt-3"><CopyNote text={`Estimated Na rise ≈ ${naChangePerL.toFixed(2)} mEq/L per 1L 0.9% saline (TBW ${tbw.toFixed(1)}L). Cap correction at 8-10 mEq/L/24h.`} /></div>
        </div>
      )}

      {eTab === 'k-deficit' && (
        <div className="mt-4">
          <p className="text-[13px] text-neutral-500">Illustrative total-body potassium deficit range for hypokalemia below 4.0 mEq/L (deficits are notoriously nonlinear with serum K — this is a rough starting estimate for repletion planning, not a precise measurement).</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Current K (mEq/L)"><input className={inputClass} type="number" step={0.1} value={currentK || ''} onChange={(e) => setCurrentK(Number(e.target.value) || 0)} /></Field>
            <Field label="Weight (kg)"><input className={inputClass} type="number" value={weightKgK || ''} onChange={(e) => setWeightKgK(Number(e.target.value) || 0)} /></Field>
          </div>
          <div className="mt-3 rounded-xl bg-brand/10 p-3 text-center">
            <div className="text-[11px] font-bold text-neutral-500">Estimated total-body deficit</div>
            <div className="text-2xl font-black text-brand-dark">{Math.max(0, kDeficitLow).toFixed(0)}–{Math.max(0, kDeficitHigh).toFixed(0)} mEq</div>
          </div>
          <div className="mt-3"><CopyNote text={`Estimated K deficit ${Math.max(0, kDeficitLow).toFixed(0)}-${Math.max(0, kDeficitHigh).toFixed(0)} mEq (K ${currentK}, BB ${weightKgK}kg) — repletion estimate only, recheck levels serially during replacement.`} /></div>
        </div>
      )}
    </Card>
  )
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'maintenance', label: 'Maintenance Fluid' },
  { id: 'resuscitation', label: 'Fluid Resuscitation' },
  { id: 'electrolytes', label: 'Electrolytes' },
]

export function FluidCalculators() {
  const [tab, setTab] = useState<Tab>('maintenance')
  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Fluid & Electrolyte Calculators" subtitle="Maintenance, resuscitation & electrolyte correction in one place" />
        <div className="mt-3 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${tab === t.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>{t.label}</button>
          ))}
        </div>
      </Card>

      {tab === 'maintenance' && <MaintenanceFluid />}
      {tab === 'resuscitation' && <FluidResuscitation />}
      {tab === 'electrolytes' && <Electrolytes />}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Bedside estimates from standard published formulas (Holliday-Segar, Surviving Sepsis Campaign,
        PALS, Parkland, Katz, Adrogue-Madias) — always confirm against your institution's protocol and
        recheck labs serially during correction.
      </div>
    </div>
  )
}

export default FluidCalculators
