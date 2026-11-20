import registry from '../../../governance/CALCULATOR_REVIEW_REGISTRY.json' with { type: 'json' }
import { describeSource } from '../../domains/clinical-calculators'

const SOURCES = new Map(
  (registry.entries as Array<{ id: string; source?: Parameters<typeof describeSource>[1]; formula?: string; units?: string }>).map((e) => [
    e.id,
    { source: e.source, formula: e.formula, units: e.units },
  ])
)

/** Where each calculator's number comes from, behind a compact SVG citation logo disclosure. */
export function SumberKalkulator({ ids, className = 'mt-1.5 inline-block text-[11px] leading-snug text-neutral-500' }: { ids: readonly string[]; className?: string }) {
  const lines = ids.map((id) => {
    const entry = SOURCES.get(id)
    return describeSource(id, entry?.source, { formula: entry?.formula, units: entry?.units })
  })
  const summaryLabel = lines.length > 1 ? 'Sources for these calculators' : 'Source of this calculator'
  return (
    <details className={className} data-calculator-source={ids.join(' ')}>
      <summary
        aria-label={summaryLabel}
        title={summaryLabel}
        className="inline-flex min-h-[44px] min-w-[44px] lg:min-h-[30px] lg:min-w-[30px] cursor-pointer select-none list-none items-center justify-center rounded-full border border-neutral-300 bg-neutral-100 p-1.5 text-neutral-800 dark:border-white/15 dark:bg-white/[0.08] dark:text-slate-100"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 6.5C10.5 5 8 4.5 4 4.8v13c4-.3 6.5.2 8 1.7 1.5-1.5 4-2 8-1.7v-13c-4-.3-6.5.2-8 1.7Z" />
          <path d="M12 6.5v13" />
        </svg>
        <span className="sr-only">{summaryLabel}</span>
      </summary>
      <ul className="mt-1.5 max-w-md space-y-1.5 rounded-xl border border-neutral-200 bg-white/95 p-3 shadow-lg dark:border-white/15 dark:bg-[#090d14]/95">
        {lines.map((l) => (
          <li key={l.id} data-source-kind={l.kind}>
            <span className="font-medium">{l.label}.</span> {l.text}
            {l.pubmedUrl && <> <a className="underline" href={l.pubmedUrl} target="_blank" rel="noopener noreferrer">PubMed</a></>}
            {l.doiUrl && <> <a className="underline" href={l.doiUrl} target="_blank" rel="noopener noreferrer">DOI</a></>}
            {l.publisherUrl && <> <a className="underline" href={l.publisherUrl} target="_blank" rel="noopener noreferrer">Publisher</a></>}
            {l.formula && (
              <div className="mt-0.5 text-neutral-600 dark:text-neutral-400">
                <span className="font-medium">Formula:</span> <code className="font-mono text-[10px]">{l.formula}</code>
              </div>
            )}
            {l.units && (
              <div className="mt-0.5 text-neutral-600 dark:text-neutral-400">
                <span className="font-medium">Units:</span> <span>{l.units}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </details>
  )
}
