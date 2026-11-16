import { angka } from '../../../lib/perubahanLongitudinal'
import { formatAge, type SystemBoardRow } from '../engine/systemBoard'
import type { BodySystemId } from '../data/bodySystems'

const RECENCY_TEXT: Record<SystemBoardRow['recency'], string> = {
  recent: 'Recent', older: 'Older than 30 days', unknown: 'Date unreadable', none: 'Nothing recorded',
}

// The person's own latest measured value in each body system, beside the one body above it. A row never says
// whether a value is good or bad, and a system with nothing recorded says so rather than showing a placeholder.
export function SystemBoardView({ rows, metricLabel, selected, onSelect }: { rows: readonly SystemBoardRow[]; metricLabel: (metric: string) => string; selected: BodySystemId | null; onSelect: (id: BodySystemId) => void }) {
  const withData = rows.filter((r) => r.headline)
  const without = rows.filter((r) => !r.headline)

  const row = (r: SystemBoardRow) => (
    <li key={r.id}>
      <button
        type="button"
        onClick={() => onSelect(r.id)}
        aria-pressed={r.id === selected}
        data-system={r.id}
        data-recency={r.recency}
        className="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-left transition hover:border-emerald-500 aria-pressed:border-emerald-600 aria-pressed:ring-1 aria-pressed:ring-emerald-600 dark:border-white/10 dark:bg-white/[0.04]"
      >
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-black text-ink dark:text-white">{r.label}</span>
          <span className="block text-[11px] text-neutral-500">
            {r.headline ? `${RECENCY_TEXT[r.recency]} · ${formatAge(r.ageDays)} · ${r.signalCount} signal${r.signalCount === 1 ? '' : 's'}` : RECENCY_TEXT.none}
          </span>
        </span>
        {r.headline && (
          <span className="shrink-0 text-right tabular-nums">
            <span className="block text-[11px] text-neutral-500">{metricLabel(r.headline.metric)}</span>
            <span className="block text-[14px] font-black text-ink dark:text-white">
              {angka(r.headline.value)} <span className="text-[11px] font-semibold text-neutral-500">{r.headline.unit}</span>
              {r.headline.delta !== null && <span className="ml-1 text-[11px] font-semibold text-neutral-500">{r.headline.delta >= 0 ? '▲' : '▼'}{angka(Math.abs(r.headline.delta))}</span>}
            </span>
          </span>
        )}
      </button>
    </li>
  )

  return (
    <section aria-label="Your data by body system" data-your-systems-board className="space-y-2">
      <div className="flex items-baseline justify-between gap-2 px-1">
        <h2 className="text-[13px] font-black text-ink dark:text-white">Your systems</h2>
        <span className="text-[11px] text-neutral-500">{withData.length} of {rows.length} have data</span>
      </div>
      {withData.length > 0 ? (
        <ul className="grid gap-2 lg:grid-cols-2">{withData.map(row)}</ul>
      ) : (
        <p className="rounded-xl border border-dashed border-neutral-300 px-3 py-3 text-[12px] text-neutral-500 dark:border-white/15">
          Nothing you recorded is linked to a body system yet; record a reading below and it appears here.
        </p>
      )}
      {withData.length > 0 && without.length > 0 && (
        <details className="rounded-xl border border-neutral-200 px-3 py-2 dark:border-white/10">
          <summary className="min-h-[36px] cursor-pointer text-[12px] font-bold text-neutral-600 dark:text-neutral-300">Nothing recorded yet ({without.length})</summary>
          <ul className="mt-2 grid gap-2 lg:grid-cols-2">{without.map(row)}</ul>
        </details>
      )}
      <p className="px-1 text-[11px] leading-snug text-neutral-500">Tests are grouped by the system they are usually read with, not by where a problem is.</p>
    </section>
  )
}
