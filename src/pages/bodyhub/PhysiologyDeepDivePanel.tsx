import { useMemo, useState } from 'react'
import {
  PHYSIOLOGY_DEEP_DIVES,
  PHYSIOLOGY_DOMAINS,
  type PhysiologyDeepDive,
  type PhysiologyDomain,
} from '../../lib/physiologyDeepDives'

interface Props {
  onFocus: (topic: PhysiologyDeepDive) => void
}

type DomainFilter = PhysiologyDomain | 'all'

function FormulaBlock({ topic }: { topic: PhysiologyDeepDive }) {
  if (!topic.formulas.length) return null
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand">Quantitative relationships</div>
      <div className="mt-2 space-y-2">
        {topic.formulas.map((formula) => (
          <div key={`${topic.id}-${formula.label}`} className="rounded-lg bg-white p-2.5 dark:bg-white/[0.04]">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-[10px] font-bold text-neutral-500">{formula.label}</span>
              <code className="max-w-full overflow-x-auto whitespace-nowrap font-mono text-[11px] font-bold text-ink dark:text-white">
                {formula.expression}
              </code>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">{formula.variables}</p>
            {formula.note && <p className="mt-1 text-[9px] leading-relaxed text-neutral-400">{formula.note}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

function MechanismRail({ topic }: { topic: PhysiologyDeepDive }) {
  return (
    <ol className="relative space-y-0">
      {topic.sequence.map((step, index) => (
        <li key={`${topic.id}-${index}`} className="grid grid-cols-[28px_1fr] gap-2.5">
          <div className="flex flex-col items-center">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand/40 bg-brand/10 text-[10px] font-black text-brand">
              {index + 1}
            </span>
            {index < topic.sequence.length - 1 && <span aria-hidden="true" className="min-h-5 w-px flex-1 bg-brand/20" />}
          </div>
          <p className="pb-2.5 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">{step}</p>
        </li>
      ))}
    </ol>
  )
}

export function PhysiologyDeepDivePanel({ onFocus }: Props) {
  const [domain, setDomain] = useState<DomainFilter>('all')
  const [selectedId, setSelectedId] = useState(PHYSIOLOGY_DEEP_DIVES[0]?.id ?? '')

  const visible = useMemo(
    () => domain === 'all' ? PHYSIOLOGY_DEEP_DIVES : PHYSIOLOGY_DEEP_DIVES.filter((topic) => topic.domain === domain),
    [domain],
  )

  const selected = PHYSIOLOGY_DEEP_DIVES.find((topic) => topic.id === selectedId)
    ?? visible[0]
    ?? PHYSIOLOGY_DEEP_DIVES[0]

  if (!selected) return null

  function changeDomain(next: DomainFilter) {
    setDomain(next)
    const first = next === 'all' ? PHYSIOLOGY_DEEP_DIVES[0] : PHYSIOLOGY_DEEP_DIVES.find((topic) => topic.domain === next)
    if (first) setSelectedId(first.id)
  }

  return (
    <section aria-labelledby="physiology-deep-dive-title" className="space-y-3 rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border border-brand/30 bg-brand/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-brand">
              Educational physiology
            </span>
            <span className="rounded-full border border-neutral-200 px-2 py-0.5 text-[9px] font-bold text-neutral-500 dark:border-white/10">
              Source anatomy unchanged
            </span>
          </div>
          <h3 id="physiology-deep-dive-title" className="mt-2 text-base font-black text-ink dark:text-white">Mechanism deep dives</h3>
          <p className="mt-0.5 max-w-2xl text-[10.5px] leading-relaxed text-neutral-500">
            Follow physiology through time, equations and anatomical context. These are teaching models, not measurements from a patient.
          </p>
        </div>
      </div>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" aria-label="Physiology domains">
        {PHYSIOLOGY_DOMAINS.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={domain === item.key}
            onClick={() => changeDomain(item.key)}
            className={`min-h-11 shrink-0 rounded-full border px-3 text-[10px] font-bold transition ${
              domain === item.key
                ? 'border-brand bg-brand text-white'
                : 'border-neutral-200 text-neutral-500 hover:border-brand/40 dark:border-white/10'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="max-h-[390px] space-y-1 overflow-y-auto pr-1" aria-label="Physiology topics">
          {visible.map((topic) => (
            <button
              key={topic.id}
              type="button"
              aria-pressed={selected.id === topic.id}
              onClick={() => setSelectedId(topic.id)}
              className={`min-h-11 w-full rounded-xl border px-3 py-2 text-left transition ${
                selected.id === topic.id
                  ? 'border-brand bg-brand/5 dark:bg-brand/10'
                  : 'border-neutral-200 hover:border-brand/30 dark:border-white/10'
              }`}
            >
              <span className={`block text-[11px] font-black ${selected.id === topic.id ? 'text-brand' : 'text-ink dark:text-white'}`}>
                {topic.label}
              </span>
              <span className="mt-0.5 line-clamp-2 block text-[9.5px] leading-relaxed text-neutral-500">{topic.summary}</span>
            </button>
          ))}
        </div>

        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[9px] font-black uppercase tracking-[0.16em] text-brand">{selected.domain.replace('-', ' ')}</div>
              <h4 className="mt-0.5 text-lg font-black text-ink dark:text-white">{selected.label}</h4>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{selected.summary}</p>
            </div>
            <button
              type="button"
              onClick={() => onFocus(selected)}
              className="min-h-11 shrink-0 rounded-full border border-brand px-3 text-[10px] font-black text-brand transition hover:bg-brand hover:text-white"
            >
              Focus in 3D →
            </button>
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(240px,0.85fr)]">
            <div className="rounded-xl border border-neutral-200 p-3 dark:border-white/10">
              <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-500">Mechanism over time</div>
              <MechanismRail topic={selected} />
            </div>
            <div className="space-y-3">
              <div className="rounded-xl border border-neutral-200 p-3 dark:border-white/10">
                <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-500">Control & feedback</div>
                <p className="mt-1 text-[10.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">{selected.control}</p>
              </div>
              <FormulaBlock topic={selected} />
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
              <div className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">Interpretation boundary</div>
              <p className="mt-1 text-[10px] leading-relaxed text-amber-900 dark:text-amber-200">{selected.boundary}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 md:max-w-[280px] md:justify-end">
              {selected.references.map((reference) => reference.href ? (
                <a
                  key={reference.label}
                  href={reference.href}
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-11 rounded-full border border-neutral-200 px-3 py-3 text-[9.5px] font-bold text-neutral-500 underline-offset-2 hover:border-brand hover:text-brand hover:underline dark:border-white/10"
                >
                  {reference.label}
                </a>
              ) : (
                <span key={reference.label} className="rounded-full border border-neutral-200 px-2.5 py-1.5 text-[9px] text-neutral-500 dark:border-white/10">
                  {reference.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PhysiologyDeepDivePanel
