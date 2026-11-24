export const ANATOMICAL_SYSTEM_IDS = [
  'cardiovascular', 'respiratory', 'nervous', 'musculoskeletal', 'gastrointestinal',
  'renal', 'endocrine', 'immune_lymphatic', 'integumentary', 'reproductive',
] as const

export type AnatomicalSystemId = typeof ANATOMICAL_SYSTEM_IDS[number]
export type RealityViewMode = 'quiet' | 'split' | 'fullscreen' | 'timeline_inset'
export type EvidenceClass = 'observed_fhir' | 'wearable_stream' | 'ocr_verified' | 'simulated_projection'

export interface ProvenanceRef {
  readonly id: string
  readonly fhirResourceType: 'Observation' | 'Condition' | 'MedicationRequest' | 'DiagnosticReport'
  readonly satusehatResourceId?: string
  readonly sourceLabel: string
  readonly recordedAt: string
  readonly icd11Code?: string
  readonly icd11Tm1Code?: string
  readonly verified: boolean
}

export interface TrajectoryChevron {
  readonly id: string
  readonly targetMeshId: string
  readonly direction: 'improving' | 'stable' | 'drifting' | 'critical'
  readonly horizonDays: 7 | 30 | 90 | 365
  readonly deltaSummary: string
  readonly clinicalMetricDelta: string
  readonly confidenceInterval: readonly [number, number]
  readonly confidenceLabel: 'high' | 'moderate' | 'low'
  readonly counterfactualId?: string
  readonly ddiSafetyVerified: boolean
  readonly ddiWarnings?: readonly string[]
}

export interface OrganTelemetryNode {
  readonly meshId: string
  readonly canonicalOntologyId: string
  readonly indonesianLabel: string
  readonly englishLabel: string
  readonly systemId: AnatomicalSystemId
  readonly evidenceClass: EvidenceClass
  /** Null means no supported score is available at the selected time. */
  readonly statusScore: number | null
  readonly shaderUniforms: {
    readonly pulseBpm?: number
    readonly conductionState?: Float32Array
    readonly perfusionIntensity: number
    readonly highlightHue: string
  }
  readonly conductionModel?: 'aliev_panfilov'
  readonly readings?: readonly {
    readonly metric: string
    readonly value: number
    readonly unit: string
    readonly evidenceClass: Exclude<EvidenceClass, 'simulated_projection'>
    readonly provenance: ProvenanceRef
  }[]
  readonly conductionEvidenceClass?: 'simulated_projection'
  readonly clinicalRelations?: readonly { readonly relation: string; readonly targetOntologyId: string }[]
  readonly provenance: readonly ProvenanceRef[]
  readonly activeChevrons: readonly TrajectoryChevron[]
  readonly hardSafetyLock: boolean
  readonly hardSafetyReason?: string
}

export interface RealityViewState {
  readonly patientId: string
  readonly mode: RealityViewMode
  readonly timeAxisCursorIso: string
  readonly isFutureProjection: boolean
  readonly activeSystems: readonly AnatomicalSystemId[]
  readonly selectedMeshId: string | null
  readonly dualCodingTm1Enabled: boolean
  readonly quietModeHeadline: string
  readonly quietModePrimaryAction: {
    readonly label: string
    readonly actionType: 'check_vitals' | 'contact_clinician' | 'view_medication' | 'daily_checkin'
    readonly urgent: boolean
  }
  readonly nodes: Readonly<Record<string, OrganTelemetryNode>>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonempty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || isNonempty(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isUnitNumber(value: unknown): boolean {
  return isFiniteNumber(value) && value >= 0 && value <= 1
}

export function isValidRealityTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.exec(value)
  if (!parts || !Number.isFinite(Date.parse(value))) return false
  const [, year, month, day] = parts
  const calendar = new Date(0)
  calendar.setUTCFullYear(Number(year), Number(month) - 1, Number(day))
  return calendar.getUTCFullYear() === Number(year)
    && calendar.getUTCMonth() + 1 === Number(month)
    && calendar.getUTCDate() === Number(day)
}

export function isAnatomicalSystemId(value: unknown): value is AnatomicalSystemId {
  return ANATOMICAL_SYSTEM_IDS.some(id => id === value)
}

export function isProvenanceRef(value: unknown): value is ProvenanceRef {
  return isRecord(value)
    && isNonempty(value.id)
    && ['Observation', 'Condition', 'MedicationRequest', 'DiagnosticReport'].some(type => type === value.fhirResourceType)
    && isNonempty(value.sourceLabel)
    && isValidRealityTimestamp(value.recordedAt)
    && isOptionalString(value.satusehatResourceId)
    && isOptionalString(value.icd11Code)
    && isOptionalString(value.icd11Tm1Code)
    && typeof value.verified === 'boolean'
}

export function isTrajectoryChevron(value: unknown): value is TrajectoryChevron {
  if (!isRecord(value)) return false
  const interval = value.confidenceInterval
  return isNonempty(value.id)
    && isNonempty(value.targetMeshId)
    && ['improving', 'stable', 'drifting', 'critical'].some(direction => direction === value.direction)
    && [7, 30, 90, 365].some(days => days === value.horizonDays)
    && isNonempty(value.deltaSummary)
    && value.deltaSummary.length <= 60
    && isNonempty(value.clinicalMetricDelta)
    && Array.isArray(interval)
    && interval.length === 2
    && isFiniteNumber(interval[0])
    && isFiniteNumber(interval[1])
    && interval[0] <= interval[1]
    && ['high', 'moderate', 'low'].some(label => label === value.confidenceLabel)
    && isOptionalString(value.counterfactualId)
    && typeof value.ddiSafetyVerified === 'boolean'
    && (value.ddiWarnings === undefined || (Array.isArray(value.ddiWarnings) && value.ddiWarnings.every(isNonempty)))
}

export function isOrganTelemetryNode(value: unknown): value is OrganTelemetryNode {
  if (!isRecord(value) || !isRecord(value.shaderUniforms)) return false
  const { evidenceClass, provenance, activeChevrons, shaderUniforms } = value
  const { pulseBpm, conductionState, perfusionIntensity, highlightHue } = shaderUniforms
  return isNonempty(value.meshId)
    && isNonempty(value.canonicalOntologyId)
    && isNonempty(value.indonesianLabel)
    && isNonempty(value.englishLabel)
    && isAnatomicalSystemId(value.systemId)
    && ['observed_fhir', 'wearable_stream', 'ocr_verified', 'simulated_projection'].some(kind => kind === evidenceClass)
    && (value.statusScore === null || isUnitNumber(value.statusScore))
    && (pulseBpm === undefined || (isFiniteNumber(pulseBpm) && pulseBpm > 0))
    && isUnitNumber(perfusionIntensity)
    && typeof highlightHue === 'string' && /^#[0-9a-f]{6}$/i.test(highlightHue)
    && (value.conductionEvidenceClass === undefined || value.conductionEvidenceClass === 'simulated_projection')
    && (value.conductionModel === undefined || value.conductionModel === 'aliev_panfilov')
    && (value.readings === undefined || (Array.isArray(value.readings) && value.readings.every(reading =>
      isRecord(reading) && isNonempty(reading.metric) && isFiniteNumber(reading.value) && isNonempty(reading.unit)
      && ['observed_fhir', 'wearable_stream', 'ocr_verified'].some(kind => kind === reading.evidenceClass)
      && isProvenanceRef(reading.provenance)
      && (reading.evidenceClass !== 'ocr_verified' || reading.provenance.verified))))
    && (conductionState === undefined || (
      value.systemId === 'cardiovascular'
      && value.conductionEvidenceClass === 'simulated_projection'
      && conductionState instanceof Float32Array
      && conductionState.length === 64
      && conductionState.every(isUnitNumber)
    ))
    && Array.isArray(provenance)
    && provenance.every(isProvenanceRef)
    && (evidenceClass === 'simulated_projection' || provenance.length > 0)
    && (evidenceClass !== 'ocr_verified' || provenance.some(ref => ref.verified))
    && Array.isArray(activeChevrons)
    && activeChevrons.every(chevron => isTrajectoryChevron(chevron) && chevron.targetMeshId === value.meshId)
    && typeof value.hardSafetyLock === 'boolean'
    && isOptionalString(value.hardSafetyReason)
    && (value.clinicalRelations === undefined || (Array.isArray(value.clinicalRelations)
      && value.clinicalRelations.every(link => isRecord(link) && isNonempty(link.relation) && isNonempty(link.targetOntologyId))))
}

export function isRealityViewState(value: unknown): value is RealityViewState {
  if (!isRecord(value) || !isRecord(value.nodes) || !isRecord(value.quietModePrimaryAction)) return false
  const action = value.quietModePrimaryAction
  return isNonempty(value.patientId)
    && ['quiet', 'split', 'fullscreen', 'timeline_inset'].some(mode => mode === value.mode)
    && isValidRealityTimestamp(value.timeAxisCursorIso)
    && typeof value.isFutureProjection === 'boolean'
    && Array.isArray(value.activeSystems) && value.activeSystems.every(isAnatomicalSystemId)
    && (value.selectedMeshId === null || (isNonempty(value.selectedMeshId) && Object.prototype.hasOwnProperty.call(value.nodes, value.selectedMeshId)))
    && typeof value.dualCodingTm1Enabled === 'boolean'
    && isNonempty(value.quietModeHeadline) && value.quietModeHeadline.length <= 90
    && isNonempty(action.label)
    && ['check_vitals', 'contact_clinician', 'view_medication', 'daily_checkin'].some(type => type === action.actionType)
    && typeof action.urgent === 'boolean'
    && Object.entries(value.nodes).every(([id, node]) => isOrganTelemetryNode(node) && node.meshId === id)
}
