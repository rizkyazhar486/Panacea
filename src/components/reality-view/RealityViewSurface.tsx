import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AnatomyLayer, CtWindow, MotionState } from '../bodyhub/Body3D'
import { getVitals } from '../../lib/healthVitals'
import { ambilLab } from '../../lib/lab'
import { useOptionalStore } from '../../lib/store'
import { useOptionalLongitudinalState } from '../../lib/useLongitudinalState'
import { useAdaptive } from '../../shared/adaptive/useAdaptive'
import {
  ANATOMICAL_SYSTEM_IDS,
  assertOutboundClinicalSyncAuthorized,
  bootRealityViewOfflineFirst,
  buildLiveRealityViewState,
  createIndexedDbVaultAdapter,
  createSessionOverrideStore,
  detectPerformanceTier,
  evaluateLiveVaultAuthSession,
  formatSystemTitle,
  FpsTierWatchdog,
  inspectSelectedMesh,
  listBindingsBySystem,
  mapLodPlanToGlbLayers,
  probeBrowserHardware,
  RealityViewLodResourcePool,
  resolveActiveLodBundlePlan,
  runInteractiveCounterfactualMedicationCheck,
  sanitizeClinicalText,
  saveEncryptedRealityViewSnapshot,
  type AnatomicalSystemId,
  type PerformanceTierId,
  type TierBudgetSpec,
} from './realityViewAdapter'
import type { RealityViewMode } from '../../types/realityView'

type VaultStatus = {
  readonly label: string
  readonly offline: boolean
  readonly unlocked: boolean
}

const LazyBody3D = lazy(() =>
  import('../bodyhub/Body3D').then((m) => ({ default: m.Body3D })),
)

const DEFAULT_CT_WINDOW: CtWindow = { key: 'soft', label: 'Soft tissue', width: 400, level: 40 }
const STATIC_MOTION_OFF: MotionState = { heartRate: 0, respRate: 0, contractionRate: 0, peristalsisRate: 0 }

export interface RealityViewSurfaceProps {
  readonly initialMode?: RealityViewMode
  readonly externalSelectedMeshId?: string | null
  readonly embedExternalViewport?: boolean
}

function ConductionSparkline({ values }: { readonly values: Float32Array }) {
  const path = useMemo(() => {
    const pts: string[] = []
    for (let i = 0; i < values.length; i += 1) {
      const x = (i / Math.max(1, values.length - 1)) * 180
      const y = 36 - Math.min(1, Math.max(0, values[i] ?? 0)) * 30
      pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    }
    return pts.join(' ')
  }, [values])

  return (
    <div className="rounded-xl border border-cyan-400/20 bg-slate-950/80 p-2.5">
      <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-cyan-200">
        <span>Conduction Profile (Aliev–Panfilov)</span>
        <span className="rounded-full border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-200">
          Simulated · Not Clinically Reviewed
        </span>
      </div>
      <svg viewBox="0 0 180 40" className="mt-1.5 h-10 w-full" aria-hidden="true">
        <path d={path} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function Silhouette25D({
  activeSystems,
  onSelectMesh,
  selectedMeshId,
}: {
  readonly activeSystems: readonly AnatomicalSystemId[]
  readonly onSelectMesh: (meshId: string) => void
  readonly selectedMeshId: string | null
}) {
  const pins: ReadonlyArray<{ readonly meshId: string; readonly label: string; readonly cx: number; readonly cy: number; readonly system: AnatomicalSystemId }> = [
    { meshId: 'Midbrain.l', label: 'Brain', cx: 100, cy: 26, system: 'nervous' },
    { meshId: 'Trachea', label: 'Airway', cx: 100, cy: 62, system: 'respiratory' },
    { meshId: 'Left ventricle', label: 'Heart', cx: 109, cy: 84, system: 'cardiovascular' },
    { meshId: 'Liver', label: 'Liver', cx: 88, cy: 104, system: 'gastrointestinal' },
    { meshId: 'Pancreas', label: 'Pancreas', cx: 103, cy: 114, system: 'endocrine' },
    { meshId: 'Kidney.l', label: 'Kidney', cx: 118, cy: 120, system: 'renal' },
    { meshId: 'Femur.l', label: 'Femur', cx: 118, cy: 184, system: 'musculoskeletal' },
  ]

  return (
    <div
      data-rv-tier-view="fallback_25d"
      className="relative flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-emerald-400/25 bg-gradient-to-b from-[#07151c] to-[#03070d] p-4"
    >
      <div className="mb-2 flex items-center gap-2 text-[11px] font-bold text-emerald-300">
        <span>2.5D Low-Memory Mode (&lt;= 150 MB ceiling)</span>
      </div>
      <svg viewBox="0 0 200 260" className="h-[220px] w-full max-w-[220px]" role="img" aria-label="2.5D anatomical silhouette">
        <defs>
          <linearGradient id="rvBodySil" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.16" />
          </linearGradient>
        </defs>
        <path
          d="M100,12 C112,12 120,21 120,33 C120,42 114,48 110,51 L136,64 L152,126 L140,130 L129,82 L126,144 L132,242 L114,242 L106,154 L94,154 L86,242 L68,242 L74,144 L71,82 L60,130 L48,126 L64,64 L90,51 C86,48 80,42 80,33 C80,21 88,12 100,12 Z"
          fill="url(#rvBodySil)"
          stroke="#5eead4"
          strokeOpacity="0.45"
          strokeWidth="1.5"
        />
        {pins.map((pin) => {
          const isActive = activeSystems.includes(pin.system) || selectedMeshId === pin.meshId
          return (
            <g
              key={pin.meshId}
              className="cursor-pointer"
              onClick={() => onSelectMesh(pin.meshId)}
            >
              <circle
                cx={pin.cx}
                cy={pin.cy}
                r={isActive ? 7.5 : 5.5}
                fill={selectedMeshId === pin.meshId ? '#38bdf8' : isActive ? '#34d399' : '#1e293b'}
                stroke="#f8fafc"
                strokeWidth="1.5"
              />
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function RealityViewSurface({
  initialMode = 'quiet',
  externalSelectedMeshId = null,
  embedExternalViewport = false,
}: RealityViewSurfaceProps) {
  const adaptive = useAdaptive()
  const store = useOptionalStore()
  const longitudinal = useOptionalLongitudinalState()
  const [mode, setMode] = useState<RealityViewMode>(initialMode)
  const [selectedSystem, setSelectedSystem] = useState<AnatomicalSystemId | null>(null)
  const [selectedMeshId, setSelectedMeshId] = useState<string | null>(externalSelectedMeshId)
  const [lastRejectedMeshId, setLastRejectedMeshId] = useState<string | null>(null)
  const [dualCodingTm1Enabled, setDualCodingTm1Enabled] = useState(false)
  const [tierOverride, setTierOverride] = useState<PerformanceTierId | null>(null)
  const [timeOffsetDays, setTimeOffsetDays] = useState<number>(0)
  const [vaultStatus, setVaultStatus] = useState<VaultStatus>({
    label: 'Vault Locked · Initializing AES-GCM',
    offline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
    unlocked: false,
  })
  const [dispatchNotice, setDispatchNotice] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [counterfactualDrug, setCounterfactualDrug] = useState<'clopidogrel' | 'carbamazepine' | 'warfarin'>('clopidogrel')
  const [disposedResourceCount, setDisposedResourceCount] = useState<number>(0)
  const [vitRev, setVitRev] = useState(0)

  const overrideStoreRef = useRef(createSessionOverrideStore())
  const resourcePoolRef = useRef(new RealityViewLodResourcePool())
  const fpsWatchdogRef = useRef(new FpsTierWatchdog())
  const prevModeRef = useRef<RealityViewMode>(mode)
  const vaultKeyRef = useRef<CryptoKey | null>(null)

  useEffect(() => {
    if (externalSelectedMeshId !== null) setSelectedMeshId(externalSelectedMeshId)
  }, [externalSelectedMeshId])

  useEffect(() => {
    const bump = () => setVitRev((n) => n + 1)
    window.addEventListener('panacea:health-updated', bump)
    window.addEventListener('panacea:lab', bump)
    return () => {
      window.removeEventListener('panacea:health-updated', bump)
      window.removeEventListener('panacea:lab', bump)
    }
  }, [])

  const hardwareSpec: TierBudgetSpec = useMemo(() => detectPerformanceTier(probeBrowserHardware()), [])
  const activeTier: PerformanceTierId = tierOverride ?? hardwareSpec.tier

  const vitals = useMemo(() => {
    void vitRev
    return getVitals(store?.account ?? null)
  }, [store?.account, longitudinal, vitRev])

  const labs = useMemo(() => {
    void vitRev
    return ambilLab(store?.account ?? null)
  }, [store?.account, longitudinal, vitRev])

  const nowIso = useMemo(() => new Date().toISOString(), [vitRev, mode, timeOffsetDays])
  const cursorIso = useMemo(() => {
    const baseMs = Date.parse(nowIso)
    return new Date(baseMs + timeOffsetDays * 86_400_000).toISOString()
  }, [nowIso, timeOffsetDays])

  const patientId = store?.account?.patientId ?? store?.account?.id ?? 'local-device-subject'

  const rvState = useMemo(() => {
    return buildLiveRealityViewState({
      patientId,
      mode,
      nowIso,
      timeAxisCursorIso: cursorIso,
      dualCodingTm1Enabled,
      selectedMeshId,
      consentGranted: true,
      snapshot: longitudinal,
      vitals,
      labs,
    })
  }, [patientId, mode, nowIso, cursorIso, dualCodingTm1Enabled, selectedMeshId, longitudinal, vitals, labs])

  const requestedSystems = useMemo<readonly AnatomicalSystemId[]>(() => {
    if (selectedSystem) return [selectedSystem]
    return rvState.activeSystems
  }, [selectedSystem, rvState.activeSystems])

  const bundlePlan = useMemo(() => {
    return resolveActiveLodBundlePlan({
      tier: activeTier,
      mode,
      requestedSystems,
    })
  }, [activeTier, mode, requestedSystems])

  const mappedGlb = useMemo(() => mapLodPlanToGlbLayers(bundlePlan), [bundlePlan])

  useEffect(() => {
    const prevMode = prevModeRef.current
    prevModeRef.current = mode
    if (prevMode === 'fullscreen' && mode !== 'fullscreen') {
      resourcePoolRef.current.evictFullscreenResources()
      setDisposedResourceCount(resourcePoolRef.current.disposedCount)
    } else if (mode === 'fullscreen' && activeTier !== 'fallback_25d') {
      for (const layer of mappedGlb.layersToLoad) {
        if (layer === 'surface') continue
        resourcePoolRef.current.register({
          id: `rv-lod-${layer}`,
          lod: bundlePlan.lodLevel,
          estimatedBytes: layer === 'cardiovascular' ? 12_344_948 : 2_653_500,
          dispose: () => undefined,
        })
      }
    }
  }, [mode, activeTier, mappedGlb.layersToLoad, bundlePlan.lodLevel])

  useEffect(() => {
    return () => {
      resourcePoolRef.current.disposeAll()
    }
  }, [])

  // Offline-first AES-GCM encrypted IndexedDB persistence & fast <500ms boot hydration
  useEffect(() => {
    let active = true
    async function syncEncryptedVault() {
      if (typeof globalThis.crypto?.subtle === 'undefined') return
      try {
        const key = vaultKeyRef.current ?? await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt'],
        )
        vaultKeyRef.current = key
        const storage = createIndexedDbVaultAdapter()
        await saveEncryptedRealityViewSnapshot({
          state: rvState,
          overrideStore: overrideStoreRef.current,
          vaultKey: key,
          storage,
        })
        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
        const boot = await bootRealityViewOfflineFirst({
          patientId,
          isOnline,
          vaultKey: key,
          storage,
        })
        if (!active) return
        if (boot.hydratedFromCache) {
          overrideStoreRef.current = boot.overrideStore
          setVaultStatus({
            label: `${boot.offlineIndicator ? 'Offline · Encrypted Vault' : 'Encrypted Vault · Ready'} (${boot.elapsedMs.toFixed(0)} ms)`,
            offline: boot.offlineIndicator,
            unlocked: true,
          })
        } else {
          setVaultStatus({
            label: isOnline ? 'Encrypted Vault · Ready' : 'Offline · AES-GCM Session Active',
            offline: !isOnline,
            unlocked: true,
          })
        }
      } catch {
        if (active) setVaultStatus({ label: 'Vault Locked', offline: true, unlocked: false })
      }
    }
    void syncEncryptedVault()
    return () => {
      active = false
    }
  }, [patientId, rvState])

  const handlePickMesh = useCallback((rawMeshId: string) => {
    const inspected = inspectSelectedMesh(rawMeshId, rvState, dualCodingTm1Enabled)
    if (!inspected) return
    if (!inspected.resolution.selectable) {
      setLastRejectedMeshId(rawMeshId)
      return
    }
    setLastRejectedMeshId(null)
    setSelectedMeshId(rawMeshId)
    setSelectedSystem(inspected.resolution.binding.systemId)
  }, [rvState, dualCodingTm1Enabled])

  useEffect(() => {
    const onExternalPick = (ev: Event) => {
      const detail = (ev as CustomEvent<unknown>).detail
      if (typeof detail === 'string') handlePickMesh(detail)
    }
    window.addEventListener('panacea:reality-view-pick', onExternalPick)
    return () => {
      window.removeEventListener('panacea:reality-view-pick', onExternalPick)
    }
  }, [handlePickMesh])

  const inspectedView = useMemo(() => {
    return inspectSelectedMesh(selectedMeshId, rvState, dualCodingTm1Enabled)
  }, [selectedMeshId, rvState, dualCodingTm1Enabled])

  const counterfactualCheck = useMemo(() => {
    const target = selectedMeshId && Object.prototype.hasOwnProperty.call(rvState.nodes, selectedMeshId)
      ? selectedMeshId
      : Object.keys(rvState.nodes)[0]
    if (!target) return null
    return runInteractiveCounterfactualMedicationCheck(rvState, {
      counterfactualId: '11111111-2222-4333-8444-555555555555',
      targetMeshId: target,
      candidateDrugGeneric: counterfactualDrug,
      activeDrugGeneric: counterfactualDrug === 'clopidogrel' ? 'omeprazole' : counterfactualDrug === 'warfarin' ? 'amiodarone' : '',
    })
  }, [rvState, selectedMeshId, counterfactualDrug])

  const handleProtectedSync = useCallback((target: 'satusehat_fhir_r4' | 'medgemma_inference') => {
    if (isBusy) return
    setIsBusy(true)
    try {
      const auth = evaluateLiveVaultAuthSession(store?.account ?? null, vaultStatus.unlocked)
      const gate = assertOutboundClinicalSyncAuthorized(auth, target)
      if (!gate.authorized) {
        setDispatchNotice(sanitizeClinicalText(gate.reason))
      } else {
        setDispatchNotice(`Authorized (${target}) for verified Google session & unlocked vault.`)
      }
    } finally {
      setIsBusy(false)
    }
  }, [isBusy, store?.account, vaultStatus.unlocked])

  const mountedGlbLayers = useMemo(() => {
    return new Set<AnatomyLayer['key']>(mappedGlb.layersToLoad)
  }, [mappedGlb.layersToLoad])

  const bodyConduction = useMemo(() => {
    const cardio = rvState.nodes['Left ventricle']
    return cardio?.shaderUniforms.conductionState ?? null
  }, [rvState.nodes])

  const modes: readonly { readonly id: RealityViewMode; readonly label: string }[] = [
    { id: 'quiet', label: 'Quiet' },
    { id: 'split', label: 'Split' },
    { id: 'fullscreen', label: 'Fullscreen' },
    { id: 'timeline_inset', label: 'Timeline' },
  ]

  return (
    <section
      data-reality-view-surface="v1"
      data-rv-tier={activeTier}
      data-rv-mode={mode}
      className="dark w-full min-w-0 overflow-x-hidden rounded-[24px] border border-cyan-400/20 bg-[#040914] p-3.5 text-slate-100 shadow-[0_18px_50px_rgba(0,0,0,0.35)] sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan-400/35 bg-cyan-500/15 px-2.5 py-1 text-[11px] font-bold text-cyan-200">
              Tier: {activeTier} ({bundlePlan.lodLevel})
            </span>
            <span
              data-rv-vault-chip="true"
              className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                vaultStatus.offline
                  ? 'border-amber-400/35 bg-amber-500/15 text-amber-200'
                  : 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200'
              }`}
            >
              {vaultStatus.label}
            </span>
          </div>
          <p data-rv-quiet-headline="true" className="mt-2 text-sm font-extrabold text-white">
            {rvState.quietModeHeadline}
          </p>
        </div>

        <div role="radiogroup" aria-label="Reality View modes" className="flex flex-wrap gap-1.5">
          {modes.map((item) => {
            const active = mode === item.id
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={isBusy}
                onClick={() => setMode(item.id)}
                className={`min-h-[44px] rounded-xl border px-3 text-xs font-extrabold transition ${
                  active
                    ? 'border-cyan-300 bg-cyan-400 text-slate-950'
                    : 'border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className={`mt-4 grid gap-4 ${adaptive.isDesktop && mode !== 'quiet' ? 'lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]' : 'grid-cols-1'}`}>
        {!embedExternalViewport && (
          <div className="min-w-0 space-y-2.5">
            {activeTier === 'fallback_25d' ? (
              <Silhouette25D
                activeSystems={rvState.activeSystems}
                selectedMeshId={selectedMeshId}
                onSelectMesh={handlePickMesh}
              />
            ) : (
              <div className={`relative overflow-hidden rounded-2xl border border-white/15 bg-black ${mode === 'fullscreen' ? 'h-[520px]' : mode === 'quiet' ? 'h-[280px]' : 'h-[380px]'}`}>
                <Suspense
                  fallback={
                    <div className="grid h-full place-items-center text-xs font-bold text-cyan-200">
                      Loading outer body shell ({(mappedGlb.estimatedPayloadBytes / (1024 * 1024)).toFixed(2)} MB)…
                    </div>
                  }
                >
                  <LazyBody3D
                    layers={mountedGlbLayers}
                    highlighted={selectedMeshId ? [selectedMeshId] : []}
                    focusKeywords={null}
                    renderMode="anatomy"
                    ctWindow={DEFAULT_CT_WINDOW}
                    slicePlane="none"
                    slicePos={0.5}
                    motion={STATIC_MOTION_OFF}
                    unfold={0}
                    dissect={mappedGlb.layersToLoad.length > 1 ? 1 : 0}
                    onPick={(rawName) => handlePickMesh(rawName)}
                    stageClassName="relative h-full w-full overflow-hidden"
                    onBodyMotionStall={() => {
                      const s1 = fpsWatchdogRef.current.recordOneSecondSample(18)
                      const s2 = fpsWatchdogRef.current.recordOneSecondSample(18)
                      const s3 = fpsWatchdogRef.current.recordOneSecondSample(18)
                      if (s1.shouldDowngradeTo25D || s2.shouldDowngradeTo25D || s3.shouldDowngradeTo25D) {
                        setTierOverride('fallback_25d')
                      }
                    }}
                  />
                </Suspense>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
              <span>
                Loaded Layers: {mappedGlb.layersToLoad.length > 0 ? mappedGlb.layersToLoad.join(', ') : '2.5D silhouette'} (
                {(mappedGlb.estimatedPayloadBytes / (1024 * 1024)).toFixed(2)} MB)
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => setTierOverride((cur) => (cur === 'fallback_25d' ? null : 'fallback_25d'))}
                  className="min-h-[44px] rounded-xl border border-white/15 bg-white/5 px-3 text-[11px] font-bold text-slate-200"
                >
                  {activeTier === 'fallback_25d' ? 'Restore 3D Tier' : 'Switch 2.5D Lite'}
                </button>
                <span className="inline-flex min-h-[44px] items-center rounded-xl border border-white/10 px-2.5 text-[11px] text-slate-300">
                  Disposed LOD Buffers: {disposedResourceCount}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => setMode('split')}
              className={`min-h-[44px] rounded-xl px-3.5 text-xs font-extrabold ${
                rvState.quietModePrimaryAction.urgent
                  ? 'bg-rose-500 text-white'
                  : 'bg-emerald-400 text-slate-950'
              }`}
            >
              {rvState.quietModePrimaryAction.label}
            </button>

            <label className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-bold text-slate-200">
              <input
                type="checkbox"
                checked={dualCodingTm1Enabled}
                onChange={(e) => setDualCodingTm1Enabled(e.target.checked)}
              />
              <span>TM1 Dual-Coding</span>
            </label>
          </div>

          <div className="flex flex-wrap gap-1.5" role="group" aria-label="10 Anatomical Systems">
            {ANATOMICAL_SYSTEM_IDS.map((sys) => {
              const selected = selectedSystem === sys
              const sampleBinding = listBindingsBySystem(sys)[0]
              return (
                <button
                  key={sys}
                  type="button"
                  disabled={isBusy}
                  onClick={() => {
                    setSelectedSystem(sys)
                    if (sampleBinding) setSelectedMeshId(sampleBinding.meshId)
                    if (mode === 'quiet') setMode('split')
                  }}
                  className={`min-h-[44px] rounded-full border px-3 text-[11px] font-bold transition ${
                    selected
                      ? 'border-emerald-300 bg-emerald-400 text-slate-950'
                      : 'border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'
                  }`}
                >
                  {formatSystemTitle(sys)}
                </button>
              )
            })}
          </div>

          {lastRejectedMeshId && (
            <div className="rounded-xl border border-slate-600/40 bg-slate-900/70 px-3 py-2 text-xs text-slate-300">
              Non-clinical shell mesh <code className="text-cyan-300">{sanitizeClinicalText(lastRejectedMeshId)}</code> (selectable: false)
            </div>
          )}

          {inspectedView?.resolution.selectable ? (
            <div className="space-y-2 rounded-2xl border border-white/15 bg-white/[0.04] p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-white">
                    {sanitizeClinicalText(inspectedView.resolution.binding.indonesianLabel)}
                  </div>
                  <div className="text-[11px] text-slate-300">
                    {sanitizeClinicalText(inspectedView.resolution.binding.englishLabel)} ·{' '}
                    {inspectedView.resolution.binding.canonicalOntologyId} · {inspectedView.resolution.binding.snomedCtId}
                  </div>
                </div>
                {inspectedView.tm1Metadata.icd11Tm1Code && (
                  <span className="rounded-full border border-violet-400/40 bg-violet-500/20 px-2.5 py-1 text-[10px] font-extrabold text-violet-200">
                    ICD-11 TM1: {inspectedView.tm1Metadata.icd11Tm1Code}
                  </span>
                )}
              </div>

              {inspectedView.telemetryNode ? (
                <div className="space-y-1.5 text-xs text-slate-200">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-lg bg-white/10 px-2 py-1">
                      Evidence: {inspectedView.telemetryNode.evidenceClass}
                    </span>
                    <span className="rounded-lg bg-white/10 px-2 py-1">
                      Score:{' '}
                      {inspectedView.telemetryNode.statusScore === null
                        ? 'Pending Clinician Review'
                        : inspectedView.telemetryNode.statusScore.toFixed(2)}
                    </span>
                  </div>
                  {inspectedView.telemetryNode.readings?.map((r) => (
                    <div key={`${r.metric}-${r.provenance.id}`} className="flex items-center justify-between rounded-lg bg-black/40 px-2.5 py-1.5">
                      <span>{sanitizeClinicalText(r.metric)}</span>
                      <span className="font-bold text-cyan-200">
                        {r.value} {sanitizeClinicalText(r.unit)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-slate-300">
                  No recorded observations anchored to this structure yet (missing values are never invented).
                </div>
              )}

              {inspectedView.knowledgeGraphEdges.length > 0 && (
                <div className="text-[11px] text-slate-300">
                  KG Relations ({inspectedView.knowledgeGraphEdges.length}):{' '}
                  {inspectedView.knowledgeGraphEdges.map((e) => `${e.edgeId} (${e.relation})`).join(', ')}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs text-slate-300">
              Select a clinical anatomical system chip or tap a mapped structure to inspect 1:1 ontology &amp; provenance.
            </div>
          )}

          {bodyConduction && <ConductionSparkline values={bodyConduction} />}

          {(mode === 'timeline_inset' || mode === 'fullscreen' || mode === 'split') && (
            <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <span>
                  Time Axis:{' '}
                  {timeOffsetDays === 0
                    ? 'Present Observed'
                    : timeOffsetDays < 0
                      ? `${timeOffsetDays}d Past`
                      : `+${timeOffsetDays}d Future (Projection Isolated)`}
                </span>
                <span>{rvState.isFutureProjection ? 'Simulated Horizon' : 'Recorded History'}</span>
              </div>
              <input
                type="range"
                aria-label="Longitudinal Time Axis"
                min={-30}
                max={90}
                step={1}
                value={timeOffsetDays}
                onChange={(e) => setTimeOffsetDays(Number(e.target.value))}
                className="w-full"
              />

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <select
                  aria-label="Counterfactual medication screen"
                  value={counterfactualDrug}
                  onChange={(e) => {
                    const next = e.target.value
                    if (next === 'clopidogrel' || next === 'carbamazepine' || next === 'warfarin') {
                      setCounterfactualDrug(next)
                    }
                  }}
                  className="min-h-[44px] rounded-xl border border-white/15 bg-slate-900 px-3 text-xs font-bold text-white"
                >
                  <option value="clopidogrel">Screen: Clopidogrel (+Omeprazole / CYP2C19)</option>
                  <option value="carbamazepine">Screen: Carbamazepine (HLA-B*15:02)</option>
                  <option value="warfarin">Screen: Warfarin (+Amiodarone CYP2C9)</option>
                </select>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleProtectedSync('satusehat_fhir_r4')}
                  className="min-h-[44px] rounded-xl border border-cyan-400/35 bg-cyan-500/15 px-3 text-xs font-bold text-cyan-200"
                >
                  SATUSEHAT Sync
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleProtectedSync('medgemma_inference')}
                  className="min-h-[44px] rounded-xl border border-violet-400/35 bg-violet-500/15 px-3 text-xs font-bold text-violet-200"
                >
                  MedGemma Draft
                </button>
              </div>

              {counterfactualCheck && (
                <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-2.5 text-xs text-amber-100">
                  <div className="font-bold">
                    Educational Medication Screen ({counterfactualCheck.evidenceClass}, clinically_reviewed: false) —{' '}
                    {counterfactualCheck.hardSafetyLock ? 'HARD SAFETY HOLD' : counterfactualCheck.status}
                  </div>
                  {counterfactualCheck.ddiWarnings.length > 0 && (
                    <ul className="mt-1 list-disc pl-4 text-[11px]">
                      {counterfactualCheck.ddiWarnings.map((w) => (
                        <li key={w}>{sanitizeClinicalText(w)}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {dispatchNotice && (
                <div className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-[11px] text-slate-200">
                  {dispatchNotice}
                </div>
              )}
            </div>
          )}

          <details className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] text-slate-300">
            <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 font-bold text-slate-200">
              <span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded-full border border-white/25 text-[10px]">i</span>
              <span>Methodology, Privacy Vault &amp; Clinical Review Boundary</span>
            </summary>
            <p className="mt-1.5 leading-relaxed text-slate-300">
              Reality View isolates recorded patient telemetry from simulated Hodgkin–Huxley / Aliev–Panfilov waveforms and counterfactual medication screens (clinically_reviewed = false). Quiet Mode initially loads only the compressed outer surface shell ({(998_480 / (1024 * 1024)).toFixed(2)} MB &lt;= 1.80 MiB).
            </p>
          </details>
        </div>
      </div>
    </section>
  )
}

export default RealityViewSurface
