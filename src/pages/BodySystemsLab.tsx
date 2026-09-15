import { lazy, Suspense, useMemo, type ComponentType } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { RangkaDaftar } from '../components/Rangka'

const BodyComposition = lazy(() => import('./BodyComposition').then((m) => ({ default: m.BodyComposition })))
const BodyExplorer = lazy(() => import('./BodyExplorer').then((m) => ({ default: m.BodyExplorer })))
const OrganVitality = lazy(() => import('./OrganVitality').then((m) => ({ default: m.OrganVitality })))
const Radiology = lazy(() => import('./Radiology').then((m) => ({ default: m.Radiology })))
const BodyToolkit = lazy(() => import('./BodyToolkit').then((m) => ({ default: m.BodyToolkit })))
const HealthSimulator = lazy(() => import('./HealthSimulator').then((m) => ({ default: m.HealthSimulator })))

type BodyMode = {
  id: string
  label: string
  emoji: string
  summary: string
  component: ComponentType
}

const MODES: BodyMode[] = [
  {
    id: 'composition',
    label: 'Composition',
    emoji: '◌',
    summary: 'Body composition, proportions and measurable phenotype in one workspace.',
    component: BodyComposition,
  },
  {
    id: 'anatomy',
    label: 'Anatomy',
    emoji: '🫀',
    summary: 'Whole-body anatomical exploration without leaving the Body workspace.',
    component: BodyExplorer,
  },
  {
    id: 'organs',
    label: 'Organs',
    emoji: '🫁',
    summary: 'Organ-level vitality and physiological status as the next layer after whole-body overview.',
    component: OrganVitality,
  },
  {
    id: 'imaging',
    label: 'Imaging',
    emoji: '◫',
    summary: 'Radiology and structural views attached to the same anatomical mental model.',
    component: Radiology,
  },
  {
    id: 'toolbox',
    label: 'Tools',
    emoji: '⌁',
    summary: 'Body-focused utilities collected as capabilities instead of separate destinations.',
    component: BodyToolkit,
  },
  {
    id: 'simulation',
    label: 'Simulation',
    emoji: '✦',
    summary: 'Interactive health simulation attached to the same body context.',
    component: HealthSimulator,
  },
]

/**
 * Body Systems Lab is deliberately a compiler, not a replacement.
 *
 * Existing pages remain intact and are mounted here as capabilities. That keeps
 * every implementation, API call and asset available while removing the need
 * for the user to understand which historical page happened to own it.
 *
 * URL model:
 *   /tubuh?t=sistem&m=anatomy
 *
 * `t` belongs to the parent Body page. `m` chooses the capability inside this
 * workspace, so links remain shareable and browser refreshes keep their state.
 */
export function BodySystemsLab() {
  const location = useLocation()
  const navigate = useNavigate()

  const activeId = useMemo(() => {
    const query = new URLSearchParams(location.search)
    const requested = query.get('m')
    return requested && MODES.some((mode) => mode.id === requested) ? requested : MODES[0].id
  }, [location.search])

  const active = MODES.find((mode) => mode.id === activeId) ?? MODES[0]
  const ActiveComponent = active.component

  const selectMode = (id: string) => {
    const query = new URLSearchParams(location.search)
    query.set('t', 'sistem')
    query.set('m', id)
    navigate(`${location.pathname}?${query.toString()}`, { replace: true })
  }

  return (
    <section className="space-y-4">
      <div className="rounded-[24px] border border-neutral-200/80 bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand">Body capability compiler</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-ink dark:text-white">One body workspace, many functions</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400">{active.summary}</p>
          </div>
          <p className="max-w-sm text-[11px] leading-relaxed text-neutral-400">
            Nothing below is deleted. Existing modules, APIs and assets are mounted into one context and revealed only when needed.
          </p>
        </div>

        <div className="no-scrollbar -mx-1 mt-4 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Body systems capability">
          {MODES.map((mode) => {
            const selected = mode.id === active.id
            return (
              <button
                key={mode.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => selectMode(mode.id)}
                className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[11px] font-extrabold transition ${
                  selected
                    ? 'bg-brand text-ink shadow-sm'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-white/10 dark:text-neutral-300 dark:hover:bg-white/15'
                }`}
              >
                <span aria-hidden="true">{mode.emoji}</span>
                {mode.label}
              </button>
            )
          })}
        </div>
      </div>

      <Suspense fallback={<RangkaDaftar jumlah={4} />}>
        <div key={active.id}>
          <ActiveComponent />
        </div>
      </Suspense>
    </section>
  )
}

export default BodySystemsLab
