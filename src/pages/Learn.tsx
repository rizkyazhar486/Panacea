import { Suspense, lazy, useState } from 'react'
import { UnifiedLearnWorkspace } from './UnifiedLearnWorkspace'

// Immediate-release marker: keep the completed workspaces reachable while the
// mobile UI hotfix is released without waiting for the normal Vercel batch.
const LifeLibraryWorkbench = lazy(() => import('../components/LifeLibraryWorkbench').then((m) => ({ default: m.LifeLibraryWorkbench })))
const HealthGapNavigator = lazy(() => import('../components/HealthGapNavigator').then((m) => ({ default: m.HealthGapNavigator })))
const Medical3DFrontierLab = lazy(() => import('../components/Medical3DFrontierLab').then((m) => ({ default: m.Medical3DFrontierLab })))
const LearnBase = lazy(() => import('./LearnBase').then((m) => ({ default: m.Learn })))
const SettingsWorkspace = lazy(() => import('./SettingsWorkspace').then((m) => ({ default: m.SettingsWorkspace })))

type LearnExtension = 'none' | 'library' | 'life' | 'gap' | 'frontier3d' | 'tutorial'

const EXTENSIONS: ReadonlyArray<{ id: Exclude<LearnExtension, 'none'>; label: string; detail: string }> = [
  { id: 'library', label: 'Life Library', detail: 'Read, save, reflect and turn learning into action.' },
  { id: 'life', label: 'Life Learning', detail: 'Explore broader wealth, stories and practical life lessons.' },
  { id: 'gap', label: 'Gap Navigator', detail: 'Find unanswered care-plan questions before an appointment.' },
  { id: 'frontier3d', label: '3D Frontier', detail: 'Open advanced interactive biomedical teaching models on demand.' },
  { id: 'tutorial', label: 'Settings & Tutorial', detail: 'Configure Panacea or open the guided product tutorial.' },
]

function ExtensionLoading() {
  return (
    <div className="grid min-h-40 place-items-center rounded-[24px] border border-emerald-500/15 bg-white p-5 text-xs font-bold text-emerald-700 shadow-sm dark:bg-[#050b08] dark:text-emerald-300">
      Loading workspace…
    </div>
  )
}

export function Learn() {
  const [extension, setExtension] = useState<LearnExtension>('none')

  return (
    <div className="space-y-4 pb-24">
      <UnifiedLearnWorkspace />

      <section className="mx-auto w-full max-w-6xl rounded-[26px] border border-emerald-500/15 bg-white p-3 shadow-[0_14px_42px_rgba(15,23,42,.05)] dark:bg-[#040908] sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-700 dark:text-emerald-300">Learning extensions</div>
            <h2 className="mt-1 text-base font-black tracking-tight text-neutral-950 dark:text-white">Open deeper tools only when you need them.</h2>
          </div>
          {extension !== 'none' && (
            <button
              type="button"
              onClick={() => setExtension('none')}
              className="min-h-11 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 text-[10px] font-black text-emerald-800 transition active:scale-[.98] dark:text-emerald-200"
            >
              Close extension
            </button>
          )}
        </div>

        <div className="no-scrollbar mt-3 flex snap-x gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Learning extensions">
          {EXTENSIONS.map((item) => {
            const active = extension === item.id
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setExtension((current) => current === item.id ? 'none' : item.id)}
                className={`min-h-11 w-[154px] shrink-0 snap-start rounded-2xl border px-3 py-2 text-left transition active:scale-[.98] ${active ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-emerald-500/15 bg-white text-neutral-900 dark:bg-[#050b08] dark:text-white'}`}
              >
                <div className="text-[11px] font-black">{item.label}</div>
                <div className={`mt-0.5 text-[9px] font-semibold leading-snug ${active ? 'text-white/75' : 'text-neutral-500 dark:text-neutral-400'}`}>{item.detail}</div>
              </button>
            )
          })}
        </div>
      </section>

      {extension !== 'none' && (
        <div className="mx-auto w-full max-w-6xl" role="tabpanel" aria-label="Selected learning extension">
          <Suspense fallback={<ExtensionLoading />}>
            {extension === 'library' && <LifeLibraryWorkbench />}
            {extension === 'life' && <LearnBase />}
            {extension === 'gap' && <HealthGapNavigator />}
            {extension === 'frontier3d' && <Medical3DFrontierLab />}
            {extension === 'tutorial' && <SettingsWorkspace />}
          </Suspense>
        </div>
      )}
    </div>
  )
}

export default Learn
