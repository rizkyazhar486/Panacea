import registry from '../../../governance/CALCULATOR_REVIEW_REGISTRY.json' with { type: 'json' }
import { describeSource } from '../../domains/clinical-calculators'

const SOURCES = new Map(
  (registry.entries as Array<{ id: string; source?: Parameters<typeof describeSource>[1]; formula?: string; units?: string }>).map((e) => [
    e.id,
    { source: e.source, formula: e.formula, units: e.units },
  ])
)

/** Where each calculator's number comes from, behind one disclosure. Reads the governed registry; adds no claim of its own. */
export function SumberKalkulator({ ids, className = 'mt-2 text-[11px] leading-snug text-neutral-500' }: { ids: readonly string[]; className?: string }) {
  const lines = ids.map((id) => {
    const entry = SOURCES.get(id)
    return describeSource(id, entry?.source, { formula: entry?.formula, units: entry?.units })
  })
  return (
    <details className={className} data-calculator-source={ids.join(' ')}>
      <summary className="cursor-pointer select-none py-2">{lines.length > 1 ? 'Sources for these calculators' : 'Source of this calculator'}</summary>
      <ul className="mt-1 space-y-1.5">
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
