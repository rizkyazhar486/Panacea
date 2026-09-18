import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { BodySystemId } from '../lib/bodySystemSourceWave'
import type { SimulationDomain } from './bodyhub/UnifiedHumanSimulationProjector'
import { BodyExposurePatientOverlay } from '../components/BodyExposurePatientOverlay'
import { BodyExplorer } from './BodyExplorer'
import './bodyExposureOS.css'

const UnifiedHumanSimulationProjector = lazy(() => import('./bodyhub/UnifiedHumanSimulationProjector'))

type ExposureMode = 'atlas' | 'localization' | 'physiology' | 'imaging' | 'endoscopy' | 'surgery' | 'molecular' | 'clinical'

type Mode = {
  key: ExposureMode
  label: string
  projectorDomain: SimulationDomain
  description: string
}

const MODES: Mode[] = [
  { key: 'atlas', label: 'Atlas', projectorDomain: 'anatomy', description: 'Whole-body layers, exact source structures and surface-to-depth exploration.' },
  { key: 'localization', label: 'Localize', projectorDomain: 'localization', description: 'Relate neurological findings to tract crossings, cranial nerve level and lesion side.' },
  { key: 'physiology', label: 'Physiology', projectorDomain: 'physiology', description: 'Connect anatomy to organ function, motion and reference physiology.' },
  { key: 'imaging', label: 'Imaging', projectorDomain: 'imaging', description: 'Move between anatomy, CT windows, DICOM context and volumetric reconstruction.' },
  { key: 'endoscopy', label: 'Scope', projectorDomain: 'endoscopy', description: 'Navigate a simulated endoluminal view with the anatomy route kept visible.' },
  { key: 'surgery', label: 'Surgery', projectorDomain: 'surgery', description: 'Explore operative approaches as ordered tissue and anatomical layers.' },
  { key: 'molecular', label: 'Micro → Gene', projectorDomain: 'cell', description: 'Descend from organs into tissue, cells, organelles, molecular pathways and genome.' },
  { key: 'clinical', label: 'Clinical', projectorDomain: 'pathophysiology', description: 'Relate the selected body context to disease mechanisms and clinically oriented learning.' },
]

const LIQUID_ACTIONS_ROOT_CLASS = 'pmd-liquid-actions-v45'
const BODY_EXPOSURE_ROOT_CLASS = 'pmd-body-exposure-active'

export function BodyExposureOS() {
  const rootRef = useRef<HTMLElement | null>(null)
  const systemsRef = useRef<HTMLDivElement | null>(null)
  const [activeMode, setActiveMode] = useState<ExposureMode>('atlas')
  const [immersive, setImmersive] = useState(false)
  const [selectedBodySystemId, setSelectedBodySystemId] = useState<BodySystemId>('cardiovascular')

  useEffect(() => {
    const syncFullscreen = () => setImmersive(document.fullscreenElement === rootRef.current)
    document.addEventListener('fullscreenchange', syncFullscreen)
    return () => document.removeEventListener('fullscreenchange', syncFullscreen)
  }, [])

  useLayoutEffect(() => {
    // Body Exposure owns a dense anatomy/physiology interaction model. The later
    // global liquid-action material pass overrides those controls through an
    // html-level selector. Suspend it before first paint and keep it suspended
    // while mounted, even if a global runtime tries to re-assert the class.
    const html = document.documentElement
    let restoreLiquidActions = html.classList.contains(LIQUID_ACTIONS_ROOT_CLASS)

    const suppressGlobalControlSkin = () => {
      if (!html.classList.contains(LIQUID_ACTIONS_ROOT_CLASS)) return
      restoreLiquidActions = true
      html.classList.remove(LIQUID_ACTIONS_ROOT_CLASS)
    }

    html.classList.add(BODY_EXPOSURE_ROOT_CLASS)
    suppressGlobalControlSkin()

    const classObserver = new MutationObserver(suppressGlobalControlSkin)
    classObserver.observe(html, { attributes: true, attributeFilter: ['class'] })

    return () => {
      classObserver.disconnect()
      html.classList.remove(BODY_EXPOSURE_ROOT_CLASS)
      if (restoreLiquidActions) html.classList.add(LIQUID_ACTIONS_ROOT_CLASS)
    }
  }, [])

  function openPanel(mode: Mode) {
    setActiveMode(mode.key)
    systemsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function syncModeFromProjector(domain: SimulationDomain) {
    const next: ExposureMode =
      domain === 'localization' ? 'localization'
      : domain === 'physiology' || domain === 'biomechanics' ? 'physiology'
      : domain === 'imaging' ? 'imaging'
      : domain === 'endoscopy' ? 'endoscopy'
      : domain === 'surgery' ? 'surgery'
      : domain === 'cell' || domain === 'genome' ? 'molecular'
      : domain === 'pathophysiology' || domain === 'pharmacology' ? 'clinical'
      : 'atlas'
    setActiveMode(next)
  }

  function openSystemAtlas() {
    setActiveMode('atlas')
    systemsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function toggleImmersive() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await rootRef.current?.requestFullscreen()
    } catch {
      // Fullscreen is progressive enhancement. Body Exposure remains fully usable when a browser blocks it.
    }
  }

  const current = MODES.find((mode) => mode.key === activeMode) ?? MODES[0]

  return (
    <section
      ref={rootRef}
      className="body-exposure-os"
      aria-labelledby="body-exposure-os-title"
      data-pmd-body-exposure="true"
      data-pmd-unclamped="true"
      data-pmd-liquid="off"
    >
      <div className="body-exposure-os__ambient" aria-hidden />

      <header className="body-exposure-os__glass relative z-[2] overflow-hidden rounded-[24px] border border-white/10 p-3 sm:p-4">
        <div className="pointer-events-none absolute inset-x-[18%] -top-24 h-40 rounded-full bg-cyan-400/10 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase tracking-[.22em] text-cyan-200/75">Body Exposure</div>
            <h2 id="body-exposure-os-title" className="mt-1 text-xl font-black tracking-[-.035em] text-white sm:text-2xl">
              One body. Every scale.
            </h2>
            <p className="mt-1 truncate text-[10px] font-bold text-white/42 sm:text-[11px]">
              Atlas → function → imaging → scope → surgery → micro
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={openSystemAtlas}
              aria-label="Explore 11 systems · one simulation projector"
              className="min-h-[44px] rounded-full border border-cyan-300/22 bg-cyan-300/[.08] px-4 text-[11px] font-black text-cyan-100 transition hover:bg-cyan-300/[.13] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
            >
              Explore 11 systems
            </button>
            <button
              type="button"
              onClick={toggleImmersive}
              className="min-h-[44px] rounded-full border border-white/10 bg-white/[.045] px-4 text-[11px] font-black text-white/72 transition hover:bg-white/[.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              {immersive ? 'Exit' : 'Immersive'}
            </button>
          </div>
        </div>
      </header>

      <nav className="body-exposure-os__dock relative z-[3] mt-3 overflow-x-auto rounded-[22px] border border-white/[.08] bg-black/55 p-1.5 backdrop-blur-2xl" aria-label="Body Exposure modes">
        <div className="flex min-w-max gap-1.5">
          {MODES.map((mode) => {
            const active = mode.key === activeMode
            return (
              <button
                key={mode.key}
                type="button"
                aria-pressed={active}
                onClick={() => openPanel(mode)}
                className={`min-h-[42px] rounded-[16px] border px-4 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 ${
                  active
                    ? 'border-cyan-300/25 bg-[linear-gradient(135deg,rgba(34,211,238,.16),rgba(139,92,246,.11),rgba(236,72,153,.08))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_10px_30px_rgba(34,211,238,.06)]'
                    : 'border-transparent bg-transparent text-white/45 hover:border-white/[.08] hover:bg-white/[.04] hover:text-white/80'
                }`}
              >
                {mode.label}
              </button>
            )
          })}
        </div>
      </nav>

      <div className="relative z-[2] mt-2 flex items-center justify-between gap-3 px-1 text-[10px] font-bold text-white/40" aria-live="polite">
        <span><span className="text-cyan-200/80">{current.label}</span> · {current.description}</span>
        <span className="hidden shrink-0 sm:inline">Educational atlas · not a patient-specific diagnosis</span>
      </div>

      <div ref={systemsRef} className="relative z-[2] mt-3 scroll-mt-4">
        <BodyExposurePatientOverlay onClinicalView={() => setActiveMode('clinical')} />
        <Suspense fallback={<div className="grid min-h-56 place-items-center rounded-[28px] border border-white/[.08] bg-black/35 text-xs font-bold text-white/35">Loading unified human simulation projector…</div>}>
          <UnifiedHumanSimulationProjector
            selectedSystemId={selectedBodySystemId}
            onSystemChange={setSelectedBodySystemId}
            requestedDomain={current.projectorDomain}
            onDomainChange={syncModeFromProjector}
          />
        </Suspense>
      </div>

      <details className="body-exposure-os__labs relative z-[1] mt-3 overflow-hidden rounded-[28px] border border-white/[.08] bg-black/35">
        <summary className="flex min-h-[54px] cursor-pointer list-none items-center justify-between gap-3 px-4 text-xs font-black text-white/65 transition hover:text-white">
          <span>Deep reference labs</span>
          <span className="text-[9px] font-bold uppercase tracking-[.14em] text-white/30">all existing tools preserved · open on demand</span>
        </summary>
        <div
          id="body-exposure-core"
          className="body-exposure-os__core border-t border-white/[.08] p-2 sm:p-3"
        >
          <BodyExplorer />
        </div>
      </details>
    </section>
  )
}

export default BodyExposureOS
