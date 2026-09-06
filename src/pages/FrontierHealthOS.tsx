import { useMemo, useState } from 'react'
import { PanaceaFrontierSeven } from '../components/frontier/PanaceaFrontierSeven'
import {
  FRONTIER_CATEGORIES,
  FRONTIER_FEATURES,
  frontierByCategory,
  readinessPercent,
  type FrontierCategory,
  type FrontierFeature,
} from '../lib/frontierHealthOS'

const STATUS_LABEL: Record<FrontierFeature['status'], string> = {
  'integration-ready': 'Integration ready',
  scaffold: 'Scaffold ready',
  'external-adapter': 'Needs external adapter',
  'research-only': 'Research only',
}

const GATE_LABEL: Record<FrontierFeature['humanGate'], string> = {
  none: 'No execution gate',
  'clinician-review': 'Clinician review',
  'patient-consent': 'Patient consent',
  'research-governance': 'Research governance',
}

function FeatureCard({ feature, active, onClick }: { feature: FrontierFeature; active: boolean; onClick: () => void }) {
  const readiness = readinessPercent(feature)
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-3 text-left transition ${active ? 'border-brand bg-brand/[0.05]' : 'border-neutral-200 bg-white hover:border-brand/30 dark:border-white/10 dark:bg-white/[0.03]'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-black text-ink dark:text-white">{feature.label}</div>
          <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{feature.mission}</p>
        </div>
        <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-1 text-[9px] font-bold text-neutral-500 dark:bg-white/10 dark:text-neutral-300">
          {STATUS_LABEL[feature.status]}
        </span>
      </div>
      <div className="mt-3">
        <div className="flex justify-between text-[9px] font-bold uppercase tracking-wide text-neutral-400">
          <span>Execution readiness</span><span>{readiness}%</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
          <div className="h-full rounded-full bg-brand" style={{ width: `${readiness}%` }} />
        </div>
      </div>
    </button>
  )
}

export function FrontierHealthOS() {
  const [category, setCategory] = useState<FrontierCategory>('clinical-intelligence')
  const features = useMemo(() => frontierByCategory(category), [category])
  const [selectedId, setSelectedId] = useState(FRONTIER_FEATURES[0].id)
  const selected = FRONTIER_FEATURES.find((feature) => feature.id === selectedId) ?? features[0] ?? FRONTIER_FEATURES[0]

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-5 sm:px-6">
      <section className="rounded-3xl border border-neutral-200 bg-gradient-to-br from-white via-white to-brand/[0.06] p-5 dark:border-white/10 dark:from-neutral-950 dark:via-neutral-950 dark:to-brand/[0.08]">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">Panacea Frontier Health OS</div>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-ink dark:text-white">From health app → programmable human Life OS</h1>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-neutral-500">
          The frontier layer now has two tracks: usable local-first Life OS experiments and deeper execution contracts for clinical intelligence,
          precision medicine, patient sovereignty, care automation, privacy infrastructure and population health. Experimental concepts are kept distinct
          from clinically validated functions and external integrations.
        </p>
      </section>

      <PanaceaFrontierSeven />

      <section className="space-y-4 rounded-[30px] border border-neutral-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[.025] sm:p-5">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.16em] text-neutral-500 dark:text-neutral-400">Health infrastructure frontier</div>
          <h2 className="mt-1 text-xl font-black tracking-tight text-ink dark:text-white">Execution contracts for systems that need evidence, adapters or governance</h2>
        </div>

        <div className="flex gap-1 overflow-x-auto rounded-2xl bg-neutral-100 p-1 dark:bg-white/5">
          {FRONTIER_CATEGORIES.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setCategory(item.key)
                const first = frontierByCategory(item.key)[0]
                if (first) setSelectedId(first.id)
              }}
              className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition ${category === item.key ? 'bg-white text-ink shadow-sm dark:bg-white/10 dark:text-white' : 'text-neutral-500'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-2">
            {features.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} active={selected.id === feature.id} onClick={() => setSelectedId(feature.id)} />
            ))}
          </div>

          <section className="h-fit rounded-3xl border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03] lg:sticky lg:top-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-brand">Execution contract</div>
                <h2 className="mt-1 text-xl font-black text-ink dark:text-white">{selected.label}</h2>
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-bold text-brand">{STATUS_LABEL[selected.status]}</span>
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">{GATE_LABEL[selected.humanGate]}</span>
              </div>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{selected.mission}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-neutral-50 p-3 dark:bg-white/5">
                <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Inputs</div>
                <ul className="mt-2 space-y-1.5">
                  {selected.inputs.map((item) => <li key={item} className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">• {item}</li>)}
                </ul>
              </div>
              <div className="rounded-2xl bg-neutral-50 p-3 dark:bg-white/5">
                <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Outputs</div>
                <ul className="mt-2 space-y-1.5">
                  {selected.outputs.map((item) => <li key={item} className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">• {item}</li>)}
                </ul>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-brand/20 bg-brand/[0.05] p-3">
              <div className="text-[10px] font-black uppercase tracking-wide text-brand">Astra visual target</div>
              <p className="mt-1 text-xs leading-relaxed text-neutral-700 dark:text-neutral-200">{selected.visualTarget}</p>
            </div>

            <div className="mt-3">
              <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Panacea integration targets</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selected.integrations.map((item) => <span key={item} className="rounded-full border border-neutral-200 px-2.5 py-1 text-[10px] font-bold text-neutral-600 dark:border-white/10 dark:text-neutral-300">{item}</span>)}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
              <div className="text-[10px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">Truth / safety boundary</div>
              <p className="mt-1 text-xs leading-relaxed text-amber-900 dark:text-amber-100">{selected.safetyBoundary}</p>
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}

export default FrontierHealthOS
