import { useEffect, useState } from 'react'
import { Card, SectionTitle, Field, inputClass } from '../components/ui'
import { IconLeaf } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Carbon-Footprint Diet Calculator — estimates the greenhouse-gas footprint of
// a weekly diet from food-category serving counts. Pure local arithmetic, no
// external API. Emission factors (kg CO2-equivalent per kg of food, farm-to-
// consumer, global average across production methods) are from Poore &
// Nemecek, "Reducing food's environmental impacts through producers and
// consumers", Science 2018 — popularized via Our World in Data. These are
// GLOBAL AVERAGES: actual footprint varies a lot by region, farming method,
// and transport, so treat this as a rough educational estimate, not a
// precise personal audit.
// ─────────────────────────────────────────────────────────────────────────────

interface FoodItem { key: string; label: string; icon: string; kgCo2ePerKg: number; servingG: number }
const FOODS: FoodItem[] = [
  { key: 'beef', label: 'Beef', icon: '🥩', kgCo2ePerKg: 99.5, servingG: 113 },
  { key: 'lamb', label: 'Lamb / mutton', icon: '🍖', kgCo2ePerKg: 39.7, servingG: 113 },
  { key: 'pork', label: 'Pork', icon: '🥓', kgCo2ePerKg: 12.3, servingG: 113 },
  { key: 'poultry', label: 'Chicken / poultry', icon: '🍗', kgCo2ePerKg: 9.9, servingG: 113 },
  { key: 'fish', label: 'Fish / seafood (farmed avg)', icon: '🐟', kgCo2ePerKg: 6.0, servingG: 113 },
  { key: 'eggs', label: 'Eggs', icon: '🥚', kgCo2ePerKg: 4.7, servingG: 50 },
  { key: 'cheese', label: 'Cheese', icon: '🧀', kgCo2ePerKg: 23.9, servingG: 30 },
  { key: 'milk', label: 'Milk / dairy drinks', icon: '🥛', kgCo2ePerKg: 3.2, servingG: 244 },
  { key: 'rice', label: 'Rice', icon: '🍚', kgCo2ePerKg: 4.5, servingG: 158 },
  { key: 'legumes', label: 'Legumes / tofu / tempeh', icon: '🌱', kgCo2ePerKg: 2.0, servingG: 100 },
  { key: 'vegetables', label: 'Vegetables', icon: '🥦', kgCo2ePerKg: 0.4, servingG: 80 },
  { key: 'fruit', label: 'Fruit', icon: '🍎', kgCo2ePerKg: 1.1, servingG: 80 },
]

type Servings = Record<string, number>
const KEY = 'pmd_carbon_diet_v1'
function load(): Servings {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

// Reference points (kg CO2e/year, food only) from the same Our World in Data
// synthesis, for rough context — not a claim about any individual's exact diet.
const REFERENCE = [
  { label: 'Meat-heavy diet (~average high-meat)', kgYear: 2600 },
  { label: 'Average omnivore diet', kgYear: 2000 },
  { label: 'Low-meat / flexitarian diet', kgYear: 1400 },
  { label: 'Pescatarian diet', kgYear: 1300 },
  { label: 'Vegetarian diet', kgYear: 1000 },
  { label: 'Vegan diet', kgYear: 700 },
]

export function CarbonDiet() {
  const [servings, setServings] = useState<Servings>(load)

  useEffect(() => {
    const t = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(servings)) } catch { /* ignore */ } }, 400)
    return () => clearTimeout(t)
  }, [servings])

  const rows = FOODS.map((f) => {
    const perWeek = servings[f.key] ?? 0
    const kgFoodPerWeek = (perWeek * f.servingG) / 1000
    const co2eWeek = kgFoodPerWeek * f.kgCo2ePerKg
    return { ...f, perWeek, co2eWeek }
  })
  const totalWeek = rows.reduce((s, r) => s + r.co2eWeek, 0)
  const totalYear = totalWeek * 52
  const maxRow = Math.max(1, ...rows.map((r) => r.co2eWeek))

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconLeaf size={20} />} title="Carbon-Footprint Diet Calculator" subtitle="Estimate your diet's greenhouse-gas footprint from weekly servings" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Enter how many servings of each food you eat in a typical <b>week</b>. This uses global-average
          emission factors (kg CO₂-equivalent per kg of food, farm-to-consumer) from Poore &amp; Nemecek,
          <i> Science</i> 2018 — actual footprint varies by region, farming method, and transport, so treat
          this as an educational estimate, not a precise personal audit.
        </p>
      </Card>

      <Card className="!p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {FOODS.map((f) => (
            <Field key={f.key} label={`${f.icon} ${f.label} (servings/week)`}>
              <input
                className={inputClass}
                type="number"
                min={0}
                inputMode="numeric"
                value={servings[f.key] ?? ''}
                onChange={(e) => setServings((s) => ({ ...s, [f.key]: Number(e.target.value) || 0 }))}
                placeholder="0"
              />
            </Field>
          ))}
        </div>
      </Card>

      {totalWeek > 0 && (
        <>
          <Card className="!p-5">
            <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Your estimated footprint</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-brand-dark">{totalYear.toFixed(0)}</span>
              <span className="text-sm font-semibold text-neutral-500">kg CO₂e / year (food only)</span>
            </div>
            <div className="mt-0.5 text-[12px] text-neutral-400">≈ {totalWeek.toFixed(1)} kg CO₂e this week</div>

            <div className="mt-4 space-y-1.5">
              {REFERENCE.map((r) => {
                const pct = Math.min(100, (totalYear / r.kgYear) * 100)
                const isClosest = Math.abs(totalYear - r.kgYear) === Math.min(...REFERENCE.map((x) => Math.abs(totalYear - x.kgYear)))
                return (
                  <div key={r.label} className={`flex items-center gap-2 text-[11px] ${isClosest ? 'font-bold text-brand-dark' : 'text-neutral-400'}`}>
                    <span className="w-40 shrink-0 truncate">{r.label}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
                      <span className="block h-full rounded-full bg-brand/60" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="w-16 shrink-0 text-right">{r.kgYear.toLocaleString()} kg</span>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="!p-5">
            <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Breakdown by food</div>
            <div className="mt-3 space-y-2">
              {rows.filter((r) => r.co2eWeek > 0).sort((a, b) => b.co2eWeek - a.co2eWeek).map((r) => (
                <div key={r.key} className="flex items-center gap-2 text-[12px]">
                  <span className="w-40 shrink-0 truncate">{r.icon} {r.label}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                    <span className="block h-full rounded-full bg-emerald-400" style={{ width: `${(r.co2eWeek / maxRow) * 100}%` }} />
                  </span>
                  <span className="w-16 shrink-0 text-right font-semibold text-neutral-600">{r.co2eWeek.toFixed(1)} kg</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-neutral-400">
              As a rule of thumb from this same research: swapping red meat for poultry, fish, or plant
              proteins a few times a week tends to have the single largest effect on this number for most diets.
            </p>
          </Card>
        </>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Emission factors: Poore &amp; Nemecek (2018), <i>Science</i> 361(6392) — synthesized via Our World in Data.
        Estimates only; not a certified carbon audit.
      </div>
    </div>
  )
}

export default CarbonDiet
