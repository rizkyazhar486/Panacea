import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { BodySystemId } from '../lib/bodySystemSourceWave'
import { BodyExplorer } from './BodyExplorer'
import './bodyExposureOS.css'

const UnifiedHumanSimulationProjector = lazy(() => import('./bodyhub/UnifiedHumanSimulationProjector'))

type ExposureMode = 'atlas' | 'physiology' | 'imaging' | 'surgery' | 'molecular' | 'clinical'

type Mode = {
  key: ExposureMode
  label: string
  panel: string
  description: string
}

const MODES: Mode[] = [
  { key: 'atlas', label: 'Atlas', panel: 'Layers', description: 'Whole-body layers, structures, organs and surface-to-depth exploration.' },
  { key: 'physiology', label: 'Physiology', panel: 'Physiology', description: 'Connect anatomy to organ function, motion and reference physiology.' },
  { key: 'imaging', label: 'Imaging', panel: 'DICOM → 3D', description: 'Move between anatomy, radiology views and volumetric imaging tools.' },
  { key: 'surgery', label: 'Surgery', panel: 'Surgical layers', description: 'Explore operative approaches as ordered tissue and anatomical layers.' },
  { key: 'molecular', label: 'Micro → Gene', panel: 'Tissue → gene', description: 'Descend from organs into tissue, cells, molecular pathways and genes.' },
  { key: 'clinical', label: 'Clinical', panel: 'Diseases', description: 'Relate structures to disease, drugs and clinically oriented learning.' },
]

const LIQUID_ACTIONS_ROOT_CLASS = 'pmd-liquid-actions-v45'
const BODY_EXPOSURE_ROOT_CLASS = 'pmd-body-exposure-active'

export function BodyExposureOS() {
  const rootRef = useRef<HTMLElement | null>(null)
  const explorerRef = useRef<HTMLDivElement | null>(null)
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
    const buttons = Array.from(explorerRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])
    const target = buttons.find((button) => {
      const label = button.textContent?.trim()
      const aria = button.getAttribute('aria-label') ?? ''
      return label === mode.panel && !aria.startsWith('Jump to ')
    })

    if (target) {
      target.click()
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      requestAnimationFrame(() => target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center', inline: 'center' }))
      return
    }

    explorerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

  function captureExplorerSelection(event: React.MouseEvent<HTMLDivElement>) {
    const button = (event.target as HTMLElement).closest('button')
    if (!button) return
    const label = button.textContent?.trim()
    const matched = MODES.find((mode) => mode.panel === label)
    if (matched) setActiveMode(matched.key)
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

      <header className="body-exposure-os__glass relative z-[2] overflow-hidden rounded-[28px] border border-white/10 p-4 sm:p-5 lg:p-6">
        <div className="pointer-events-none absolute inset-x-[12%] -top-24 h-44 rounded-full bg-cyan-400/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" aria-hidden />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[.24em] text-cyan-200">Body Exposure · Human Body OS</span>
              <span className="rounded-full border border-white/10 bg-white/[.045] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.14em] text-white/60">whole-body first</span>
              <span className="rounded-full border border-violet-300/10 bg-violet-300/[.045] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.14em] text-violet-100/65">one simulation projector</span>
              <span className="rounded-full border border-cyan-300/10 bg-cyan-300/[.045] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.14em] text-cyan-100/65">source-backed</span>
            </div>
            <h2 id="body-exposure-os-title" className="mt-2 max-w-3xl text-2xl font-black tracking-[-.035em] text-white sm:text-3xl lg:text-4xl">
              One body. Every scale. One continuous simulation space.
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-white/60 sm:text-[15px]">
              Start from the complete human body, keep one system context, then project the same anatomy through physiology, pathophysiology, biomechanics, cells, genome, pharmacology and surgical simulation without leaving the same workspace.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={openSystemAtlas}
              className="min-h-[44px] rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 text-xs font-black text-cyan-100 transition hover:bg-cyan-300/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
            >
              Explore 11 systems
            </button>
            <button
              type="button"
              onClick={() => openPanel(MODES[0])}
              className="min-h-[44px] rounded-full border border-white/12 bg-white/[.055] px-4 text-xs font-black text-white/70 transition hover:bg-white/[.09] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Layers & structures
            </button>
            <button
              type="button"
              onClick={toggleImmersive}
              className="min-h-[44px] rounded-full border border-white/12 bg-white/[.055] px-4 text-xs font-black text-white/80 transition hover:bg-white/[.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              {immersive ? 'Exit immersive' : 'Immersive view'}
            </button>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-3 gap-2 sm:max-w-2xl">
          <div className="rounded-2xl border border-white/[.08] bg-black/25 px-3 py-2.5">
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-white/35">Orientation</div>
            <div className="mt-1 text-xs font-black text-white/85">Whole body → system</div>
          </div>
          <div className="rounded-2xl border border-white/[.08] bg-black/25 px-3 py-2.5">
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-white/35">Depth</div>
            <div className="mt-1 text-xs font-black text-white/85">Organ → tissue → gene</div>
          </div>
          <div className="rounded-2xl border border-white/[.08] bg-black/25 px-3 py-2.5">
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-white/35">Context</div>
            <div className="mt-1 text-xs font-black text-white/85">Anatomy + function + failure</div>
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
        <Suspense fallback={<div className="grid min-h-56 place-items-center rounded-[28px] border border-white/[.08] bg-black/35 text-xs font-bold text-white/35">Loading unified human simulation projector…</div>}>
          <UnifiedHumanSimulationProjector
            selectedSystemId={selectedBodySystemId}
            onSystemChange={setSelectedBodySystemId}
          />
        </Suspense>
      </div>

      <div
        id="body-exposure-core"
        ref={explorerRef}
        onClickCapture={captureExplorerSelection}
        className="body-exposure-os__core relative z-[1] mt-3 rounded-[30px] border border-white/[.08] bg-black/45 p-2 shadow-[0_24px_80px_rgba(0,0,0,.34)] backdrop-blur-xl sm:p-3"
      >
        <BodyExplorer />
      </div>
    </section>
  )
}

export default BodyExposureOS
