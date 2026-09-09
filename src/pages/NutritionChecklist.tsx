import { useMemo, useState } from 'react'

interface CheckItem {
  id: string
  label: string
  detail: string
}

const ITEMS: CheckItem[] = [
  {
    id: 'recorded-intake',
    label: 'Recorded intake only',
    detail: 'Use foods, drinks and supplements that were actually recorded. Leave missing intake missing instead of estimating it.',
  },
  {
    id: 'amount-units',
    label: 'Amount and units checked',
    detail: 'Review serving amount, unit and portion basis before relying on totals or comparisons.',
  },
  {
    id: 'source-time',
    label: 'Source and time preserved',
    detail: 'Keep the source and timestamp visible for imported or measured nutrition data; do not merge sources silently.',
  },
  {
    id: 'context-explicit',
    label: 'Context kept explicit',
    detail: 'Record supplements, hydration, caffeine, alcohol and condition-specific context explicitly when relevant rather than inferring them from food entries.',
  },
  {
    id: 'evidence-opened',
    label: 'Original evidence checked',
    detail: 'Open the original evidence or source before reusing a nutrition, supplement or interaction claim.',
  },
  {
    id: 'clinical-boundary',
    label: 'Clinical boundary understood',
    detail: 'Completing this checklist does not validate diet adequacy, diagnose a deficiency or authorize patient-specific treatment.',
  },
]

export function NutritionChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const reviewed = useMemo(() => ITEMS.filter((item) => checked[item.id]).length, [checked])

  return (
    <section className="mx-auto w-full max-w-3xl px-3 py-4 sm:px-4" aria-labelledby="nutrition-checklist-title">
      <div className="rounded-3xl border border-emerald-100 bg-white/90 p-4 shadow-sm dark:border-emerald-400/15 dark:bg-white/[0.04] sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Safety checklist · not a diet-quality score</p>
            <h2 id="nutrition-checklist-title" className="mt-1 text-lg font-black text-ink dark:text-white">Review nutrition data before interpreting it</h2>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
              This is a process check for recorded data and provenance. It does not calculate needs, fill missing observations or provide clinical clearance.
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-right dark:bg-emerald-400/10" aria-live="polite">
            <div className="text-lg font-black tabular-nums text-emerald-800 dark:text-emerald-200">{reviewed}/{ITEMS.length}</div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">reviewed</div>
          </div>
        </div>

        <ul className="mt-4 space-y-2" aria-label="Nutrition data safety checklist">
          {ITEMS.map((item) => (
            <li key={item.id} data-check-id={item.id} className="rounded-2xl border border-neutral-100 p-3 dark:border-white/10">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={Boolean(checked[item.id])}
                  onChange={(event) => setChecked((current) => ({ ...current, [item.id]: event.target.checked }))}
                  className="mt-1 h-4 w-4 shrink-0 accent-emerald-600"
                />
                <span>
                  <span className="block text-sm font-black text-ink dark:text-white">{item.label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">{item.detail}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-3 dark:border-white/10">
          <p className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            Review state is local to this view and is not stored as a health record. Unchecked means not reviewed, not abnormal.
          </p>
          <button
            type="button"
            onClick={() => setChecked({})}
            disabled={reviewed === 0}
            className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-bold text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:text-neutral-200 dark:hover:bg-white/5"
          >
            Reset review
          </button>
        </div>
      </div>
    </section>
  )
}

export default NutritionChecklist
