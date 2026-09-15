import { useMemo, useState } from 'react'
import {
  LONGEVITY_PROGRAMS,
  LONGEVITY_RESEARCH_BOUNDARY,
  LONGEVITY_TRANSLATION_BOTTLENECKS,
  getLongevityProgram,
  simulateLongevityStrategy,
  type LongevityProgramId,
} from '../../lib/longevityProblemSolver'

type ViewMode = 'systems' | 'simulator' | 'translation' | 'evidence'

const clamp = (value: number) => Math.max(0, Math.min(100, value))

const DEFAULT_INTENSITIES = Object.fromEntries(
  LONGEVITY_PROGRAMS.flatMap((program) => program.levers.map((lever) => [lever.id, 30])),
) as Record<string, number>

const VIEW_LABEL: Record<ViewMode, string> = {
  systems: 'Systems map',
  simulator: 'Problem solver',
  translation: 'Translation',
  evidence: 'Evidence debt',
}

const PROGRAM_ACCENT: Record<LongevityProgramId, string> = {
  'epigenetic-reprogramming': 'from-fuchsia-500/15 to-violet-500/5',
  'senescence-immunity': 'from-rose-500/15 to-orange-500/5',
  'ecm-crosslinking': 'from-amber-500/15 to-yellow-500/5',
  'mitochondrial-genome': 'from-cyan-500/15 to-blue-500/5',
  'proteostasis-autophagy': 'from-indigo-500/15 to-sky-500/5',
  'stem-cell-regeneration': 'from-emerald-500/15 to-teal-500/5',
  'nutrient-sensing-metabolism': 'from-lime-500/15 to-emerald-500/5',
  'inflammaging-network': 'from-red-500/15 to-purple-500/5',
}

function Metric({ label, value, inverse = false }: { label: string; value: number; inverse?: boolean }) {
  const display = clamp(value)
  const bar = inverse ? 100 - display : display
  return (
    <div className="rounded-xl border border-neutral-200 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[.035]">
      <div className="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-wide text-neutral-500">
        <span>{label}</span>
        <span className="text-neutral-900 dark:text-white">{display}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
        <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${bar}%` }} />
      </div>
    </div>
  )
}

function SystemsMap({ selected, onSelect }: { selected: LongevityProgramId; onSelect: (id: LongevityProgramId) => void }) {
  const chain = [
    ['Genome / epigenome', 'Regulatory state'],
    ['Cell state', 'Senescence · proteostasis'],
    ['Organelle', 'Mitochondrial reserve'],
    ['Tissue matrix', 'ECM mechanics'],
    ['Immune network', 'Clearance · surveillance'],
    ['Organ reserve', 'Function over time'],
  ]
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-[760px] items-stretch gap-2">
          {chain.map(([title, subtitle], index) => (
            <div key={title} className="flex min-w-[112px] flex-1 items-center gap-2">
              <div className="flex-1 rounded-xl border border-neutral-200 bg-white/80 p-3 text-center dark:border-white/10 dark:bg-white/[.035]">
                <div className="text-[10px] font-black text-neutral-900 dark:text-white">{title}</div>
                <div className="mt-1 text-[9px] text-neutral-500">{subtitle}</div>
              </div>
              {index < chain.length - 1 && <div className="text-lg font-black text-brand">→</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {LONGEVITY_PROGRAMS.map((program) => {
          const active = program.id === selected
          return (
            <button
              key={program.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(program.id)}
              className={`min-h-40 rounded-2xl border bg-gradient-to-br p-3 text-left transition ${PROGRAM_ACCENT[program.id]} ${active ? 'border-brand ring-2 ring-brand/20' : 'border-neutral-200 hover:border-brand/50 dark:border-white/10'}`}
            >
              <div className="text-[9px] font-black uppercase tracking-[0.14em] text-brand">{program.biologicalLayer}</div>
              <div className="mt-2 text-sm font-black text-neutral-950 dark:text-white">{program.shortTitle}</div>
              <p className="mt-2 text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300">{program.coreProblem}</p>
              <div className="mt-3 text-[9px] font-bold text-neutral-500">{program.levers.length} research levers</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ProgramDetail({ id }: { id: LongevityProgramId }) {
  const program = getLongevityProgram(id)
  return (
    <div className={`rounded-2xl border border-neutral-200 bg-gradient-to-br p-4 dark:border-white/10 ${PROGRAM_ACCENT[id]}`}>
      <div className="text-[9px] font-black uppercase tracking-[0.16em] text-brand">Selected unsolved program</div>
      <h5 className="mt-1 text-base font-black text-neutral-950 dark:text-white">{program.title}</h5>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <div className="rounded-xl bg-white/75 p-3 dark:bg-black/20">
          <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">Failure mode</div>
          <p className="mt-1 text-[10px] leading-relaxed text-neutral-700 dark:text-neutral-300">{program.failureMode}</p>
        </div>
        <div className="rounded-xl bg-white/75 p-3 dark:bg-black/20">
          <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">Success condition</div>
          <p className="mt-1 text-[10px] leading-relaxed text-neutral-700 dark:text-neutral-300">{program.successCondition}</p>
        </div>
        <div className="rounded-xl bg-white/75 p-3 dark:bg-black/20">
          <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">Scale</div>
          <p className="mt-1 text-[10px] leading-relaxed text-neutral-700 dark:text-neutral-300">{program.biologicalLayer}</p>
        </div>
      </div>
    </div>
  )
}

function Simulator({ selected }: { selected: LongevityProgramId }) {
  const [intensities, setIntensities] = useState<Record<string, number>>(DEFAULT_INTENSITIES)
  const [deliverySpecificity, setDeliverySpecificity] = useState(55)
  const [reversibility, setReversibility] = useState(65)
  const [validationStrength, setValidationStrength] = useState(35)
  const program = getLongevityProgram(selected)
  const output = useMemo(
    () => simulateLongevityStrategy({ intensities, deliverySpecificity, reversibility, validationStrength }),
    [intensities, deliverySpecificity, reversibility, validationStrength],
  )

  const setIntensity = (id: string, value: number) => setIntensities((current) => ({ ...current, [id]: value }))
  const preset = (kind: 'low' | 'balanced' | 'stress') => {
    const level = kind === 'low' ? 20 : kind === 'balanced' ? 45 : 75
    setIntensities(Object.fromEntries(Object.keys(DEFAULT_INTENSITIES).map((id) => [id, level])))
    setDeliverySpecificity(kind === 'stress' ? 45 : kind === 'balanced' ? 70 : 80)
    setReversibility(kind === 'stress' ? 40 : kind === 'balanced' ? 70 : 85)
    setValidationStrength(kind === 'stress' ? 35 : kind === 'balanced' ? 60 : 75)
  }

  return (
    <div className="grid gap-3 xl:grid-cols-[1.25fr_.75fr]">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => preset('low')} className="min-h-10 rounded-xl border border-neutral-200 px-3 text-[10px] font-black dark:border-white/10">Low perturbation</button>
          <button type="button" onClick={() => preset('balanced')} className="min-h-10 rounded-xl border border-brand/30 bg-brand/5 px-3 text-[10px] font-black text-brand">Balanced exploration</button>
          <button type="button" onClick={() => preset('stress')} className="min-h-10 rounded-xl border border-rose-200 px-3 text-[10px] font-black text-rose-700 dark:border-rose-300/20 dark:text-rose-300">High-perturbation stress test</button>
        </div>

        <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
          <div className="text-[9px] font-black uppercase tracking-[0.16em] text-brand">Intervention levers · {program.shortTitle}</div>
          <div className="mt-3 space-y-4">
            {program.levers.map((item) => (
              <label key={item.id} className="block">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-black text-neutral-900 dark:text-white">{item.label}</div>
                    <div className="mt-0.5 text-[9px] leading-relaxed text-neutral-500">{item.question}</div>
                  </div>
                  <span className="rounded-full bg-neutral-100 px-2 py-1 text-[9px] font-black dark:bg-white/10">{intensities[item.id] ?? 0}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={intensities[item.id] ?? 0}
                  onChange={(event) => setIntensity(item.id, Number(event.target.value))}
                  className="mt-2 w-full accent-[var(--color-brand,#00BF63)]"
                  aria-label={`${item.label} research intensity`}
                />
                <div className="mt-1 grid gap-1 text-[9px] text-neutral-500 md:grid-cols-2">
                  <span><b className="text-neutral-700 dark:text-neutral-300">Mechanism:</b> {item.mechanism}</span>
                  <span><b className="text-neutral-700 dark:text-neutral-300">Constraint:</b> {item.primaryConstraint}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          {[
            ['Delivery specificity', deliverySpecificity, setDeliverySpecificity],
            ['Reversibility / stop-switch', reversibility, setReversibility],
            ['Validation strength', validationStrength, setValidationStrength],
          ].map(([label, value, setter]) => (
            <label key={label as string} className="rounded-xl border border-neutral-200 p-3 dark:border-white/10">
              <div className="flex justify-between text-[9px] font-black uppercase tracking-wide text-neutral-500"><span>{label as string}</span><span>{value as number}</span></div>
              <input type="range" min={0} max={100} value={value as number} onChange={(event) => (setter as (value: number) => void)(Number(event.target.value))} className="mt-2 w-full accent-[var(--color-brand,#00BF63)]" />
            </label>
          ))}
        </div>
      </div>

      <aside className="space-y-3">
        <div className="rounded-2xl border border-brand/20 bg-brand/[.04] p-3">
          <div className="text-[9px] font-black uppercase tracking-[0.16em] text-brand">Synthetic systems readout</div>
          <div className="mt-3 grid gap-2">
            <Metric label="Mechanism signal" value={output.mechanismSignal} />
            <Metric label="Safety margin" value={output.safetyMargin} />
            <Metric label="Translation readiness" value={output.translationalReadiness} />
            <Metric label="Residual uncertainty" value={output.residualUncertainty} inverse />
            <Metric label="Systemic balance" value={output.systemicBalance} />
          </div>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-3 dark:border-rose-300/20 dark:bg-rose-300/[.05]">
          <div className="text-[9px] font-black uppercase tracking-[0.16em] text-rose-700 dark:text-rose-300">Dominant risk flags</div>
          <div className="mt-2 space-y-2">
            {output.dominantRisks.map((risk) => <div key={risk} className="rounded-xl bg-white/80 p-2 text-[10px] leading-relaxed text-neutral-700 dark:bg-black/20 dark:text-neutral-300">{risk}</div>)}
          </div>
        </div>
        <p className="text-[9px] leading-relaxed text-neutral-500">The meters are deliberately synthetic. Moving a slider changes a transparent heuristic model so users can reason about trade-offs; it does not predict biological response.</p>
      </aside>
    </div>
  )
}

function Translation() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
        <div className="text-[9px] font-black uppercase tracking-[0.16em] text-brand">Commercialization bottlenecks</div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-[760px] w-full border-separate border-spacing-y-2 text-left text-[10px]">
            <thead className="text-[9px] uppercase tracking-wide text-neutral-400">
              <tr><th className="px-2">Dimension</th><th className="px-2">Current bottleneck</th><th className="px-2">Regulatory / industry reality</th></tr>
            </thead>
            <tbody>
              {LONGEVITY_TRANSLATION_BOTTLENECKS.map((item) => (
                <tr key={item.id} className="bg-neutral-50 align-top dark:bg-white/[.035]">
                  <td className="rounded-l-xl px-3 py-3 font-black text-neutral-900 dark:text-white">{item.dimension}</td>
                  <td className="px-3 py-3 leading-relaxed text-neutral-600 dark:text-neutral-300">{item.bottleneck}</td>
                  <td className="rounded-r-xl px-3 py-3 leading-relaxed text-neutral-600 dark:text-neutral-300">{item.reality}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-4">
        {[
          ['Define', 'A bounded indication, population and clinically meaningful endpoint.'],
          ['Measure', 'Mechanism biomarkers plus outcomes that can be prospectively validated.'],
          ['Deliver', 'A manufacturable delivery system with tissue specificity and repeat-dose strategy.'],
          ['Watch', 'Longitudinal safety surveillance appropriate to durable biological interventions.'],
        ].map(([title, body], index) => (
          <div key={title} className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-brand">0{index + 1} · {title}</div>
            <p className="mt-2 text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300">{body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function EvidenceDebt() {
  const debts = [
    ['Causal target validity', 'Does manipulating the target change meaningful function, not only a biomarker?'],
    ['Cell-type specificity', 'Is the effect preserved across the relevant cell states and tissue microenvironments?'],
    ['Dose / exposure control', 'Can exposure be bounded in space and time, with a credible off-switch?'],
    ['Long-term oncogenic safety', 'Does regenerative or reprogramming pressure alter malignant transformation risk?'],
    ['Immune compatibility', 'Can repeat treatment occur without neutralization, autoimmunity or chronic immune toxicity?'],
    ['Surrogate validation', 'Does a biomarker change reliably forecast a meaningful clinical outcome in the intended context?'],
    ['Manufacturing reproducibility', 'Can identity, purity, potency and batch consistency be measured at scale?'],
    ['Human heterogeneity', 'Do age, sex, disease burden, genetics and prior treatment change benefit/risk enough to alter the strategy?'],
    ['Combination interactions', 'Do multi-system interventions create nonlinear benefits, antagonism or unexpected toxicity?'],
    ['Durability', 'Does the intervention persist long enough to matter without becoming irreversible when the biology changes?'],
  ]
  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {debts.map(([title, body], index) => (
        <article key={title} className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[10px] font-black text-neutral-900 dark:text-white">{title}</div>
            <span className="rounded-full bg-amber-100 px-2 py-1 text-[8px] font-black uppercase tracking-wide text-amber-800 dark:bg-amber-300/10 dark:text-amber-200">OPEN {index + 1}</span>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300">{body}</p>
        </article>
      ))}
    </div>
  )
}

export default function LongevityProblemSolver() {
  const [selected, setSelected] = useState<LongevityProgramId>('epigenetic-reprogramming')
  const [view, setView] = useState<ViewMode>('systems')
  const totalLevers = LONGEVITY_PROGRAMS.reduce((sum, program) => sum + program.levers.length, 0)

  return (
    <section data-longevity-problem-solver="v1" className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-3 dark:border-emerald-300/20 dark:bg-emerald-300/[.035]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Aging / longevity · unsolved systems lab</div>
          <h4 className="mt-1 text-base font-black text-neutral-950 dark:text-white">Reversing aging problem solver</h4>
          <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300">Visualize the coupled engineering problems behind rejuvenation research, perturb transparent research levers, inspect safety trade-offs and see why translation can fail even when a mechanism is plausible.</p>
        </div>
        <div className="flex gap-1.5 text-[9px] font-black">
          <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-emerald-700 dark:border-emerald-300/20 dark:bg-white/5 dark:text-emerald-200">{LONGEVITY_PROGRAMS.length} programs</span>
          <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-emerald-700 dark:border-emerald-300/20 dark:bg-white/5 dark:text-emerald-200">{totalLevers} levers</span>
        </div>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Longevity research workbench views">
        {(Object.keys(VIEW_LABEL) as ViewMode[]).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={view === item}
            onClick={() => setView(item)}
            className={`min-h-10 shrink-0 rounded-full border px-3 text-[10px] font-black transition ${view === item ? 'border-emerald-500 bg-emerald-600 text-white' : 'border-neutral-200 bg-white/70 text-neutral-600 dark:border-white/10 dark:bg-white/[.035] dark:text-neutral-300'}`}
          >
            {VIEW_LABEL[item]}
          </button>
        ))}
      </div>

      <div className="mt-3">
        {view === 'systems' && <SystemsMap selected={selected} onSelect={setSelected} />}
        {view === 'simulator' && <Simulator selected={selected} />}
        {view === 'translation' && <Translation />}
        {view === 'evidence' && <EvidenceDebt />}
      </div>

      {(view === 'systems' || view === 'simulator') && <div className="mt-3"><ProgramDetail id={selected} /></div>}

      <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-[9px] leading-relaxed text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/[.05] dark:text-amber-200">{LONGEVITY_RESEARCH_BOUNDARY}</p>
    </section>
  )
}
