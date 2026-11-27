import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'
import type { SimulationDomain } from './UnifiedHumanSimulationProjector'
import type { BodySemanticScale } from '../../lib/bodySemanticZoom'
import { BodyExposurePatientOverlay } from '../../components/BodyExposurePatientOverlay'
import { SinyalPribadiDiTubuh } from '../../components/SinyalPribadiDiTubuh'
import { BodyExplorer } from './BodyExplorer'
import { hitungScrollAgarTerlihat } from '../../lib/railViewport'
import '../bodyExposureOS.css'
import { BatasKlaimKesehatan } from '../../components/BatasKlaimKesehatan'
import { loadBodyExposureLocalHub } from '../../domains/body-exposure'
import { Fold } from '../../shared/ui/Fold'
import { BodyScaleLadder, rungForDomain } from './BodyScaleLadder'

const UnifiedHumanSimulationProjector = lazy(() => import('./UnifiedHumanSimulationProjector'))
const PanelKoplingMultiSkala = lazy(() => import('../../components/digital-twin/PanelKoplingMultiSkala'))
const PanelUbiquitin = lazy(() => import('../../components/digital-twin/PanelUbiquitin'))
const BodyExposureLocalHub = lazy(loadBodyExposureLocalHub)

type ExposureMode = 'identity' | 'atlas' | 'localization' | 'physiology' | 'imaging' | 'endoscopy' | 'surgery' | 'molecular' | 'clinical'

type Mode = {
  key: ExposureMode
  label: string
  projectorDomain: SimulationDomain
  description: string
}

const MODES: Mode[] = [
  { key: 'identity', label: 'My Body', projectorDomain: 'personal-avatar', description: 'Scan or review your personal outer-body identity while the source-backed anatomy remains visible in the same projector.' },
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
  const modeRailRef = useRef<HTMLDivElement | null>(null)
  const [activeMode, setActiveMode] = useState<ExposureMode>('atlas')
  // The ladder can request domains the mode list never exposed (biomechanics,
  // genome, pharmacology), so the projector follows this, not the mode.
  const [projectorDomain, setProjectorDomain] = useState<SimulationDomain>('anatomy')
  const [activeRungId, setActiveRungId] = useState('body')
  const [immersive, setImmersive] = useState(false)
  const [selectedBodySystemId, setSelectedBodySystemId] = useState<BodySystemId>('cardiovascular')
  const [strukturDiminta, setStrukturDiminta] = useState<{ name: string; nonce: number } | null>(null)
  const [skalaDiminta, setSkalaDiminta] = useState<{ scale: BodySemanticScale; nonce: number } | null>(null)

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

  useLayoutEffect(() => {
    const rail = modeRailRef.current?.querySelector('nav')
    const active = rail?.querySelector<HTMLElement>('[data-body-exposure-mode-active="true"]')
    if (!rail || !active) return
    const railBox = rail.getBoundingClientRect()
    const itemBox = active.getBoundingClientRect()
    const next = hitungScrollAgarTerlihat({
      viewportWidth: rail.clientWidth,
      scrollWidth: rail.scrollWidth,
      itemLeft: rail.scrollLeft + itemBox.left - railBox.left,
      itemWidth: itemBox.width,
      currentScrollLeft: rail.scrollLeft,
    })
    if (Math.abs(next - rail.scrollLeft) > 1) rail.scrollLeft = next
  }, [activeRungId])

  function syncModeFromProjector(domain: SimulationDomain) {
    setProjectorDomain(domain)
    setActiveRungId((current) => rungForDomain(domain, current))
    const next: ExposureMode =
      domain === 'personal-avatar' ? 'identity'
      : domain === 'localization' ? 'localization'
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
    syncModeFromProjector('anatomy')
    setActiveRungId('body')
    setSkalaDiminta((k) => ({ scale: 'system', nonce: (k?.nonce ?? 0) + 1 }))
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

      <header className="body-exposure-os__glass relative z-[2] overflow-hidden rounded-[18px] border border-white/15 px-3 py-2">
        <div className="pointer-events-none absolute inset-x-[18%] -top-24 h-40 rounded-full bg-cyan-400/10 blur-3xl" aria-hidden />
        <div className="relative flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <h2 id="body-exposure-os-title" className="text-base font-black tracking-[-.02em] text-white sm:text-lg">
              Your body. Every scale.
            </h2>
            <p className="sr-only">You → anatomy → function → imaging → micro</p>
            <BatasKlaimKesehatan permukaan="body.exposure-os" className="shrink-0" />
          </div>

          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              data-pmd-native="true"
              onClick={openSystemAtlas}
              aria-label="Explore 11 systems · one simulation projector"
              className="min-h-[44px] rounded-full border border-cyan-300/35 bg-cyan-400/15 px-3.5 text-[11px] font-black text-cyan-100 transition hover:bg-cyan-400/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
            >
              Explore 11 systems
            </button>
            <button
              type="button"
              data-pmd-native="true"
              onClick={toggleImmersive}
              className="min-h-[44px] rounded-full border border-white/20 bg-white/[.08] px-3.5 text-[11px] font-black text-white transition hover:bg-white/[.15] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              {immersive ? 'Exit' : 'Immersive'}
            </button>
          </div>
        </div>
      </header>

      <div ref={modeRailRef}>
        <BodyScaleLadder
          activeRungId={activeRungId}
          onSelect={(rung) => {
            syncModeFromProjector(rung.domain)
            setActiveRungId(rung.id)
            if (rung.scale) { const scale = rung.scale; setSkalaDiminta((k) => ({ scale, nonce: (k?.nonce ?? 0) + 1 })) }
            systemsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
        />
      </div>

      <div className="sr-only sm:not-sr-only sm:relative sm:z-[2] sm:mt-1.5 sm:flex sm:items-center sm:justify-between sm:gap-3 sm:px-1 sm:text-[11px] sm:font-bold sm:text-slate-300" aria-live="polite">
        <span><span className="text-cyan-200">{current.label}</span> · {current.description}</span>
        <span className="hidden shrink-0 sm:inline">Educational atlas · not a patient-specific diagnosis</span>
      </div>

      <div ref={systemsRef} className="relative z-[2] mt-2 scroll-mt-4">
        <BodyExposurePatientOverlay selectedSystemId={selectedBodySystemId} onClinicalView={() => syncModeFromProjector('pathophysiology')} onShowStructure={(s) => { setSelectedBodySystemId(s.systemId); setStrukturDiminta((k) => ({ name: s.name, nonce: (k?.nonce ?? 0) + 1 })) }} />
        <SinyalPribadiDiTubuh selectedSystemId={selectedBodySystemId} onSelectSystem={setSelectedBodySystemId} />
        <Suspense fallback={<div className="grid min-h-56 place-items-center rounded-[28px] border border-white/[.08] bg-black/35 text-xs font-bold text-white/35">Loading unified human simulation projector…</div>}>
          <UnifiedHumanSimulationProjector
            selectedSystemId={selectedBodySystemId}
            onSystemChange={setSelectedBodySystemId}
            requestedDomain={projectorDomain}
            hideDomainTabs
            onDomainChange={syncModeFromProjector}
            requestedStructure={strukturDiminta}
            requestedScale={skalaDiminta}
          />
        </Suspense>
      </div>

      {/* Closed by default: the hub is a tool, not the first thing on this page (legibility ratchet counts open text). */}
      <details style={{ borderColor: 'rgba(0, 191, 99, 0.35)' }} className="relative z-[2] mt-3 overflow-hidden rounded-[24px] border bg-black/45">
        <summary className="flex min-h-[54px] cursor-pointer list-none items-center justify-between gap-3 px-4 text-xs font-black text-white transition hover:text-emerald-200">
          <span>Devices · Vitality · QR &amp; Barcode</span>
        </summary>
        <div className="border-t border-white/10 p-2 sm:p-3">
          <Suspense fallback={<div className="grid min-h-32 place-items-center text-xs font-bold text-slate-300">Loading wearable hub…</div>}>
            <BodyExposureLocalHub />
          </Suspense>
        </div>
      </details>

      <Fold label="Multiscale" className="relative z-[2] mt-3">
        <Suspense fallback={null}>
          <PanelKoplingMultiSkala />
        </Suspense>
        <div className="mt-3">
          <Suspense fallback={null}>
            <PanelUbiquitin />
          </Suspense>
        </div>
      </Fold>

      <details className="body-exposure-os__labs relative z-[1] mt-3 overflow-hidden rounded-[24px] border border-white/15 bg-black/45">
        <summary className="flex min-h-[54px] cursor-pointer list-none items-center justify-between gap-3 px-4 text-xs font-black text-slate-200 transition hover:text-white">
          <span>Deep reference labs</span>
          <span className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-300">all tools preserved</span>
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
