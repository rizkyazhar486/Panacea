import { useMemo, useState } from 'react'
import type { FoodEntry } from '../lib/types'
import {
  MAX_NUTRITION_CALCULATOR_DAYS,
  calculateNutritionJournalWindow,
} from '../lib/nutritionJournalCalculator'

const WINDOW_OPTIONS = [3, 7, 14, 30] as const

function display(value: number) {
  return Math.round(value * 10) / 10
}

export function NutritionJournalCalculatorCard({ entries }: { entries: readonly FoodEntry[] }) {
  const [requestedDays, setRequestedDays] = useState<number>(7)
  const result = useMemo(
    () => calculateNutritionJournalWindow(entries, requestedDays),
    [entries, requestedDays],
  )

  const metrics = result ? [
    { label: 'Energy', value: result.kcal },
    { label: 'Carbohydrate', value: result.carbs },
    { label: 'Protein', value: result.protein },
    { label: 'Fat', value: result.fat },
  ] : []

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]" aria-labelledby="nutrition-journal-calculator-title">
      <div className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400">Recorded journal calculator</div>
      <h3 id="nutrition-journal-calculator-title" className="mt-2 text-lg font-black text-ink dark:text-white">Transparent totals + mean per recorded day</h3>
      <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
        Choose how many of your latest recorded dates to include. The calculator uses at most {MAX_NUTRITION_CALCULATOR_DAYS} validated recorded dates and never fills missing calendar dates with zero.
      </p>

      <div className="mt-4 max-w-xs">
        <label htmlFor="nutrition-calculator-window" className="text-[10px] font-bold text-neutral-500">Recorded dates to include</label>
        <select
          id="nutrition-calculator-window"
          value={requestedDays}
          onChange={(event) => setRequestedDays(Number(event.target.value))}
          className="mt-1 min-h-11 w-full rounded-xl border border-neutral-200 bg-transparent px-3 text-sm outline-none focus:border-brand dark:border-white/10"
        >
          {WINDOW_OPTIONS.map((days) => <option key={days} value={days}>Latest {days} recorded dates</option>)}
        </select>
      </div>

      {!result ? (
        <div className="mt-4 rounded-2xl border border-dashed border-neutral-300 p-4 text-center text-[11px] text-neutral-500 dark:border-white/10 dark:text-neutral-400">
          No valid recorded nutrition date is available. Nothing is calculated from sample or assumed data.
        </div>
      ) : (
        <>
          <div className="mt-4 text-[10px] text-neutral-400">
            Using {result.observedDays} actual recorded day{result.observedDays === 1 ? '' : 's'} · {result.firstDate} → {result.latestDate}
            {result.observedDays < result.requestedRecordedDays ? ` · only ${result.observedDays} recorded date${result.observedDays === 1 ? '' : 's'} available` : ''}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-label={`Recorded nutrition arithmetic across ${result.observedDays} dates`}>
            {metrics.map(({ label, value }) => (
              <div key={label} className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
                <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">{label}</div>
                <div className="mt-1 text-base font-black text-ink dark:text-white">Σ {display(value.total)} {value.unit}</div>
                <div className="mt-1 text-[10px] text-neutral-500">Mean {display(value.meanPerRecordedDay)} {value.unit}/recorded day</div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl bg-neutral-50 px-3 py-2 text-[10px] text-neutral-500 dark:bg-white/[0.03] dark:text-neutral-300">
            Formula: total = sum of validated recorded-day totals; mean = total ÷ observed recorded days. Missing calendar dates are excluded, not treated as zero.
          </div>
        </>
      )}

      <div className="mt-4 rounded-2xl border border-amber-300/40 bg-amber-50/60 p-3 text-[10px] leading-relaxed text-amber-800 dark:border-amber-300/20 dark:bg-amber-400/[0.05] dark:text-amber-100">
        Arithmetic over your recorded journal only. These totals and means are not calorie or macro requirements, intake targets, adequacy judgments, diagnoses, treatment rules, or dietary recommendations.
      </div>
    </section>
  )
}

export default NutritionJournalCalculatorCard
