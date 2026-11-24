import { CANONICAL_MULTISCALE_KNOWLEDGE_GRAPH_EDGES } from '../../domains/one-os/omnicausalisRecursiveDiscoveryAndKnowledgeGraphEngine.ts'
import { INDEKS_TUBUH, type StrukturTubuh } from '../../lib/bodyIndex.gen.ts'
import { PARAMETER_BAKU, profilPotensialAksi } from '../../lib/bioelectric.ts'
import {
  validateLongitudinalEvent, type LongitudinalEvent,
} from '../../lib/panaceaLongitudinalState.ts'
import { isEventPurposeAuthorized, type PurposeConsentLedger } from '../../lib/purposeConsentLedger.ts'
import {
  isProvenanceRef, isValidRealityTimestamp, type AnatomicalSystemId, type EvidenceClass,
  type OrganTelemetryNode, type ProvenanceRef, type RealityViewMode, type RealityViewState,
} from '../../types/realityView.ts'
import { MESH_TO_ONTOLOGY_MAP } from './anatomyOntologyRegistry.ts'
import { selectQuietModeSummary } from './quietModeSelector.ts'

type ObservationClass = Exclude<EvidenceClass, 'simulated_projection'>

export interface RealityViewReading {
  readonly event: LongitudinalEvent<number>
  readonly evidenceClass: ObservationClass
  /** Reference supplied by the authenticated source adapter. */
  readonly provenance: ProvenanceRef
  /** Optional normalized score from an accepted, verified assessment. */
  readonly statusScore?: number
  /** A trusted upstream clinical rule or clinician must supply this assessment. */
  readonly hardSafetyReason?: string
}

export interface BuildRealityViewStateInput {
  readonly patientId: string
  readonly mode?: RealityViewMode
  readonly nowIso?: string
  readonly timeAxisCursorIso: string
  readonly dualCodingTm1Enabled?: boolean
  readonly selectedMeshId?: string | null
  /** Supply the current canonical consent ledger, including revocations. */
  readonly consentLedger: PurposeConsentLedger
  readonly readings: readonly RealityViewReading[]
}

interface AtlasAnchor {
  readonly meshId: string
  readonly layer: StrukturTubuh['l']
  readonly canonicalOntologyId: string
  readonly systemId: AnatomicalSystemId
  readonly indonesianLabel: string
  readonly englishLabel: string
}

function anchorFromRegistry(meshId: string): AtlasAnchor {
  const binding = MESH_TO_ONTOLOGY_MAP.get(meshId)
  if (!binding) {
    throw new Error(`Missing canonical ontology anchor in MESH_TO_ONTOLOGY_MAP: ${meshId}`)
  }
  return {
    meshId: binding.meshId,
    layer: binding.layer,
    canonicalOntologyId: binding.canonicalOntologyId,
    systemId: binding.systemId,
    indonesianLabel: binding.indonesianLabel,
    englishLabel: binding.englishLabel,
  }
}

// Exact source names from the canonical ontology registry & Z-Anatomy GLB index.
// These are anatomical anchors for system telemetry, not organ-local measurements.
const anchors = {
  heart: anchorFromRegistry('Left ventricle'),
  airway: anchorFromRegistry('Trachea'),
  liver: anchorFromRegistry('Liver'),
  kidney: anchorFromRegistry('Kidney.l'),
  pancreas: anchorFromRegistry('Pancreas'),
} as const satisfies Readonly<Record<string, AtlasAnchor>>

interface MetricBinding {
  readonly anchor: AtlasAnchor
  readonly unit: string
}

const metrics = new Map<string, MetricBinding>([
  ['heart-rate', { anchor: anchors.heart, unit: 'bpm' }],
  ['resting-heart-rate', { anchor: anchors.heart, unit: 'bpm' }],
  ['hrv', { anchor: anchors.heart, unit: 'ms' }],
  ['blood-pressure-systolic', { anchor: anchors.heart, unit: 'mmHg' }],
  ['blood-pressure-diastolic', { anchor: anchors.heart, unit: 'mmHg' }],
  ['spo2', { anchor: anchors.airway, unit: '%' }],
  ['respiratory-rate', { anchor: anchors.airway, unit: 'breaths/min' }],
  ['fev1', { anchor: anchors.airway, unit: 'L' }],
  ['fvc', { anchor: anchors.airway, unit: 'L' }],
  ['lab.sgot', { anchor: anchors.liver, unit: 'U/L' }],
  ['lab.sgpt', { anchor: anchors.liver, unit: 'U/L' }],
  ['lab.egfr', { anchor: anchors.kidney, unit: 'mL/min/1.73m²' }],
  ['lab.kreatinin', { anchor: anchors.kidney, unit: 'mg/dL' }],
  ['glucose', { anchor: anchors.pancreas, unit: 'mg/dL' }],
  ['blood-glucose', { anchor: anchors.pancreas, unit: 'mg/dL' }],
  ['lab.gdp', { anchor: anchors.pancreas, unit: 'mg/dL' }],
  ['lab.hba1c', { anchor: anchors.pancreas, unit: '%' }],
])

const shippedAnchors = new Set<AtlasAnchor>(
  Object.values(anchors).filter(anchor =>
    INDEKS_TUBUH.some(structure => structure.n === anchor.meshId && structure.l === anchor.layer),
  ),
)

const unobservedStates = new Set([
  'derived', 'rule-output', 'ai-draft', 'model-estimated', 'simulated', 'counterfactual',
  'hypothesis', 'reference', 'stale', 'unknown', 'unsupported', 'unavailable', 'patient-reported',
])

function graphOntologyId(nodeId: string): string {
  return /^(?:FMA|UBERON|SNOMEDCT):\d+(?=_|$)/.exec(nodeId)?.[0] ?? nodeId
}

export function relationsForCanonicalOntologyId(canonicalOntologyId: string) {
  return CANONICAL_MULTISCALE_KNOWLEDGE_GRAPH_EDGES
    .filter(edge => graphOntologyId(edge.sourceNodeId) === canonicalOntologyId)
    .map(edge => ({ relation: edge.relation, targetOntologyId: graphOntologyId(edge.targetNodeId) }))
}

let conductionProfile: Float32Array | undefined

function educationalConductionProfile(): Float32Array {
  if (!conductionProfile) {
    const { u } = profilPotensialAksi(PARAMETER_BAKU)
    if (u.length < 64) throw new Error('Educational conduction profile contains fewer than 64 samples')
    conductionProfile = Float32Array.from({ length: 64 }, (_, index) => {
      const sample = u[Math.round(index * (u.length - 1) / 63)]
      if (!Number.isFinite(sample)) throw new Error('Educational conduction profile contains a non-finite sample')
      return Math.min(1, Math.max(0, sample))
    })
  }
  return conductionProfile.slice()
}

function matchesEvidence({ event, evidenceClass, provenance }: RealityViewReading): boolean {
  const source = event.provenance.sourceKind
  if (event.review.state === 'rejected' || (event.semanticState && unobservedStates.has(event.semanticState))) return false
  if (evidenceClass === 'wearable_stream') {
    return (source === 'wearable' || source === 'device') && provenance.fhirResourceType === 'Observation'
  }
  if (evidenceClass === 'ocr_verified') {
    return source === 'import' && event.domain === 'lab' && event.review.state === 'accepted'
      && provenance.verified && ['Observation', 'DiagnosticReport'].includes(provenance.fhirResourceType)
  }
  return evidenceClass === 'observed_fhir' && source === 'clinical-system'
    && provenance.fhirResourceType === 'Observation'
}

function isAvailableNow(event: LongitudinalEvent<number>, patientId: string, now: number): boolean {
  if (event?.subjectId !== patientId) return false
  try {
    validateLongitudinalEvent(event)
    return isValidRealityTimestamp(event.recordedAt)
      && isValidRealityTimestamp(event.provenance.receivedAt)
      && Date.parse(event.recordedAt) <= now
      && Date.parse(event.provenance.receivedAt) <= now
  } catch {
    return false
  }
}

function isAdmitted(reading: RealityViewReading, cutoff: number): boolean {
  const { event, provenance } = reading
  return isProvenanceRef(provenance)
    && typeof event.value === 'number' && Number.isFinite(event.value) && event.value >= 0
    && Date.parse(event.recordedAt) === Date.parse(provenance.recordedAt)
    && Date.parse(event.recordedAt) <= cutoff && Date.parse(event.provenance.receivedAt) <= cutoff
    && (event.review.state !== 'accepted' || Date.parse(event.review.reviewedAt ?? '') <= cutoff)
    && matchesEvidence(reading)
}

function latestFirst(left: RealityViewReading, right: RealityViewReading): number {
  return Date.parse(right.event.recordedAt) - Date.parse(left.event.recordedAt)
    || Date.parse(right.event.provenance.receivedAt) - Date.parse(left.event.provenance.receivedAt)
    || left.event.id.localeCompare(right.event.id)
}

function evidenceIdentity({ event, provenance, evidenceClass, statusScore, hardSafetyReason }: RealityViewReading): string {
  return JSON.stringify([
    event.metric, event.value, event.unit, event.recordedAt, event.provenance.sourceId,
    event.provenance.receivedAt, event.review.state, event.review.reviewerId, event.review.reviewedAt,
    provenance.id, provenance.fhirResourceType, provenance.satusehatResourceId,
    provenance.sourceLabel, provenance.recordedAt, provenance.icd11Code, provenance.icd11Tm1Code,
    provenance.verified, evidenceClass, statusScore, hardSafetyReason,
  ])
}

function copyProvenance(ref: ProvenanceRef, dualCoding: boolean): ProvenanceRef {
  if (dualCoding) return { ...ref }
  const { icd11Tm1Code: _hidden, ...visible } = ref
  return visible
}

function buildNode(anchor: AtlasAnchor, rows: readonly RealityViewReading[], dualCoding: boolean): OrganTelemetryNode {
  const latest = rows[0]
  const readings = rows.map(({ event, evidenceClass, provenance }) => ({
    metric: event.metric, unit: event.unit!, value: event.value,
    evidenceClass, provenance: copyProvenance(provenance, dualCoding),
  }))
  const reviewed = rows.filter(row => row.provenance.verified && row.event.review.state === 'accepted')
  const score = reviewed.find(row => Number.isFinite(row.statusScore))?.statusScore
  const statusScore = score === undefined ? null : Math.min(1, Math.max(0, score))
  const hardSafetyReason = reviewed.find(row => row.hardSafetyReason?.trim())?.hardSafetyReason?.trim()
  const pulseBpm = readings.find(reading => reading.metric === 'heart-rate' && reading.value > 0)?.value
  const conductionState = anchor.systemId === 'cardiovascular' ? educationalConductionProfile() : undefined

  return {
    meshId: anchor.meshId,
    canonicalOntologyId: anchor.canonicalOntologyId,
    systemId: anchor.systemId,
    indonesianLabel: anchor.indonesianLabel,
    englishLabel: anchor.englishLabel,
    evidenceClass: latest.evidenceClass,
    statusScore,
    // Default shading has no data-driven perfusion overlay.
    shaderUniforms: {
      pulseBpm, conductionState, perfusionIntensity: 0, highlightHue: '#70e0ca',
    },
    ...(conductionState ? { conductionEvidenceClass: 'simulated_projection', conductionModel: 'aliev_panfilov' } as const : {}),
    clinicalRelations: relationsForCanonicalOntologyId(anchor.canonicalOntologyId),
    readings,
    provenance: readings.map(reading => ({ ...reading.provenance })),
    activeChevrons: [],
    hardSafetyLock: hardSafetyReason !== undefined,
    hardSafetyReason,
  }
}

export function buildRealityViewState(input: BuildRealityViewStateInput): RealityViewState {
  const nowIso = input.nowIso ?? new Date().toISOString()
  if (!input.patientId.trim() || !isValidRealityTimestamp(nowIso) || !isValidRealityTimestamp(input.timeAxisCursorIso)) {
    throw new RangeError('Reality View needs a patient ID and valid timestamps')
  }

  const now = Date.parse(nowIso)
  const cursor = Date.parse(input.timeAxisCursorIso)
  const cutoff = Math.min(cursor, now)
  const dualCodingTm1Enabled = input.dualCodingTm1Enabled ?? false
  const blockedIds = new Set<string>()
  const eventById = new Map<string, RealityViewReading>()
  for (const reading of input.readings) {
    const { event } = reading
    if (!isAvailableNow(event, input.patientId, now)) continue
    // Access follows the current permission and review decision, even during historical replay.
    // A stale copy of the same record cannot override a current denial.
    if (!isEventPurposeAuthorized(event, input.consentLedger, 'personal-visualization', now)
      || (event.review.state === 'rejected' && Date.parse(event.review.reviewedAt ?? '') <= now)) {
      blockedIds.add(event.id)
      continue
    }
    const binding = metrics.get(event.metric)
    if (!binding || !shippedAnchors.has(binding.anchor) || event.unit !== binding.unit
      || !isAdmitted(reading, cutoff)) continue

    const previous = eventById.get(reading.event.id)
    if (!previous) eventById.set(reading.event.id, reading)
    else if (evidenceIdentity(previous) !== evidenceIdentity(reading)) {
      blockedIds.add(reading.event.id)
    }
  }

  const latestByAnchor = new Map<AtlasAnchor, Map<string, RealityViewReading>>()
  const admitted = [...eventById.values()].filter(row => !blockedIds.has(row.event.id)).sort(latestFirst)
  for (const reading of admitted) {
    const { metric } = reading.event
    const { anchor } = metrics.get(metric)!
    const byMetric = latestByAnchor.get(anchor) ?? new Map<string, RealityViewReading>()
    if (!byMetric.has(metric)) byMetric.set(metric, reading)
    latestByAnchor.set(anchor, byMetric)
  }

  const nodes = Object.fromEntries([...latestByAnchor].map(([anchor, byMetric]) =>
    [anchor.meshId, buildNode(anchor, [...byMetric.values()], dualCodingTm1Enabled)],
  ))
  const selected = input.selectedMeshId ?? null
  const draft: RealityViewState = {
    patientId: input.patientId,
    mode: input.mode ?? 'quiet',
    timeAxisCursorIso: input.timeAxisCursorIso,
    isFutureProjection: cursor > now,
    activeSystems: [...new Set(Object.values(nodes).map(node => node.systemId))],
    selectedMeshId: selected && Object.prototype.hasOwnProperty.call(nodes, selected) ? selected : null,
    dualCodingTm1Enabled,
    quietModeHeadline: '',
    quietModePrimaryAction: { label: 'Daily Check-In', actionType: 'daily_checkin', urgent: false },
    nodes,
  }
  const quiet = selectQuietModeSummary(draft)
  return { ...draft, quietModeHeadline: quiet.headline, quietModePrimaryAction: quiet.primaryAction }
}
