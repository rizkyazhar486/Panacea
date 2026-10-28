import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'
import type { SimulationDomain } from './UnifiedHumanSimulationProjector'
import { BodyExposurePatientOverlay } from '../../components/BodyExposurePatientOverlay'
import { SinyalPribadiDiTubuh } from '../../components/SinyalPribadiDiTubuh'
import { BodyExplorer } from './BodyExplorer'
import { hitungScrollAgarTerlihat } from '../../lib/railViewport'
import '../bodyExposureOS.css'
import { BatasKlaimKesehatan } from '../../components/BatasKlaimKesehatan'
import { Fold } from '../../shared/ui/Fold'

const UnifiedHumanSimulationProjector = lazy(() => import('./UnifiedHumanSimulationProjector'))
const PanelKoplingMultiSkala = lazy(() => import('../../components/digital-twin/PanelKoplingMultiSkala'))
const PanelUbiquitin = lazy(() => import('../../components/digital-twin/PanelUbiquitin'))

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
  const modeRailRef = useRef<HTMLElement | null>(null)
  const [activeMode, setActiveMode] = useState<ExposureMode>('identity')
  const [immersive, setImmersive] = useState(false)
  const [selectedBodySystemId, setSelectedBodySystemId] = useState<any>('cardiovascular')
  const [strukturDiminta, setStrukturDiminta] = useState<{ name: string; nonce: number } | null>(null)

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
    const rail = modeRailRef.current
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
  }, [activeMode])

  function openPanel(mode: Mode) {
    setActiveMode(mode.key)
    systemsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function syncModeFromProjector(domain: SimulationDomain) {
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
              Your body. Every scale.
            </h2>
            <BatasKlaimKesehatan permukaan="body.exposure-os" className="mt-2 text-[11px] leading-snug text-white/55" />
            <p className="mt-1 truncate text-[10px] font-bold text-white/42 sm:text-[11px]">
              You → anatomy → function → imaging → micro
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

      <nav
        ref={modeRailRef}
        className="body-exposure-os__dock relative z-[3] mt-5 overflow-x-auto rounded-[24px] border border-white/15 bg-black/70 p-2.5 backdrop-blur-2xl shadow-lg"
        aria-label="Body Exposure modes"
        data-body-exposure-mode-rail="v1"
      >
        <div className="flex min-w-max gap-2.5">
          {MODES.map((mode) => {
            const active = mode.key === activeMode
            return (
              <button
                key={mode.key}
                type="button"
                aria-pressed={active}
                data-body-exposure-mode-active={String(active)}
                onClick={() => openPanel(mode)}
                className={`min-h-[48px] rounded-[16px] border px-5 py-2.5 text-sm font-bold tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                  active
                    ? 'border-cyan-200 bg-white text-slate-950 shadow-md'
                    : 'border-white/10 bg-white/[.04] text-white/80 hover:border-white/25 hover:bg-white/[.10] hover:text-white'
                }`}
              >
                {mode.label}
              </button>
            )
          })}
        </div>
      </nav>

      <div className="body-exposure-os__specialty-card relative z-[2] mt-5 rounded-[24px] p-4 sm:p-6" aria-live="polite">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center rounded-full bg-cyan-400/20 border border-cyan-300/40 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-cyan-200">
                Mode: {current.label}
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-400/15 border border-emerald-300/30 px-3 py-1 text-xs font-semibold text-emerald-200">
                Sistem Aktif: {String(selectedBodySystemId).toUpperCase()}
              </span>
            </div>
            <p className="pt-1 text-sm sm:text-base font-medium leading-relaxed text-white/90">
              {current.description}
            </p>
          </div>
          <span className="shrink-0 rounded-xl border border-white/15 bg-white/[.05] px-3.5 py-2 text-xs font-semibold text-white/75">
            Atlas Klinis & Fisiologi Terpadu · Dukungan Keputusan Medis
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 text-left">
          <div className="rounded-2xl border border-white/10 bg-white/[.03] p-3.5">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-300/90">Fokus Spesialisasi & Anatomi</div>
            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-white/85">
              {selectedBodySystemId === 'cardiovascular' ? 'Kardiologi & BTKV: Hemodinamik koroner, katup jantung, gradien tekanan ventrikel, dan perfusi sistemik.' :
               selectedBodySystemId === 'respiratory' ? 'Pulmonologi & Kedokteran Respirasi: Ventilasi alveolar, difusi kapiler, gradien A-a, dan mekanika jalan napas.' :
               selectedBodySystemId === 'nervous' ? 'Neurologi & Bedah Saraf: Jaras kortikospinal, perfusi serebral, lokalisasi lesi, dan refleks batang otak.' :
               selectedBodySystemId === 'renal' || (selectedBodySystemId as string) === 'urinary' ? 'Nefrologi & Urologi: Filtrasi glomerulus (eGFR), ekskresi fraksional natrium (FENa), dan keseimbangan asam-basa.' :
               selectedBodySystemId === 'digestive' ? 'Gastroenterologi & Hepatologi: Sirkulasi portal-hepatik, motilitas traktus GI, fungsi sintesis hati, dan bilier.' :
               selectedBodySystemId === 'endocrine' ? 'Endokrinologi & Metabolisme: Aksis hipotalamus-hipofisis, homeostasis glukosa, kalsium, dan regulasi tiroid.' :
               'Integrasi Multiorgan: Evaluasi struktur anatomi, korelasi fisiologi seluler, dan lokalisasi klinis terarah.'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[.03] p-3.5">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-300/90">Parameter & Evaluasi Klinis</div>
            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-white/85">
              {selectedBodySystemId === 'cardiovascular' ? 'Auskultasi 4 katup, MAP, EKG 12-lead (QTc), troponin, ekokardiografi, serta stratifikasi risiko tromboemboli.' :
               selectedBodySystemId === 'respiratory' ? 'SpO2, laju napas, analisa gas darah (PaO2/FiO2), auskultasi paru, dan evaluasi efusi/konsolidasi.' :
               selectedBodySystemId === 'nervous' ? 'GCS, pemeriksaan saraf kranialis, kekuatan motorik/sensorik dermatom, dan skor risiko vaskular serebral.' :
               selectedBodySystemId === 'renal' || (selectedBodySystemId as string) === 'urinary' ? 'Kreatinin serum, produksi urin (mL/kg/jam), elektrolit urin/serum, osmolalitas, dan status volemik.' :
               selectedBodySystemId === 'digestive' ? 'Bilirubin, albumin, INR/PT, transaminase (SGOT/SGPT), skor keparahan sirosis & perdarahan GI.' :
               selectedBodySystemId === 'endocrine' ? 'GDS/GDP, HbA1c, keton darah, anion gap, kalsium terkoreksi albumin, dan fungsi tiroid (TSH/fT4).' :
               'Inspeksi топоgrafi, palpasi terarah, korelasi pencitraan multimodal, serta pemantauan tanda vital.'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[.03] p-3.5">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-300/90">Kalkulator Klinis C6 Terkait</div>
            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-white/85">
              {selectedBodySystemId === 'cardiovascular' ? 'MAP, QTc (Bazett/Fridericia), GRACE Score, TIMI Risk, CHA2DS2-VASc, HAS-BLED, Wells DVT/PE.' :
               selectedBodySystemId === 'respiratory' ? 'A-a O2 Gradient, NEWS2, SOFA Score, Wells PE, PERC Rule, Light’s Criteria, CURB-65.' :
               selectedBodySystemId === 'nervous' ? 'GCS, Siriraj Stroke Score, NIHSS, CHA2DS2-VASc, Ottawa Ankle/C-Spine Rules.' :
               selectedBodySystemId === 'renal' || (selectedBodySystemId as string) === 'urinary' ? 'Cockcroft-Gault CrCl, CKD-EPI eGFR, FENa, Serum Osmolality, Free Water Deficit.' :
               selectedBodySystemId === 'digestive' ? 'Child-Pugh Score, MELD-Na, Glasgow-Blatchford, Rockall Score, Ranson/BISAP, Maddrey DF.' :
               selectedBodySystemId === 'endocrine' ? 'Corrected Calcium (Albumin), Pediatric DKA Fluid/Insulin, FINDRISC, LDL Friedewald.' :
               'NEWS2, SOFA Score, Holliday-Segar Fluid, Ideal Body Weight, Serum Osmolality.'}
            </p>
          </div>
        </div>
      </div>

      <div ref={systemsRef} className="relative z-[2] mt-6 scroll-mt-6 space-y-5">
        <BodyExposurePatientOverlay selectedSystemId={selectedBodySystemId} onClinicalView={() => setActiveMode('clinical')} onShowStructure={(s) => { setSelectedBodySystemId(s.systemId); setStrukturDiminta((k) => ({ name: s.name, nonce: (k?.nonce ?? 0) + 1 })) }} />
        <SinyalPribadiDiTubuh selectedSystemId={selectedBodySystemId} onSelectSystem={setSelectedBodySystemId} />
        <Suspense fallback={<div className="grid min-h-56 place-items-center rounded-[28px] border border-white/[.08] bg-black/35 text-xs font-bold text-white/35">Loading unified human simulation projector…</div>}>
          <UnifiedHumanSimulationProjector
            selectedSystemId={selectedBodySystemId}
            onSystemChange={setSelectedBodySystemId}
            requestedDomain={current.projectorDomain}
            onDomainChange={syncModeFromProjector}
            requestedStructure={strukturDiminta}
          />
        </Suspense>
      </div>

      <Fold label="Multiscale" className="relative z-[2] mt-6">
        <Suspense fallback={null}>
          <PanelKoplingMultiSkala />
        </Suspense>
        <div className="mt-3">
          <Suspense fallback={null}>
            <PanelUbiquitin />
          </Suspense>
        </div>
      </Fold>

      <details open className="body-exposure-os__labs relative z-[1] mt-6 overflow-hidden rounded-[28px] border border-white/15 bg-black/50 shadow-xl">
        <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 px-6 py-3 text-sm sm:text-base font-bold text-white/90 transition hover:bg-white/[.04] hover:text-white">
          <span>Deep reference labs</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-200/80">Eksplorasi Mendalam Per Spesialisasi · Klik untuk Buka/Tutup</span>
        </summary>
        <div
          id="body-exposure-core"
          className="body-exposure-os__core border-t border-white/15 p-4 sm:p-6"
        >
          <BodyExplorer />
        </div>
      </details>
    </section>
  )
}

export default BodyExposureOS
