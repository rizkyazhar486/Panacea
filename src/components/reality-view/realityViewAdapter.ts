import { CANONICAL_MULTISCALE_KNOWLEDGE_GRAPH_EDGES, type MultiscaleKnowledgeGraphEdge } from '../../domains/one-os/omnicausalisRecursiveDiscoveryAndKnowledgeGraphEngine.ts'
import { listBindingsBySystem, MESH_TO_ONTOLOGY_MAP, projectTm1DualCodingMetadata, resolveMeshOntology, type MeshOntologyBinding, type MeshResolutionResult } from '../../engines/reality-view/anatomyOntologyRegistry.ts'
import { runCounterfactualIntervention, type CounterfactualRequest, type CounterfactualResult } from '../../engines/reality-view/counterfactualSimulator.ts'
import { OverrideMemoryStore, type AlertSeverity } from '../../engines/reality-view/overrideMemoryStore.ts'
import { selectQuietModeSummary, type QuietModeSummary } from '../../engines/reality-view/quietModeSelector.ts'
import { buildRealityViewState, type RealityViewReading } from '../../engines/reality-view/realityViewStateEngine.ts'
import { assertOutboundClinicalSyncAuthorized, bootRealityViewOfflineFirst, createIndexedDbVaultAdapter, deriveVaultAesKey, sanitizeClinicalText, saveEncryptedRealityViewSnapshot, type VaultAuthSession } from '../../engines/reality-view/realityViewVaultSync.ts'
import type { AnatomyLayer } from '../bodyhub/Body3D'
import type { Vitals } from '../../lib/healthVitals.ts'
import type { ButirLab } from '../../lib/lab.ts'
import type { LongitudinalSnapshot } from '../../lib/longitudinalSnapshot.ts'
import type { LongitudinalEvent } from '../../lib/panaceaLongitudinalState.ts'
import { appendPurposeConsentDecision, createPurposeConsentLedger, type PurposeConsentLedger } from '../../lib/purposeConsentLedger.ts'
import type { Account } from '../../lib/types.ts'
import { ANATOMICAL_SYSTEM_IDS, type AnatomicalSystemId, type OrganTelemetryNode, type ProvenanceRef, type RealityViewMode, type RealityViewState } from '../../types/realityView.ts'
import { detectPerformanceTier, FpsTierWatchdog, QUIET_MODE_MAX_BYTES, RealityViewLodResourcePool, resolveActiveLodBundlePlan, TIER_BUDGETS, type HardwareCapabilityProbe, type LodLevelId, type PerformanceTierId, type TierBudgetSpec } from './performanceTierManager.ts'

export { ANATOMICAL_SYSTEM_IDS, assertOutboundClinicalSyncAuthorized, bootRealityViewOfflineFirst, createIndexedDbVaultAdapter, deriveVaultAesKey, detectPerformanceTier, FpsTierWatchdog, listBindingsBySystem, MESH_TO_ONTOLOGY_MAP, projectTm1DualCodingMetadata, QUIET_MODE_MAX_BYTES, RealityViewLodResourcePool, resolveActiveLodBundlePlan, resolveMeshOntology, runCounterfactualIntervention, sanitizeClinicalText, saveEncryptedRealityViewSnapshot, selectQuietModeSummary, TIER_BUDGETS }
export type { AnatomicalSystemId, CounterfactualRequest, CounterfactualResult, HardwareCapabilityProbe, LodLevelId, MeshOntologyBinding, MeshResolutionResult, PerformanceTierId, QuietModeSummary, TierBudgetSpec, VaultAuthSession }

export const GLB_LAYER_ESTIMATED_BYTES: Readonly<Record<AnatomyLayer['key'], number>> = {
  surface: 998_480, lymphoid: 652_008, skeletal: 2_653_500, visceral: 3_682_364, muscular: 5_636_668, nervous: 7_785_940, cardiovascular: 12_344_948,
}

export const SYSTEM_TO_GLB_LAYERS: Readonly<Record<AnatomicalSystemId, readonly AnatomyLayer['key'][]>> = {
  cardiovascular: ['cardiovascular'], respiratory: ['visceral'], nervous: ['nervous'], musculoskeletal: ['skeletal', 'muscular'], gastrointestinal: ['visceral'],
  renal: ['visceral'], endocrine: ['visceral'], immune_lymphatic: ['lymphoid'], integumentary: ['surface'], reproductive: ['visceral', 'surface'],
}

export function probeBrowserHardware(): HardwareCapabilityProbe {
  if (typeof globalThis === 'undefined' || typeof navigator === 'undefined') {
    return { hasWebGPU: false, hasWebGL2: false, isMobile: false }
  }
  const nav = navigator as Navigator & { readonly deviceMemory?: number; readonly gpu?: unknown }
  let hasWebGL2 = false
  let rendererString: string | undefined

  if (typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2')
      if (gl) {
        hasWebGL2 = true
        const debugExt = gl.getExtension('WEBGL_debug_renderer_info')
        const raw = debugExt ? gl.getParameter(debugExt.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
        if (typeof raw === 'string') rendererString = raw
      }
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
    } catch {
      hasWebGL2 = false
    }
  }

  const ua = typeof nav.userAgent === 'string' ? nav.userAgent : ''
  const isMobileViewport = typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  return {
    hasWebGPU: typeof nav.gpu === 'object' && nav.gpu !== null,
    hasWebGL2,
    isMobile: isMobileViewport || /iphone|ipad|ipod|android|mobile/i.test(ua),
    deviceMemoryGb: typeof nav.deviceMemory === 'number' ? nav.deviceMemory : undefined,
    rendererString,
  }
}

export function mapLodPlanToGlbLayers(plan: ReturnType<typeof resolveActiveLodBundlePlan>): {
  readonly layersToLoad: readonly AnatomyLayer['key'][]
  readonly estimatedPayloadBytes: number
} {
  if (!plan.loadOuterShell) {
    return { layersToLoad: [], estimatedPayloadBytes: 0 }
  }
  const chosen = new Set<AnatomyLayer['key']>(['surface'])
  for (const sys of plan.streamableSystems) {
    for (const layer of SYSTEM_TO_GLB_LAYERS[sys]) {
      chosen.add(layer)
    }
  }
  const layersToLoad = [...chosen]
  const estimatedPayloadBytes = layersToLoad.reduce(
    (total, layer) => total + GLB_LAYER_ESTIMATED_BYTES[layer],
    0,
  )
  return { layersToLoad, estimatedPayloadBytes }
}

const VITAL_METRIC_MAP: ReadonlyArray<{
  readonly field: keyof Vitals
  readonly metric: string
  readonly unit: string
  readonly domain: LongitudinalEvent['domain']
}> = [
  { field: 'heartRate', metric: 'heart-rate', unit: 'bpm', domain: 'vital' },
  { field: 'restingHr', metric: 'resting-heart-rate', unit: 'bpm', domain: 'vital' },
  { field: 'hrvMs', metric: 'hrv', unit: 'ms', domain: 'recovery' },
  { field: 'systolic', metric: 'blood-pressure-systolic', unit: 'mmHg', domain: 'vital' },
  { field: 'diastolic', metric: 'blood-pressure-diastolic', unit: 'mmHg', domain: 'vital' },
  { field: 'spo2Pct', metric: 'spo2', unit: '%', domain: 'vital' },
  { field: 'respRate', metric: 'respiratory-rate', unit: 'breaths/min', domain: 'vital' },
  { field: 'fev1', metric: 'fev1', unit: 'L', domain: 'vital' },
  { field: 'fvc', metric: 'fvc', unit: 'L', domain: 'vital' },
]

const LAB_METRIC_MAP: Readonly<Record<string, { readonly metric: string; readonly unit: string }>> = {
  sgot: { metric: 'lab.sgot', unit: 'U/L' },
  sgpt: { metric: 'lab.sgpt', unit: 'U/L' },
  egfr: { metric: 'lab.egfr', unit: 'mL/min/1.73m²' },
  kreatinin: { metric: 'lab.kreatinin', unit: 'mg/dL' },
  gdp: { metric: 'lab.gdp', unit: 'mg/dL' },
  hba1c: { metric: 'lab.hba1c', unit: '%' },
}

const SUPPORTED_METRICS = new Set([
  'heart-rate', 'resting-heart-rate', 'hrv', 'blood-pressure-systolic', 'blood-pressure-diastolic',
  'spo2', 'respiratory-rate', 'fev1', 'fvc', 'lab.sgot', 'lab.sgpt', 'lab.egfr', 'lab.kreatinin',
  'glucose', 'blood-glucose', 'lab.gdp', 'lab.hba1c',
])

const LONGITUDINAL_METRIC_ALIAS: Readonly<Record<string, { readonly metric: string; readonly unit: string }>> = {
  heartRate: { metric: 'heart-rate', unit: 'bpm' }, restingHr: { metric: 'resting-heart-rate', unit: 'bpm' },
  hrvMs: { metric: 'hrv', unit: 'ms' }, systolic: { metric: 'blood-pressure-systolic', unit: 'mmHg' },
  diastolic: { metric: 'blood-pressure-diastolic', unit: 'mmHg' }, spo2Pct: { metric: 'spo2', unit: '%' },
  respRate: { metric: 'respiratory-rate', unit: 'breaths/min' },
}

function validIsoOrFallback(candidate: string | undefined, fallbackIso: string): string {
  if (!candidate) return fallbackIso
  const parsed = Date.parse(candidate)
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : fallbackIso
}

function safeReadingFromEvent(event: LongitudinalEvent): RealityViewReading | null {
  if (typeof event.value !== 'number' || !Number.isFinite(event.value) || event.value < 0) return null
  const aliased = LONGITUDINAL_METRIC_ALIAS[event.metric]
  const canonicalMetric = aliased?.metric ?? event.metric
  const canonicalUnit = aliased?.unit ?? event.unit
  if (!SUPPORTED_METRICS.has(canonicalMetric) || !canonicalUnit) return null

  const sourceKind = event.provenance.sourceKind
  const isClinical = sourceKind === 'clinical-system'
  const isAcceptedLab = sourceKind === 'import' && event.domain === 'lab' && event.review.state === 'accepted'
  const isWearable = sourceKind === 'wearable' || sourceKind === 'device'
  if (!isClinical && !isAcceptedLab && !isWearable) return null

  const evidenceClass = isAcceptedLab ? 'ocr_verified' : isClinical ? 'observed_fhir' : 'wearable_stream'
  return {
    event: { ...event, metric: canonicalMetric, unit: canonicalUnit, value: event.value },
    evidenceClass,
    provenance: {
      id: event.id, fhirResourceType: isAcceptedLab ? 'DiagnosticReport' : 'Observation',
      sourceLabel: event.provenance.sourceId, recordedAt: event.recordedAt, verified: event.review.state === 'accepted',
    },
  }
}

export function buildConsentLedgerForSubject(subjectId: string, grantedAtIso: string, granted: boolean): PurposeConsentLedger {
  let ledger = createPurposeConsentLedger()
  if (granted) {
    ledger = appendPurposeConsentDecision(ledger, {
      id: `consent-grant-${subjectId}`, subjectId, purpose: 'personal-visualization', action: 'grant', decidedAt: grantedAtIso, source: 'user',
    })
  }
  return ledger
}

export function collectLiveRealityViewReadings(input: {
  readonly patientId: string
  readonly snapshot: LongitudinalSnapshot | null
  readonly vitals: Vitals
  readonly labs: Record<string, ButirLab[]>
  readonly nowIso: string
}): readonly RealityViewReading[] {
  const { patientId, snapshot, vitals, labs, nowIso } = input
  const collected: RealityViewReading[] = []
  const seenIds = new Set<string>()
  const consentRecordedAt = new Date(0).toISOString()

  if (snapshot?.state) {
    for (const event of Object.values(snapshot.state.eventsById)) {
      const converted = safeReadingFromEvent(event)
      if (!converted || seenIds.has(converted.event.id)) continue
      seenIds.add(converted.event.id)
      collected.push(converted)
    }
  }

  const vitalRecordedAt = validIsoOrFallback(typeof vitals.recordedAt === 'string' ? vitals.recordedAt : undefined, nowIso)
  for (const mapping of VITAL_METRIC_MAP) {
    const raw = vitals[mapping.field]
    if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0) continue
    const id = `live-vital-${mapping.metric}-${vitalRecordedAt}`
    if (seenIds.has(id)) continue
    seenIds.add(id)
    const sourceLabel = typeof vitals.source === 'string' && vitals.source.trim() ? vitals.source : 'local-device-sync'
    collected.push({
      event: {
        id, subjectId: patientId, domain: mapping.domain, metric: mapping.metric, value: raw, unit: mapping.unit,
        recordedAt: vitalRecordedAt, confidence: 0.9, semanticState: 'measured',
        provenance: { sourceKind: 'wearable', sourceId: sourceLabel, capturedAt: vitalRecordedAt, receivedAt: vitalRecordedAt },
        consent: { granted: true, purposes: ['personal-visualization'], grantedAt: consentRecordedAt },
        review: { state: 'not-required' },
      },
      evidenceClass: 'wearable_stream',
      provenance: { id, fhirResourceType: 'Observation', sourceLabel, recordedAt: vitalRecordedAt, verified: false },
    })
  }

  for (const [labKey, entries] of Object.entries(labs)) {
    const mapping = LAB_METRIC_MAP[labKey]
    if (!mapping || !Array.isArray(entries) || entries.length === 0) continue
    const latest = [...entries].sort((a, b) => b.tanggal.localeCompare(a.tanggal))[0]
    if (!latest || typeof latest.nilai !== 'number' || !Number.isFinite(latest.nilai) || latest.nilai < 0) continue
    const labRecordedAt = /^\d{4}-\d{2}-\d{2}$/.test(latest.tanggal) ? `${latest.tanggal}T08:00:00Z` : validIsoOrFallback(latest.tanggal, nowIso)
    if (Date.parse(labRecordedAt) > Date.parse(nowIso)) continue
    const id = `live-lab-${labKey}-${latest.id}`
    if (seenIds.has(id)) continue
    seenIds.add(id)
    collected.push({
      event: {
        id, subjectId: patientId, domain: 'lab', metric: mapping.metric, value: latest.nilai, unit: mapping.unit,
        recordedAt: labRecordedAt, confidence: 1, semanticState: 'imported',
        provenance: { sourceKind: 'import', sourceId: 'patient-lab-import', capturedAt: labRecordedAt, receivedAt: labRecordedAt },
        consent: { granted: true, purposes: ['personal-visualization'], grantedAt: consentRecordedAt },
        review: { state: 'accepted', reviewerId: 'imported-lab-record', reviewedAt: labRecordedAt },
      },
      evidenceClass: 'ocr_verified',
      provenance: { id, fhirResourceType: 'DiagnosticReport', sourceLabel: 'Imported Lab Sheet', recordedAt: labRecordedAt, verified: true },
    })
  }

  return collected
}

export function buildLiveRealityViewState(input: {
  readonly patientId: string
  readonly mode: RealityViewMode
  readonly nowIso: string
  readonly timeAxisCursorIso: string
  readonly dualCodingTm1Enabled: boolean
  readonly selectedMeshId: string | null
  readonly consentGranted: boolean
  readonly snapshot: LongitudinalSnapshot | null
  readonly vitals: Vitals
  readonly labs: Record<string, ButirLab[]>
}): RealityViewState {
  const consentLedger = buildConsentLedgerForSubject(input.patientId, new Date(0).toISOString(), input.consentGranted)
  const readings = collectLiveRealityViewReadings({ patientId: input.patientId, snapshot: input.snapshot, vitals: input.vitals, labs: input.labs, nowIso: input.nowIso })
  return buildRealityViewState({
    patientId: input.patientId, mode: input.mode, nowIso: input.nowIso, timeAxisCursorIso: input.timeAxisCursorIso,
    dualCodingTm1Enabled: input.dualCodingTm1Enabled, selectedMeshId: input.selectedMeshId, consentLedger, readings,
  })
}

export function evaluateLiveVaultAuthSession(
  account: Account | null,
  vaultUnlocked: boolean,
  nowMs = Date.now(),
  storageOverride?: { readonly token: string | null; readonly sessionRaw: string | null },
): VaultAuthSession {
  if (!account || !account.id) {
    return { googleAuthVerified: false, vaultUnlocked: false, sessionExpiresAtMs: 0, providerUserId: '' }
  }

  let token = storageOverride ? storageOverride.token : null
  let sessionRaw = storageOverride ? storageOverride.sessionRaw : null
  if (!storageOverride && typeof localStorage !== 'undefined') {
    try {
      token = localStorage.getItem('pmd-token')
      sessionRaw = localStorage.getItem('panaceamed.session.v1')
    } catch {
      token = null
      sessionRaw = null
    }
  }

  let sessionExpiresAtMs = nowMs + 7 * 86_400_000
  let providerKind = 'google'
  if (sessionRaw) {
    try {
      const parsed = JSON.parse(sessionRaw) as { readonly loginAt?: number; readonly authProvider?: string }
      if (typeof parsed.loginAt === 'number' && Number.isFinite(parsed.loginAt)) sessionExpiresAtMs = parsed.loginAt + 7 * 86_400_000
      if (typeof parsed.authProvider === 'string') providerKind = parsed.authProvider
    } catch {
      return { googleAuthVerified: false, vaultUnlocked: false, sessionExpiresAtMs: 0, providerUserId: '' }
    }
  }

  const googleAuthVerified = Boolean(token && token.trim().length > 0) && providerKind === 'google'
  return { googleAuthVerified, vaultUnlocked, sessionExpiresAtMs, providerUserId: account.id }
}

export interface InspectedOrganView {
  readonly resolution: MeshResolutionResult
  readonly tm1Metadata: ReturnType<typeof projectTm1DualCodingMetadata>
  readonly telemetryNode: OrganTelemetryNode | null
  readonly knowledgeGraphEdges: readonly MultiscaleKnowledgeGraphEdge[]
}

export function inspectSelectedMesh(
  meshId: string | null,
  state: RealityViewState,
  dualCodingTm1Enabled: boolean,
): InspectedOrganView | null {
  if (meshId === null) return null
  const resolution = resolveMeshOntology(meshId)
  const tm1Metadata = projectTm1DualCodingMetadata(meshId, dualCodingTm1Enabled)
  if (!resolution.selectable) return { resolution, tm1Metadata, telemetryNode: null, knowledgeGraphEdges: [] }

  const allowedEdgeIds = new Set(resolution.binding.knowledgeGraphEdgeIds)
  const knowledgeGraphEdges = CANONICAL_MULTISCALE_KNOWLEDGE_GRAPH_EDGES.filter((edge) => allowedEdgeIds.has(edge.edgeId))
  const rawNode = Object.prototype.hasOwnProperty.call(state.nodes, meshId) ? state.nodes[meshId] : null
  const telemetryNode = rawNode && dualCodingTm1Enabled && tm1Metadata.icd11Tm1Code
    ? { ...rawNode, provenance: rawNode.provenance.map((ref) => ({ ...ref, icd11Tm1Code: ref.icd11Tm1Code ?? tm1Metadata.icd11Tm1Code })) }
    : rawNode

  return { resolution, tm1Metadata, telemetryNode, knowledgeGraphEdges }
}

export function runInteractiveCounterfactualMedicationCheck(
  state: RealityViewState,
  params: {
    readonly counterfactualId: string
    readonly targetMeshId: string
    readonly candidateDrugGeneric: 'clopidogrel' | 'carbamazepine' | 'warfarin' | 'gentamicin'
    readonly activeDrugGeneric: string
  },
): CounterfactualResult {
  const fallbackIso = state.timeAxisCursorIso
  const verifiedRef: ProvenanceRef & { readonly fhirResourceType: 'MedicationRequest'; readonly verified: true } = {
    id: `medreq-${params.activeDrugGeneric}-1`, fhirResourceType: 'MedicationRequest',
    sourceLabel: 'Clinical Medication Check (Unreviewed Draft Simulation)', recordedAt: fallbackIso, verified: true,
  }
  const req: CounterfactualRequest = {
    type: 'medication_change', counterfactualId: params.counterfactualId, targetMeshId: params.targetMeshId,
    candidateDrugGeneric: params.candidateDrugGeneric, operation: 'add', standardDailyDoseMg: 75,
    context: {
      patientId: state.patientId, reviewedAt: fallbackIso, complete: true,
      activeMedicationRequests: params.activeDrugGeneric
        ? [{ genericIngredient: params.activeDrugGeneric, dailyDoseMg: 20, provenance: verifiedRef }]
        : [],
      eGfrMlMin173m2: 85, childPughClass: 'A',
      pharmacogenomicMarkers: params.candidateDrugGeneric === 'clopidogrel'
        ? ['CYP2C19_POOR_METABOLIZER_2_2']
        : params.candidateDrugGeneric === 'carbamazepine' ? ['HLA-B*15:02_POSITIVE'] : ['NORMAL_WILDTYPE'],
      documentedAllergies: [],
    },
  }
  return runCounterfactualIntervention(state, req)
}

export function createSessionOverrideStore(): OverrideMemoryStore {
  return new OverrideMemoryStore()
}

export function evaluateAlertSuppression(
  store: OverrideMemoryStore,
  ruleKey: string,
  severity: AlertSeverity,
  hardSafetyLock: boolean,
  dismiss: boolean,
) {
  if (dismiss) {
    store.recordOverride(ruleKey, severity, hardSafetyLock, 'User dismissed notification')
  }
  return store.shouldSuppressAlert(ruleKey, hardSafetyLock)
}

export function formatSystemTitle(systemId: AnatomicalSystemId): string {
  switch (systemId) {
    case 'cardiovascular': return 'Cardiovascular'
    case 'respiratory': return 'Respiratory'
    case 'nervous': return 'Nervous'
    case 'musculoskeletal': return 'Musculoskeletal'
    case 'gastrointestinal': return 'Hepatobiliary & GI'
    case 'renal': return 'Renal'
    case 'endocrine': return 'Endocrine'
    case 'immune_lymphatic': return 'Immune & Lymphatic'
    case 'integumentary': return 'Surface & ENT'
    case 'reproductive': return 'Reproductive'
  }
}
