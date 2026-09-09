import { useMemo } from 'react'
import type { FoodEntry } from '../lib/types'
import {
  buildNutritionRecordedReport,
  formatNutritionRecordedReport,
} from '../lib/nutritionRecordedReport'

export function NutritionRecordedReportCard({ entries }: { entries: readonly FoodEntry[] }) {
  const report = useMemo(() => buildNutritionRecordedReport(entries), [entries])

  return (
    <section
      className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]"
      aria-label="Recorded nutrition journal report"
    >
      <div className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400">Structured report</div>
      <h3 className="mt-2 text-lg font-black text-ink dark:text-white">Latest recorded nutrition summary</h3>
      <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
        A bounded report over at most the latest seven dates that actually contain valid journal entries. Missing calendar dates stay missing rather than being filled with zeroes.
      </p>

      {!report ? (
        <div className="mt-4 rounded-2xl border border-dashed border-neutral-300 p-4 text-[11px] text-neutral-500 dark:border-white/15 dark:text-neutral-400" role="status">
          No valid recorded Nutrition journal entries are available yet, so no report is generated.
        </div>
      ) : (
        <>
          <dl className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
              <dt className="text-[9px] font-black uppercase tracking-[0.12em] text-neutral-400">Recorded period</dt>
              <dd className="mt-1 text-[11px] font-bold text-ink dark:text-white">{report.periodStart} → {report.periodEnd}</dd>
            </div>
            <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
              <dt className="text-[9px] font-black uppercase tracking-[0.12em] text-neutral-400">Recorded days</dt>
              <dd className="mt-1 text-[11px] font-bold text-ink dark:text-white">{report.recordedDays}</dd>
            </div>
            <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
              <dt className="text-[9px] font-black uppercase tracking-[0.12em] text-neutral-400">Entries</dt>
              <dd className="mt-1 text-[11px] font-bold text-ink dark:text-white">{report.entryCount}</dd>
            </div>
            <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
              <dt className="text-[9px] font-black uppercase tracking-[0.12em] text-neutral-400">Recorded total</dt>
              <dd className="mt-1 text-[11px] font-bold text-ink dark:text-white">{report.totals.kcal} kcal</dd>
            </div>
          </dl>

          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
              <div className="text-[10px] font-black text-ink dark:text-white">Totals across retained recorded days</div>
              <p className="mt-1 text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                {report.totals.kcal} kcal · carbs {report.totals.carbs} g · protein {report.totals.protein} g · fat {report.totals.fat} g
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
              <div className="text-[10px] font-black text-ink dark:text-white">Mean per recorded day</div>
              <p className="mt-1 text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                {report.meanPerRecordedDay.kcal} kcal · carbs {report.meanPerRecordedDay.carbs} g · protein {report.meanPerRecordedDay.protein} g · fat {report.meanPerRecordedDay.fat} g
              </p>
            </div>
          </div>

          <details className="mt-3 rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
            <summary className="cursor-pointer text-[10px] font-black text-ink dark:text-white">Portable plain-text report</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">{formatNutritionRecordedReport(report)}</pre>
          </details>

          <div className="mt-3 rounded-2xl border border-amber-300/40 bg-amber-50/60 p-3 text-[10px] leading-relaxed text-amber-800 dark:border-amber-300/20 dark:bg-amber-400/[0.05] dark:text-amber-100">
            <b>Source:</b> {report.sourceNote}<br />
            <b>Interpretation boundary:</b> {report.boundary}
          </div>
        </>
      )}
    </section>
  )
}

export default NutritionRecordedReportCard
