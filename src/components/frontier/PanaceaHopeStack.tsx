import { useMemo, useState } from 'react'
import { HopeEvidencePanel } from './HopeEvidencePanel'
import { HopeWorkbench } from './HopeWorkbench'
import {
  HOPE_DOMAINS,
  HOPE_GATE_LABEL,
  HOPE_STATUS_LABEL,
  type HopeDomainKey,
} from '../../lib/hopeStack'

const STATUS_STYLE = {
  'usable-now': 'bg-brand/10 text-brand',
  'integration-ready': 'bg-blue-500/10 text-blue-600 dark:text-blue-300',
  'research-only': 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  'policy-scenario': 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
} as const

export function PanaceaHopeStack() {
  const [selectedKey, setSelectedKey] = useState<HopeDomainKey>('mental-health')
  const selected = useMemo(
    () => HOPE_DOMAINS.find((domain) => domain.key === selectedKey) ?? HOPE_DOMAINS[0],
    [selectedKey],
  )

  return (
    <section className="space-y-4 rounded-[30px] border border-neutral-200 bg-white/75 p-4 dark:border-white/10 dark:bg-white/[.025] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">Panacea Hope Stack</div>
          <h2 className="mt-1 text-xl font-black tracking-tight text-ink dark:text-white sm:text-2xl">
            Preserve life, function, meaning and possibility
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-neutral-500 sm:text-sm">
            Nine connected domains from mental-health safety to geroscience, regeneration, early detection,
            preventive care, predictive AI, aging technology and population-scale longevity economics. Every domain
            declares what is usable now, what is research, and which human gate must remain in control.
          </p>
        </div>
        <div className="rounded-2xl border border-brand/20 bg-brand/[0.05] px-3 py-2 text-[10px] font-bold leading-relaxed text-brand">
          Hope ≠ hype<br />Evidence + function + agency
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {HOPE_DOMAINS.map((domain) => (
          <button
            key={domain.key}
            type="button"
            aria-pressed={selected.key === domain.key}
            onClick={() => setSelectedKey(domain.key)}
            className={`min-h-11 shrink-0 rounded-2xl border px-3 py-2 text-left transition ${
              selected.key === domain.key
                ? 'border-brand bg-brand text-white shadow-sm'
                : 'border-neutral-200 bg-white text-neutral-600 hover:border-brand/40 dark:border-white/10 dark:bg-white/[0.03] dark:text-neutral-300'
            }`}
          >
            <div className="text-sm font-black">{domain.emoji} {domain.label}</div>
            <div className={`mt-0.5 text-[9px] font-bold ${selected.key === domain.key ? 'text-white/75' : 'text-neutral-400'}`}>
              {HOPE_STATUS_LABEL[domain.status]}
            </div>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="space-y-3">
          <div className="rounded-3xl border border-neutral-200 p-4 dark:border-white/10">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-brand">Why this matters</div>
                <h3 className="mt-1 text-lg font-black text-ink dark:text-white">{selected.emoji} {selected.label}</h3>
              </div>
              <div className="flex flex-wrap gap-1">
                <span className={`rounded-full px-2.5 py-1 text-[9px] font-black ${STATUS_STYLE[selected.status]}`}>
                  {HOPE_STATUS_LABEL[selected.status]}
                </span>
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[9px] font-black text-neutral-500 dark:bg-white/10 dark:text-neutral-300">
                  {HOPE_GATE_LABEL[selected.gate]}
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-ink dark:text-white">{selected.mission}</p>
            <p className="mt-2 text-xs leading-relaxed text-neutral-500">{selected.whyItMatters}</p>
          </div>

          <div className="rounded-3xl border border-neutral-200 p-4 dark:border-white/10">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">Capability map</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selected.modules.map((module) => (
                <span key={module} className="rounded-full border border-neutral-200 px-2.5 py-1 text-[10px] font-bold text-neutral-600 dark:border-white/10 dark:text-neutral-300">
                  {module}
                </span>
              ))}
            </div>
            <div className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">Evidence stage</div>
            <p className="mt-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{selected.evidenceStage}</p>
          </div>

          <div className="rounded-3xl border border-neutral-200 p-4 dark:border-white/10">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">Panacea connections</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selected.integrations.map((integration) => (
                <span key={integration} className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
                  {integration}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-neutral-200 p-4 dark:border-white/10">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">Inputs</div>
              <ul className="mt-2 space-y-1.5">
                {selected.inputs.map((input) => <li key={input} className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">• {input}</li>)}
              </ul>
            </div>
            <div className="rounded-3xl border border-neutral-200 p-4 dark:border-white/10">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">Outputs</div>
              <ul className="mt-2 space-y-1.5">
                {selected.outputs.map((output) => <li key={output} className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">• {output}</li>)}
              </ul>
            </div>
          </div>

          {selected.formulas.length > 0 && (
            <div className="rounded-3xl border border-neutral-200 p-4 dark:border-white/10">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-brand">Transparent formulas</div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {selected.formulas.map((formula) => (
                  <div key={formula.label} className="rounded-2xl bg-neutral-950 p-3 text-white">
                    <div className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">{formula.label}</div>
                    <div className="mt-1 overflow-x-auto font-mono text-[11px] font-black text-brand">{formula.expression}</div>
                    <p className="mt-2 text-[10px] leading-relaxed text-neutral-400">{formula.meaning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-red-200 bg-red-50/70 p-4 dark:border-red-500/20 dark:bg-red-500/[0.07]">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-red-600 dark:text-red-300">Truth & safety boundary</div>
            <p className="mt-1.5 text-xs leading-relaxed text-red-900 dark:text-red-100">{selected.safetyBoundary}</p>
          </div>

          <div className="rounded-3xl border border-neutral-200 p-4 dark:border-white/10">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">Next milestones</div>
                <ol className="mt-2 space-y-1.5">
                  {selected.milestones.map((milestone, index) => (
                    <li key={milestone} className="flex gap-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
                      <span className="font-black text-brand">{index + 1}</span><span>{milestone}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">References</div>
                <div className="mt-2 space-y-1.5">
                  {selected.references.map((reference) => (
                    <a
                      key={reference.url}
                      href={reference.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="block rounded-xl border border-neutral-200 px-3 py-2 text-[11px] font-bold text-brand hover:border-brand/50 dark:border-white/10"
                    >
                      {reference.label} ↗
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <HopeWorkbench domain={selected.key} />
      <HopeEvidencePanel domain={selected.key} />
    </section>
  )
}

export default PanaceaHopeStack
