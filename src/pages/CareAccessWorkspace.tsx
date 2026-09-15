import { lazy, Suspense, useState, type ComponentType } from 'react'

const Consult = lazy(() => import('./Consult').then((m) => ({ default: m.Consult })))
const Hospitals = lazy(() => import('./Hospitals').then((m) => ({ default: m.Hospitals })))
const Pharmacy = lazy(() => import('./Pharmacy').then((m) => ({ default: m.Pharmacy })))
const SecondOpinion = lazy(() => import('./SecondOpinion').then((m) => ({ default: m.SecondOpinion })))
const MedicationReminders = lazy(() => import('./MedicationReminders').then((m) => ({ default: m.MedicationReminders })))

type AccessMode = 'consult' | 'facilities' | 'pharmacy' | 'second-opinion' | 'medications'
type Mode = { key: AccessMode; label: string; description: string; component: ComponentType }

const MODES: Mode[] = [
  {
    key: 'consult',
    label: 'Consult',
    description: 'Prepare or start a consultation from the same care-access surface.',
    component: Consult,
  },
  {
    key: 'facilities',
    label: 'Facilities',
    description: 'Find healthcare facilities without turning location search into a separate top-level product.',
    component: Hospitals,
  },
  {
    key: 'pharmacy',
    label: 'Pharmacy',
    description: 'Medication-access services remain grouped with the rest of care access.',
    component: Pharmacy,
  },
  {
    key: 'second-opinion',
    label: 'Second Opinion',
    description: 'Request or prepare a second-opinion workflow inside the same service context.',
    component: SecondOpinion,
  },
  {
    key: 'medications',
    label: 'Medication Reminders',
    description: 'Medication follow-through belongs beside care access rather than as another standalone destination.',
    component: MedicationReminders,
  },
]

function Loader() {
  return <div className="grid min-h-[28vh] place-items-center rounded-[24px] border border-white/10 bg-white/[.025] text-sm font-bold text-neutral-500">Loading care access…</div>
}

export function CareAccessWorkspace() {
  const [mode, setMode] = useState<AccessMode>('consult')
  const active = MODES.find((item) => item.key === mode) ?? MODES[0]
  const Active = active.component

  return (
    <div className="space-y-3">
      <section className="rounded-[24px] border border-white/10 bg-white/[.025] p-3 sm:p-4">
        <div className="text-[9px] font-black uppercase tracking-[.18em] text-brand">Care Access</div>
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Care access modes">
          {MODES.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={mode === item.key}
              onClick={() => setMode(item.key)}
              className={`min-h-11 shrink-0 rounded-full border px-4 text-xs font-black transition ${mode === item.key ? 'border-brand bg-brand text-white' : 'border-white/10 bg-white/[.035] text-neutral-600 dark:text-neutral-300'}`}
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

export default CareAccessWorkspace
