import { lazy, Suspense } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CanonicalBodyExposure } from '../components/CanonicalBodyExposure'

// Existing health/recovery tools remain available, but they no longer compete
// with the anatomical atlas as separate top-level body experiences. A legacy
// deep link opens its tool below the SAME canonical body workspace.
const BodyBattery = lazy(() => import('./BodyBattery').then((m) => ({ default: m.BodyBattery })))
const HeartRateLog = lazy(() => import('./HeartRateLog').then((m) => ({ default: m.HeartRateLog })))
const SleepPattern = lazy(() => import('./SleepPattern').then((m) => ({ default: m.SleepPattern })))
const GaitAnalysis = lazy(() => import('./GaitAnalysis').then((m) => ({ default: m.GaitAnalysis })))
const ClinicalTrackers = lazy(() => import('./ClinicalTrackers').then((m) => ({ default: m.ClinicalTrackers })))
const SleepDebt = lazy(() => import('./SleepDebt').then((m) => ({ default: m.SleepDebt })))
const SleepApneaScreen = lazy(() => import('./SleepApneaScreen').then((m) => ({ default: m.SleepApneaScreen })))
const SleepToolkit = lazy(() => import('./SleepToolkit').then((m) => ({ default: m.SleepToolkit })))
const Chronotype = lazy(() => import('./Chronotype').then((m) => ({ default: m.Chronotype })))
const Recovery = lazy(() => import('./Recovery').then((m) => ({ default: m.Recovery })))
const Breathwork = lazy(() => import('./Breathwork').then((m) => ({ default: m.Breathwork })))
const ThermalTherapy = lazy(() => import('./ThermalTherapy').then((m) => ({ default: m.ThermalTherapy })))
const PostureBreaks = lazy(() => import('./PostureBreaks').then((m) => ({ default: m.PostureBreaks })))
const FastingTimer = lazy(() => import('./FastingTimer').then((m) => ({ default: m.FastingTimer })))

type PanelKey =
  | 'energi'
  | 'jantung'
  | 'tidur'
  | 'gerak'
  | 'klinis'
  | 'utang-tidur'
  | 'apnea'
  | 'alat-tidur'
  | 'kronotipe'
  | 'pulih'
  | 'napas'
  | 'termal'
  | 'postur'
  | 'puasa'

const PANELS: Record<PanelKey, { label: string; component: React.LazyExoticComponent<React.ComponentType> }> = {
  energi: { label: 'Energy', component: BodyBattery },
  jantung: { label: 'Heart rate', component: HeartRateLog },
  tidur: { label: 'Sleep', component: SleepPattern },
  gerak: { label: 'Movement', component: GaitAnalysis },
  klinis: { label: 'Clinical trackers', component: ClinicalTrackers },
  'utang-tidur': { label: 'Sleep debt', component: SleepDebt },
  apnea: { label: 'Sleep apnoea', component: SleepApneaScreen },
  'alat-tidur': { label: 'Sleep toolkit', component: SleepToolkit },
  kronotipe: { label: 'Chronotype', component: Chronotype },
  pulih: { label: 'Recovery', component: Recovery },
  napas: { label: 'Breathwork', component: Breathwork },
  termal: { label: 'Heat & cold', component: ThermalTherapy },
  postur: { label: 'Posture breaks', component: PostureBreaks },
  puasa: { label: 'Fasting', component: FastingTimer },
}

const PRIMARY_PANEL_KEYS: PanelKey[] = ['energi', 'jantung', 'tidur', 'gerak', 'klinis', 'pulih']

export function PusatTubuh() {
  const [params] = useSearchParams()
  const requested = params.get('t') as PanelKey | null
  const active = requested && requested in PANELS ? PANELS[requested] : null
  const ActivePanel = active?.component

  return (
    <div className="min-h-screen bg-[#030408] text-white">
      <CanonicalBodyExposure />

      <section className="mx-auto w-full max-w-[1500px] px-3 pb-10 sm:px-5 lg:px-7">
        <div className="border-t border-white/10 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.18em] text-neutral-500">Physiology & personal signals</div>
              <h2 className="mt-1 text-base font-black text-white">Same body, measured over time</h2>
            </div>
            {active && (
              <Link
                to="/tubuh"
                className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-[10px] font-black text-neutral-300 hover:text-white"
              >
                Close panel
              </Link>
            )}
          </div>

          <nav className="mt-3 flex gap-1.5 overflow-x-auto pb-1" aria-label="Body signal tools">
            {PRIMARY_PANEL_KEYS.map((key) => (
              <Link
                key={key}
                to={`/tubuh?t=${key}`}
                className={`shrink-0 rounded-full border px-3 py-2 text-[10px] font-bold transition ${
                  requested === key
                    ? 'border-violet-300/50 bg-violet-300/10 text-white'
                    : 'border-white/10 bg-white/[.025] text-neutral-400 hover:text-white'
                }`}
              >
                {PANELS[key].label}
              </Link>
            ))}
          </nav>

          {ActivePanel && (
            <div className="mt-4 overflow-hidden rounded-[22px] border border-white/10 bg-black/20 p-3 sm:p-4">
              <div className="mb-3 text-[10px] font-black uppercase tracking-[.16em] text-violet-300/80">{active.label}</div>
              <Suspense fallback={<div className="min-h-48 animate-pulse rounded-2xl bg-white/[.03]" />}>
                <ActivePanel />
              </Suspense>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default PusatTubuh
