import { useMemo } from 'react'
import type { FoodEntry } from '../lib/types'
import {
  MAX_NUTRITION_BASELINE_DAYS,
  MIN_NUTRITION_BASELINE_DAYS,
  buildNutritionPersonalBaseline,
  type NutritionBaselineMetric,
} from '../lib/nutritionPersonalBaseline'

const METRICS: ReadonlyArray<{ metric: NutritionBaselineMetric; label: string }> = [
  { metric: 'kcal', label: 'Recorded energy' },
  { metric: 'carbs', label: 'Recorded carbohydrate' },
  { metric: 'protein', label: 'Recorded protein' },
  { metric: 'fat', label: 'Recorded fat' },
]

function rounded(value: number) {
  return Math.round(value * 10) / 10
}

export function NutritionPersonalBaselineCard({ entries }: { entries: readonly FoodEntry[] }) {
  const baselines = useMemo(
    () => METRICS.map(({ metric, label }) => ({
      label,
      baseline: buildNutritionPersonalBaseline(entries, metric),
    })),
    [entries],
  )
  const available = baselines.filter((item) => item.baseline)
  const first = available[0]?.baseline

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]" aria-labelledby="nutrition-personal-baseline-title">
      <div className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400">Personal descriptive baseline</div>
      <h3 id="nutrition-personal-baseline-title" className="mt-2 text-lg font-black text-ink dark:text-white">Your own recorded history, not a normal range</h3>
      <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
        Panacea summarizes up to the latest {MAX_NUTRITION_BASELINE_DAYS} validated recorded dates. At least {MIN_NUTRITION_BASELINE_DAYS} recorded dates are required; missing calendar dates are never inserted as zero.
      </p>

      {!first ? (
        <div className="mt-4 rounded-2xl border border-dashed border-neutral-300 p-4 text-center text-[11px] text-neutral-500 dark:border-white/10 dark:text-neutral-400">
          Record at least {MIN_NUTRITION_BASELINE_DAYS} valid dates before a personal descriptive baseline is shown.
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-label={`Personal descriptive nutrition baseline across ${first.observedDays} recorded days`}>
            {available.map(({ label, baseline }) => baseline ? (
              <div key={baseline.metric} className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
                <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">{label}</div>
                <div className="mt-1 text-lg font-black text-ink dark:text-white">{rounded(baseline.median)} {baseline.unit}</div>
                <div className="mt-1 text-[10px] text-neutral-500">Recorded Q1–Q3: {rounded(baseline.q1)}–{rounded(baseline.q3)} {baseline.unit}</div>
              </div>
            ) : null)}
          </div>
          <div className="mt-3 text-[10px] text-neutral-400">
            {first.observedDays} recorded day{first.observedDays === 1 ? '' : 's'} · {first.firstDate} → {first.latestDate} · NIST p(N+1) percentile convention.
          </div>
        </>
      )}

      <div className="mt-4 rounded-2xl border border-amber-300/40 bg-amber-50/60 p-3 text-[10px] leading-relaxed text-amber-800 dark:border-amber-300/20 dark:bg-amber-400/[0.05] dark:text-amber-100">
        This is a distribution of your own recorded journal totals only. It is not a calorie or macro target, population normal range, adequacy threshold, diagnosis, treatment rule or dietary recommendation.
      </div>
    </section>
  )
}

export default NutritionPersonalBaselineCard
