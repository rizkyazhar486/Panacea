import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { evaluateGtaCharacterPersonification } from '../../domains/character/index.ts'
import { evaluateFasciaKineticChain } from '../../domains/body-exposure/fasciaKineticChainEngine.ts'
import type { AnatomyLayer, CtWindow, MotionState, RenderMode } from '../bodyhub/Body3D'
import type { Vitals } from '../../lib/healthVitals'
import '../../styles/panaceaSpatialHud.css'

const LazyBody3D = lazy(() =>
  import('../bodyhub/Body3D').then((m) => ({ default: m.Body3D })),
)

const HOLO_CT_WINDOW: CtWindow = { key: 'soft', label: 'Soft tissue', width: 400, level: 40 }
const HOLO_MOTION_OFF: MotionState = { heartRate: 0, respRate: 0, contractionRate: 0, peristalsisRate: 0 }
const HOLO_MOTION_REST: MotionState = { heartRate: 70, respRate: 14, contractionRate: 0, peristalsisRate: 8 }

export interface HolographicTwinStageProps {
  readonly profileKey: string
  readonly mrn: string
  readonly vitals: Vitals
  readonly onRecordModeFocus?: () => void
}

interface DepthLayerTag {
  readonly code: '01' | '02' | '03' | '04' | '05' | '06' | '07'
  readonly label: string
  readonly body3dLayer: AnatomyLayer['key']
  readonly truthClass: 'curated_physiology' | 'simulated'
  readonly provenance: string
  readonly explanation: string
}

const DEPTH_LAYERS: readonly DepthLayerTag[] = [
  {
    code: '01',
    label: 'INTEGUMENT',
    body3dLayer: 'surface',
    truthClass: 'curated_physiology',
    provenance: 'Z-Anatomy CC BY-SA 4.0 · Surface Mesh',
    explanation: 'External cutaneous envelope governing thermoregulation, UV barrier integrity, and surface postural landmarks.',
  },
  {
    code: '02',
    label: 'FASCIA CHAIN',
    body3dLayer: 'muscular',
    truthClass: 'simulated',
    provenance: 'fasciaKineticChainEngine (non-osteogenesis biomechanical model)',
    explanation: 'Feet-to-face Superficial Front Line myofascial tension transfer from plantar arch through thoracic core to sternocleidomastoid and submental sling.',
  },
  {
    code: '03',
    label: 'MUSCULAR',
    body3dLayer: 'muscular',
    truthClass: 'curated_physiology',
    provenance: 'Z-Anatomy CC BY-SA 4.0 · Skeletal Muscle Nodes',
    explanation: 'Contractile skeletal muscle compartments driving metabolic glucose disposal, gait elastic recoil, and axial stability.',
  },
  {
    code: '04',
    label: 'SKELETAL',
    body3dLayer: 'skeletal',
    truthClass: 'curated_physiology',
    provenance: 'Z-Anatomy CC BY-SA 4.0 · Osteology Mesh',
    explanation: 'Load-bearing axial and appendicular scaffold providing structural alignment references and joint axes.',
  },
  {
    code: '05',
    label: 'CARDIOPULMONARY',
    body3dLayer: 'cardiovascular',
    truthClass: 'curated_physiology',
    provenance: 'Z-Anatomy CC BY-SA 4.0 · Vascular & Visceral Nodes',
    explanation: 'Coupled cardiac ejection, vascular pressure wave, and alveolar oxygen transport synchronized with resting HR and HRV.',
  },
  {
    code: '06',
    label: 'NEURO',
    body3dLayer: 'nervous',
    truthClass: 'curated_physiology',
    provenance: 'Z-Anatomy CC BY-SA 4.0 · Central & Peripheral Nerves',
    explanation: 'Autonomic vagal-sympathetic network and suprachiasmatic circadian hub orchestrating readiness and stress response.',
  },
  {
    code: '07',
    label: 'SUBCELLULAR',
    body3dLayer: 'visceral',
    truthClass: 'simulated',
    provenance: 'Panacea Bio-Kernel Mitochondrial Reference',
    explanation: 'Educational cellular-scale context illustrating mitochondrial ATP synthesis, membrane potential, and oxidative recovery balance.',
  },
]

function detectWebGlSupport(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function sendBody3dCamera(action: 'reset' | 'front' | 'back' | 'zoomIn' | 'zoomOut') {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('panacea:body3d-camera', { detail: { action } }))
}

export function HolographicTwinStage({
  profileKey,
  mrn,
  vitals,
}: HolographicTwinStageProps) {
  const [selectedCode, setSelectedCode] = useState<DepthLayerTag['code']>('02')
  const [pickedStructure, setPickedStructure] = useState<string | null>(null)
  const [playing, setPlaying] = useState(true)
  const [orbitStep, setOrbitStep] = useState<'front' | 'back'>('front')
  const [xrayMode, setXrayMode] = useState(false)
  const [webglCapable, setWebglCapable] = useState(false)
  const [useLive3dMesh, setUseLive3dMesh] = useState(false)

  useEffect(() => {
    setWebglCapable(detectWebGlSupport())
  }, [])

  const activeLayer = useMemo(
    () => DEPTH_LAYERS.find((l) => l.code === selectedCode) ?? DEPTH_LAYERS[1],
    [selectedCode],
  )

  const mountedLayers = useMemo(() => {
    const set = new Set<AnatomyLayer['key']>(['skeletal', activeLayer.body3dLayer])
    if (activeLayer.code === '05') set.add('visceral')
    return set
  }, [activeLayer])

  const persona = useMemo(
    () =>
      evaluateGtaCharacterPersonification({
        profileKey,
        mrn,
        heightCm: vitals.heightCm ?? 173,
        weightKg: vitals.weightKg ?? 68,
        bodyFatPct: vitals.bodyFatPct,
        restingHrBpm: vitals.restingHr ?? vitals.heartRate,
        hrvMs: vitals.hrvMs,
        vo2max: vitals.vo2max,
        dailySteps: vitals.steps,
        sleepHours: vitals.sleepH,
        posturalAlignment01: 0.76,
      }),
    [profileKey, mrn, vitals],
  )

  const fascia = useMemo(
    () =>
      evaluateFasciaKineticChain({
        plantarArchActivation01: 0.74,
        rotationalThoracicMobility01: 0.7,
        palatalTonguePosture01: 0.72,
        facialMyofascialRelease01: 0.68,
      }),
    [],
  )

  const renderMode: RenderMode = xrayMode ? 'xray' : 'anatomy'
  const motion = playing ? HOLO_MOTION_REST : HOLO_MOTION_OFF

  const cycleOrbit = () => {
    const next = orbitStep === 'front' ? 'back' : 'front'
    setOrbitStep(next)
    if (useLive3dMesh) sendBody3dCamera(next)
  }

  const resetStage = () => {
    setSelectedCode('02')
    setPickedStructure(null)
    setXrayMode(false)
    setOrbitStep('front')
    if (useLive3dMesh) sendBody3dCamera('reset')
  }

  return (
    <section aria-label="Holographic 3D Digital Twin Stage" className="panacea-spatial-hud p-4 sm:p-5">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          <div className="hud-micro-header text-cyan-300">
            HOLOGRAPHIC PROJECTION STAGE · PARAMETRIC DIGITAL TWIN
          </div>
          <h2 className="mt-0.5 text-base font-black text-white">
            Z-Anatomy 3D Projection Table &amp; Panacea AI Companion Guide
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="hud-pill border-cyan-400/40 text-cyan-200">
            LAYER {activeLayer.code} · {activeLayer.label}
          </span>
          <button
            type="button"
            onClick={() => setUseLive3dMesh((v) => !v)}
            disabled={!webglCapable}
            className={`hud-btn text-[10px] ${useLive3dMesh ? 'hud-btn-cyan' : ''}`}
          >
            {!webglCapable
              ? 'WEBGL FALLBACK ACTIVE'
              : useLive3dMesh
                ? '3D Z-ANATOMY MESH: LIVE'
                : 'LOAD 3D Z-ANATOMY MESH'}
          </button>
        </div>
      </header>

      {/* Main 3-Column Spatial Stage: Left Layer Rail | Center Holo Ring | Right AI Guide */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[200px_1fr_300px]">
        {/* Left Depth-Layer Selector Rail (01–07) */}
        <nav aria-label="Anatomical Depth Layers 01 to 07" className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-1">
          {DEPTH_LAYERS.map((layer) => {
            const active = layer.code === selectedCode
            return (
              <button
                key={layer.code}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setSelectedCode(layer.code)
                  setPickedStructure(null)
                }}
                className={`hud-btn justify-start px-2.5 text-left text-[10px] ${
                  active ? 'hud-btn-cyan border-cyan-400 text-white' : ''
                }`}
              >
                <span className="font-mono font-black text-cyan-300">{layer.code}</span>
                <span className="truncate">{layer.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Center Holographic Projection Ring & Model */}
        <div className="hud-holo-stage relative flex min-h-[380px] flex-col justify-between p-3 sm:min-h-[430px]">
          <div className="flex items-center justify-between gap-2">
            <span className="hud-pill border-cyan-400/35 text-cyan-200">
              {useLive3dMesh ? 'THREE.JS Z-ANATOMY LIVE' : 'HOLOGRAPHIC WIREFRAME FALLBACK'}
            </span>
            <span className="font-mono text-[10px] uppercase text-slate-300">
              ORBIT: {orbitStep.toUpperCase()} · {xrayMode ? 'X-RAY' : 'ANATOMY'}
            </span>
          </div>

          {/* 3D Viewport or Holographic SVG Silhouette Fallback */}
          <div className="relative my-2 flex flex-1 items-center justify-center">
            {useLive3dMesh && webglCapable ? (
              <div className="relative h-[300px] w-full overflow-hidden rounded-xl sm:h-[330px]">
                <Suspense
                  fallback={
                    <div className="grid h-full place-items-center font-mono text-xs text-cyan-200">
                      PROJECTING Z-ANATOMY MESH…
                    </div>
                  }
                >
                  <LazyBody3D
                    layers={mountedLayers}
                    highlighted={pickedStructure ? [pickedStructure] : []}
                    focusKeywords={[]}
                    renderMode={renderMode}
                    ctWindow={HOLO_CT_WINDOW}
                    slicePlane="none"
                    slicePos={0.5}
                    motion={motion}
                    unfold={0}
                    dissect={0}
                    onPick={(rawName, label) => setPickedStructure(label || rawName)}
                    stageClassName="relative h-full w-full overflow-hidden"
                  />
                </Suspense>
              </div>
            ) : (
              <svg
                viewBox="0 0 260 300"
                className="h-[290px] w-full max-w-[260px]"
                role="img"
                aria-label={`Holographic digital twin silhouette highlighting ${activeLayer.label}`}
              >
                <defs>
                  <linearGradient id="holoBeam" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.34" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Upward projection cone */}
                <polygon points="48,274 212,274 176,34 84,34" fill="url(#holoBeam)" />

                {/* Parametric anatomical wireframe silhouette */}
                <g
                  fill={xrayMode ? 'none' : 'rgba(34,211,238,0.09)'}
                  stroke={xrayMode ? '#f8fafc' : '#38bdf8'}
                  strokeWidth={xrayMode ? '1.2' : '1.6'}
                  transform={orbitStep === 'back' ? 'translate(260, 0) scale(-1, 1)' : undefined}
                >
                  {/* Cranium */}
                  <ellipse cx="130" cy="46" rx="19" ry="23" />
                  {/* Cervical neck & clavicular line */}
                  <path d="M120 68 L120 82 L88 94 L72 152 L84 156 L98 112 L104 166 L98 248 L114 252 L124 182 L136 182 L146 252 L162 248 L156 166 L162 112 L176 156 L188 152 L172 94 L140 82 L140 68" />
                </g>

                {/* Active layer reticle highlight */}
                {selectedCode === '02' && (
                  <path
                    d="M130 68 L130 164 M130 164 L112 248 M130 164 L148 248"
                    stroke="#10b981"
                    strokeWidth="2.4"
                    strokeDasharray="4 4"
                  />
                )}
                {selectedCode === '05' && (
                  <circle cx="134" cy="116" r="14" fill="rgba(255,45,70,0.28)" stroke="#ff2d46" strokeWidth="2" />
                )}
                {selectedCode === '06' && (
                  <path d="M130 44 L130 176" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="3 3" />
                )}
                {selectedCode === '07' && (
                  <circle cx="130" cy="136" r="24" fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="6 4" className="hud-orbit-slow" />
                )}

                {/* Floor holographic concentric rings */}
                <ellipse cx="130" cy="272" rx="88" ry="18" fill="none" stroke="#22d3ee" strokeOpacity="0.6" strokeWidth="1.4" />
                <ellipse cx="130" cy="272" rx="64" ry="12" fill="none" stroke="#38bdf8" strokeOpacity="0.45" strokeDasharray="5 5" />
              </svg>
            )}
            <div className="hud-holo-pedestal-ring" aria-hidden="true" />
          </div>

          {/* Interactive Stage Controls Dock */}
          <div className="relative z-10 flex flex-wrap items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-black/75 p-2 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setUseLive3dMesh((v) => (webglCapable ? !v : false))}
              className="hud-btn min-h-[44px] px-2.5 text-[10px]"
            >
              STAGE: {useLive3dMesh ? '3D' : 'HOLO'}
            </button>
            <button
              type="button"
              onClick={() => setPlaying((v) => !v)}
              className={`hud-btn min-h-[44px] px-2.5 text-[10px] ${playing ? 'hud-btn-emerald' : ''}`}
            >
              {playing ? 'PAUSE' : 'PLAY'}
            </button>
            <button
              type="button"
              onClick={cycleOrbit}
              className="hud-btn hud-btn-cyan min-h-[44px] px-2.5 text-[10px]"
            >
              360° ORBIT
            </button>
            <button
              type="button"
              onClick={resetStage}
              className="hud-btn min-h-[44px] px-2.5 text-[10px]"
            >
              RESET
            </button>
            <button
              type="button"
              onClick={() => setXrayMode((v) => !v)}
              aria-pressed={xrayMode}
              className={`hud-btn min-h-[44px] px-2.5 text-[10px] ${xrayMode ? 'hud-btn-active' : ''}`}
            >
              LAYER X-RAY
            </button>
          </div>
        </div>

        {/* Right Panacea AI Guide Companion Panel */}
        <aside aria-label="Panacea AI Companion Guide" className="hud-frame hud-frame-cyan flex flex-col justify-between p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="hud-micro-header text-cyan-300">PANACEA AI GUIDE · COMPANION</span>
              <span className="font-mono text-[9px] uppercase text-amber-300">{activeLayer.truthClass}</span>
            </div>

            <div className="rounded-lg border border-cyan-400/25 bg-cyan-950/25 p-3">
              <div className="font-mono text-[10px] font-bold text-cyan-200 uppercase">
                {pickedStructure ? `STRUCTURE: ${pickedStructure}` : `DEPTH ${activeLayer.code} · ${activeLayer.label}`}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-200">
                {activeLayer.explanation}
              </p>
              <div className="mt-2 font-mono text-[10px] text-slate-400">
                Provenance: {activeLayer.provenance}
              </div>
            </div>

            {/* GTA 6 Core Status */}
            {persona.ok && (
              <div className="rounded-lg border border-white/10 bg-black/45 p-3">
                <div className="flex items-center justify-between gap-1">
                  <span className="hud-micro-header">GTA 6 CORE STATUS</span>
                  <span className="font-mono text-[9px] uppercase text-amber-300">{persona.truthClass}</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="hud-kpi-value text-sm font-black text-emerald-300">{persona.cores.healthCore}</div>
                    <div className="font-mono text-[9px] text-slate-400">HEALTH</div>
                  </div>
                  <div>
                    <div className="hud-kpi-value text-sm font-black text-cyan-300">{persona.cores.staminaCore}</div>
                    <div className="font-mono text-[9px] text-slate-400">STAMINA</div>
                  </div>
                  <div>
                    <div className="hud-kpi-value text-sm font-black text-amber-300">{persona.cores.focusCore}</div>
                    <div className="font-mono text-[9px] text-slate-400">FOCUS</div>
                  </div>
                </div>
              </div>
            )}

            {/* Fascia Kinetic Alignment Status */}
            <div className="rounded-lg border border-emerald-400/20 bg-emerald-950/20 p-3">
              <div className="flex items-center justify-between gap-1">
                <span className="hud-micro-header text-emerald-300">FASCIA KINETIC CHAIN</span>
                <span className="font-mono text-[9px] uppercase text-amber-300">{fascia.truthClass}</span>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <span className="text-xs font-bold text-white uppercase">{fascia.regime}</span>
                <span className="hud-kpi-value text-xs font-bold text-emerald-300">
                  Recoil {fascia.metrics.gaitElasticRecoilEfficiencyPct}% · Arch {fascia.metrics.plantarArchStabilityPct}%
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-amber-400/30 bg-amber-500/10 p-2.5 font-mono text-[10px] leading-snug text-amber-200">
            Educational / technical output · Not clinician-reviewed or clinically validated. Confirm clinical decisions with a licensed physician.
          </div>
        </aside>
      </div>
    </section>
  )
}
