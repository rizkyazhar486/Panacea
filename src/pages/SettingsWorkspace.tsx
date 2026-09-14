import { lazy, Suspense, type ComponentType } from 'react'
import { useSearchParams } from 'react-router-dom'

const Settings = lazy(() => import('./Settings').then((m) => ({ default: m.Settings })))
const Tutorial = lazy(() => import('./Tutorial').then((m) => ({ default: m.Tutorial })))

type SettingsView = 'settings' | 'tutorial'
type View = { key: SettingsView; label: string; component: ComponentType; description: string }
const VIEWS: View[] = [
  { key: 'settings', label: 'Settings', component: Settings, description: 'Account, preferences, privacy and application controls.' },
  { key: 'tutorial', label: 'Tutorial', component: Tutorial, description: 'How to use Panacea and understand its main workspaces.' },
]

export function SettingsWorkspace() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('t') as SettingsView | null
  const activeKey: SettingsView = requested === 'tutorial' ? 'tutorial' : 'settings'
  const active = VIEWS.find((view) => view.key === activeKey) ?? VIEWS[0]
  const Active = active.component
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 pb-10">
      <section className="rounded-[30px] border border-white/10 bg-black/20 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
        <div className="text-[10px] font-black uppercase tracking-[.22em] text-brand">Settings & Tutorial</div>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-ink dark:text-white">One place to configure and learn Panacea</h1>
        <div className="mt-4 flex gap-2" role="tablist" aria-label="Settings workspace">
          {VIEWS.map((view) => (
            <button key={view.key} type="button" role="tab" aria-selected={activeKey === view.key} onClick={() => { const next = new URLSearchParams(params); next.set('t', view.key); setParams(next, { replace: true }) }} className={`min-h-[44px] rounded-full border px-4 text-xs font-black ${activeKey === view.key ? 'border-brand bg-brand text-white' : 'border-white/10 bg-white/5 text-neutral-600 dark:text-neutral-300'}`}>{view.label}</button>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">{active.description}</p>
      </section>
      <section role="tabpanel" aria-label={active.label}><Suspense fallback={<div className="grid min-h-[32vh] place-items-center text-sm font-bold text-neutral-500">Loading…</div>}><Active /></Suspense></section>
    </div>
  )
}

export default SettingsWorkspace
