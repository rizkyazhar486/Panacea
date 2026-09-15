import { lazy, Suspense, useState, type ComponentType } from 'react'

const Planning = lazy(() => import('./Planning').then((m) => ({ default: m.Planning })))
const CareEpisodePage = lazy(() => import('./CareEpisode').then((m) => ({ default: m.CareEpisodePage })))

type PlanningMode = 'plan' | 'episode'
type Mode = { key: PlanningMode; label: string; description: string; component: ComponentType }

const MODES: Mode[] = [
  {
    key: 'plan',
    label: 'Care Plan',
    description: 'Build and review the care plan without leaving the Services workspace.',
    component: Planning,
  },
  {
    key: 'episode',
    label: 'Care Episode',
    description: 'Follow one episode of care as a connected timeline instead of a separate app.',
    component: CareEpisodePage,
  },
]

function Loader() {
  return <div className="grid min-h-[28vh] place-items-center rounded-[24px] border border-white/10 bg-white/[.025] text-sm font-bold text-neutral-500">Loading care planning…</div>
}

export function CarePlanningWorkspace() {
  const [mode, setMode] = useState<PlanningMode>('plan')
  const active = MODES.find((item) => item.key === mode) ?? MODES[0]
  const Active = active.component

  return (
    <div className="space-y-3">
      <section className="rounded-[24px] border border-white/10 bg-white/[.025] p-3 sm:p-4">
        <div className="text-[9px] font-black uppercase tracking-[.18em] text-brand">Care Planning</div>
        <div className="mt-2 flex flex-wrap gap-2" role="tablist" aria-label="Care planning modes">
          {MODES.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={mode === item.key}
              onClick={() => setMode(item.key)}
              className={`min-h-11 rounded-full border px-4 text-xs font-black transition ${mode === item.key ? 'border-brand bg-brand text-white' : 'border-white/10 bg-white/[.035] text-neutral-600 dark:text-neutral-300'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">{active.description}</p>
      </section>
      <section role="tabpanel" aria-label={active.label}>
        <Suspense fallback={<Loader />}><Active /></Suspense>
      </section>
    </div>
  )
}

export default CarePlanningWorkspace
