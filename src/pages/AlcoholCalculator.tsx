import { useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass } from '../components/ui'
import { IconDrop } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Alcohol Unit & BAC Estimator — pure arithmetic, no external API. Uses the
// classic Widmark formula (still the standard teaching model in forensic
// toxicology): BAC(‰) = A / (r × m) − β × t, where A = grams of pure alcohol
// consumed, m = body weight (kg), r = the Widmark distribution constant
// (commonly cited averages: ~0.68 for men, ~0.55 for women — reflecting
// average body water content, which genuinely varies person to person), and
// β = the average elimination rate (~0.15 ‰/hour). This is a population-
// average ESTIMATE, not a breathalyzer reading — food intake, individual
// metabolism, medications, and genetics all shift the real number. The only
// truly safe BAC for driving is zero, regardless of what this shows.
// ─────────────────────────────────────────────────────────────────────────────

const ETHANOL_DENSITY = 0.789 // g/mL

interface Drink { label: string; icon: string; volumeMl: number; abv: number }
const DRINKS: Drink[] = [
  { label: 'Beer (330 ml, 5%)', icon: '🍺', volumeMl: 330, abv: 5 },
  { label: 'Beer, strong (330 ml, 8%)', icon: '🍺', volumeMl: 330, abv: 8 },
  { label: 'Wine (150 ml, 12%)', icon: '🍷', volumeMl: 150, abv: 12 },
  { label: 'Spirits, single (30 ml, 40%)', icon: '🥃', volumeMl: 30, abv: 40 },
  { label: 'Cocktail (250 ml, 15%)', icon: '🍹', volumeMl: 250, abv: 15 },
]

function gramsOf(d: Drink): number {
  return (d.volumeMl * (d.abv / 100)) * ETHANOL_DENSITY
}

export function AlcoholCalculator() {
  const [sex, setSex] = useState<'M' | 'F'>('M')
  const [weightKg, setWeightKg] = useState(70)
  const [picked, setPicked] = useState<Record<string, number>>({})
  const [hoursElapsed, setHoursElapsed] = useState(1)

  const totalGrams = useMemo(
    () => DRINKS.reduce((s, d) => s + (picked[d.label] ?? 0) * gramsOf(d), 0),
    [picked],
  )
  const totalUnitsUK = totalGrams / 8 // UK unit = 8g pure alcohol
  const totalStandardUS = totalGrams / 14 // US standard drink = 14g pure alcohol

  const r = sex === 'M' ? 0.68 : 0.55
  const beta = 0.15 // ‰ per hour, average elimination rate
  const bacPermille = Math.max(0, totalGrams / (r * weightKg) - beta * hoursElapsed)
  const bacPercent = bacPermille / 10

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconDrop size={20} />} title="Alcohol Unit & BAC Estimator" subtitle="Standard drinks and an educational blood-alcohol estimate" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          This uses the classic Widmark formula, the standard teaching model in forensic toxicology — but
          it is an <b>estimate from population averages</b>, not a breathalyzer reading. Food intake,
          individual metabolism, medications, and genetics all shift the real number, often significantly.
          <b> The only safe BAC for driving is zero</b> — never use this tool to decide whether it's okay to drive.
        </p>
      </Card>

      <Card className="!p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Biological sex (for the r constant)">
            <select className={inputClass} value={sex} onChange={(e) => setSex(e.target.value as 'M' | 'F')}>
              <option value="M">Male (r ≈ 0.68)</option>
              <option value="F">Female (r ≈ 0.55)</option>
            </select>
          </Field>
          <Field label="Body weight (kg)">
            <input className={inputClass} type="number" min={30} max={200} value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value) || 0)} />
          </Field>
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">What did you drink?</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {DRINKS.map((d) => (
            <Field key={d.label} label={`${d.icon} ${d.label}`}>
              <input
                className={inputClass}
                type="number" min={0} inputMode="numeric"
                value={picked[d.label] ?? ''}
                onChange={(e) => setPicked((s) => ({ ...s, [d.label]: Number(e.target.value) || 0 }))}
                placeholder="0"
              />
            </Field>
          ))}
        </div>
        <Field label="Hours since you started drinking">
          <input className="mt-1 w-full accent-brand" type="range" min={0} max={12} step={0.5} value={hoursElapsed} onChange={(e) => setHoursElapsed(Number(e.target.value))} />
          <div className="mt-1 text-right text-[12px] font-semibold text-neutral-500">{hoursElapsed}h</div>
        </Field>
      </Card>

      {totalGrams > 0 && (
        <Card className="!p-5">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Estimate</div>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-black text-brand-dark">{totalUnitsUK.toFixed(1)}</div>
              <div className="text-[11px] text-neutral-500">UK units (8g each)</div>
            </div>
            <div>
              <div className="text-2xl font-black text-brand-dark">{totalStandardUS.toFixed(1)}</div>
              <div className="text-[11px] text-neutral-500">US standard drinks (14g each)</div>
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-amber-50 p-3 dark:bg-amber-500/10">
            <div className="text-2xl font-black text-amber-700 dark:text-amber-300">{bacPermille.toFixed(2)}‰ <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">({bacPercent.toFixed(3)}% BAC)</span></div>
            <p className="mt-1 text-[11px] leading-relaxed text-amber-700/80 dark:text-amber-300/80">
              Estimated blood alcohol concentration right now, {hoursElapsed}h after you started drinking. Legal
              driving limits vary by country and this estimate can be meaningfully off in either direction —
              treat any non-zero result as "do not drive."
            </p>
          </div>
        </Card>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Educational estimate only, not a medical or legal determination. If alcohol use is a concern for
        you or someone you know, please talk to a clinician — support is available and effective.
      </div>
    </div>
  )
}

export default AlcoholCalculator
