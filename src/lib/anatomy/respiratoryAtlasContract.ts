export type RespiratoryStructureKind =
  | 'airway'
  | 'lung'
  | 'fissure'
  | 'pleura'
  | 'diaphragm'
  | 'thoracic-wall'
  | 'microanatomy-reference'

export type RespiratoryGeometryStatus = 'verification-required' | 'reference-only'

export interface RespiratoryAtlasStructure {
  id: string
  label: string
  kind: RespiratoryStructureKind
  parentId?: string
  geometryStatus: RespiratoryGeometryStatus
  sourceRequired: true
  patientSpecificAllowed: false
  academicReview: 'pending'
  note?: string
}

/**
 * Breath Atlas minimum structure contract.
 *
 * Presence here is a roadmap requirement only. It does not assert that Panacea
 * already owns a verified mesh. Named gross structures remain verification-required;
 * microanatomy/flow concepts remain reference-only until separately sourced.
 */
export const RESPIRATORY_ATLAS_STRUCTURES: readonly RespiratoryAtlasStructure[] = [
  { id: 'trachea', label: 'Trachea', kind: 'airway', geometryStatus: 'verification-required', sourceRequired: true, patientSpecificAllowed: false, academicReview: 'pending' },
  { id: 'right-main-bronchus', label: 'Right main bronchus', kind: 'airway', parentId: 'trachea', geometryStatus: 'verification-required', sourceRequired: true, patientSpecificAllowed: false, academicReview: 'pending' },
  { id: 'left-main-bronchus', label: 'Left main bronchus', kind: 'airway', parentId: 'trachea', geometryStatus: 'verification-required', sourceRequired: true, patientSpecificAllowed: false, academicReview: 'pending' },
  { id: 'right-upper-lobe', label: 'Right upper lobe', kind: 'lung', geometryStatus: 'verification-required', sourceRequired: true, patientSpecificAllowed: false, academicReview: 'pending' },
  { id: 'right-middle-lobe', label: 'Right middle lobe', kind: 'lung', geometryStatus: 'verification-required', sourceRequired: true, patientSpecificAllowed: false, academicReview: 'pending' },
  { id: 'right-lower-lobe', label: 'Right lower lobe', kind: 'lung', geometryStatus: 'verification-required', sourceRequired: true, patientSpecificAllowed: false, academicReview: 'pending' },
  { id: 'left-upper-lobe', label: 'Left upper lobe', kind: 'lung', geometryStatus: 'verification-required', sourceRequired: true, patientSpecificAllowed: false, academicReview: 'pending' },
  { id: 'left-lower-lobe', label: 'Left lower lobe', kind: 'lung', geometryStatus: 'verification-required', sourceRequired: true, patientSpecificAllowed: false, academicReview: 'pending' },
  { id: 'right-horizontal-fissure', label: 'Right horizontal fissure', kind: 'fissure', geometryStatus: 'verification-required', sourceRequired: true, patientSpecificAllowed: false, academicReview: 'pending' },
  { id: 'right-oblique-fissure', label: 'Right oblique fissure', kind: 'fissure', geometryStatus: 'verification-required', sourceRequired: true, patientSpecificAllowed: false, academicReview: 'pending' },
  { id: 'left-oblique-fissure', label: 'Left oblique fissure', kind: 'fissure', geometryStatus: 'verification-required', sourceRequired: true, patientSpecificAllowed: false, academicReview: 'pending' },
  { id: 'visceral-pleura', label: 'Visceral pleura', kind: 'pleura', geometryStatus: 'verification-required', sourceRequired: true, patientSpecificAllowed: false, academicReview: 'pending' },
  { id: 'parietal-pleura', label: 'Parietal pleura', kind: 'pleura', geometryStatus: 'verification-required', sourceRequired: true, patientSpecificAllowed: false, academicReview: 'pending' },
  { id: 'diaphragm', label: 'Diaphragm', kind: 'diaphragm', geometryStatus: 'verification-required', sourceRequired: true, patientSpecificAllowed: false, academicReview: 'pending' },
  { id: 'thoracic-wall', label: 'Thoracic wall reference', kind: 'thoracic-wall', geometryStatus: 'verification-required', sourceRequired: true, patientSpecificAllowed: false, academicReview: 'pending' },
  {
    id: 'bronchiolar-reference',
    label: 'Bronchiolar branching reference',
    kind: 'microanatomy-reference',
    parentId: 'right-main-bronchus',
    geometryStatus: 'reference-only',
    sourceRequired: true,
    patientSpecificAllowed: false,
    academicReview: 'pending',
    note: 'Do not invent distal airway generations or imply individual-patient branching without a licensed, source-specific dataset.',
  },
  {
    id: 'alveolar-reference',
    label: 'Alveolar gas-exchange reference',
    kind: 'microanatomy-reference',
    geometryStatus: 'reference-only',
    sourceRequired: true,
    patientSpecificAllowed: false,
    academicReview: 'pending',
    note: 'Conceptual microanatomy only until a separately licensed and reviewed microscopic dataset is attached.',
  },
] as const

export type RespiratoryCyclePhase = 'inspiration' | 'end-inspiration' | 'expiration' | 'end-expiration'

export interface RespiratoryMotionState {
  phase: RespiratoryCyclePhase
  diaphragmDirection: 'descending' | 'hold-low' | 'ascending' | 'hold-high'
  thoracicVolumeTrend: 'increasing' | 'high' | 'decreasing' | 'low'
  airflowDirection: 'inward' | 'none' | 'outward'
  modelStatus: 'qualitative-reference'
}

/**
 * Qualitative physiology states only. No fabricated pressure, volume, flow,
 * excursion distance, or patient-specific value is encoded here.
 */
export const RESPIRATORY_CYCLE_STATES: readonly RespiratoryMotionState[] = [
  { phase: 'inspiration', diaphragmDirection: 'descending', thoracicVolumeTrend: 'increasing', airflowDirection: 'inward', modelStatus: 'qualitative-reference' },
  { phase: 'end-inspiration', diaphragmDirection: 'hold-low', thoracicVolumeTrend: 'high', airflowDirection: 'none', modelStatus: 'qualitative-reference' },
  { phase: 'expiration', diaphragmDirection: 'ascending', thoracicVolumeTrend: 'decreasing', airflowDirection: 'outward', modelStatus: 'qualitative-reference' },
  { phase: 'end-expiration', diaphragmDirection: 'hold-high', thoracicVolumeTrend: 'low', airflowDirection: 'none', modelStatus: 'qualitative-reference' },
] as const

export interface RespiratoryOverlayPolicy {
  id: 'airflow' | 'volume' | 'pressure' | 'gas-exchange'
  displayStatus: 'conceptual-unless-validated'
  requiresExplicitSourceForQuantification: true
}

export const RESPIRATORY_OVERLAY_POLICIES: readonly RespiratoryOverlayPolicy[] = [
  { id: 'airflow', displayStatus: 'conceptual-unless-validated', requiresExplicitSourceForQuantification: true },
  { id: 'volume', displayStatus: 'conceptual-unless-validated', requiresExplicitSourceForQuantification: true },
  { id: 'pressure', displayStatus: 'conceptual-unless-validated', requiresExplicitSourceForQuantification: true },
  { id: 'gas-exchange', displayStatus: 'conceptual-unless-validated', requiresExplicitSourceForQuantification: true },
] as const

export function getRespiratoryChildren(parentId: string): RespiratoryAtlasStructure[] {
  return RESPIRATORY_ATLAS_STRUCTURES.filter((structure) => structure.parentId === parentId)
}

export function isRespiratoryStructureVerifiedByContract(id: string): boolean {
  const structure = RESPIRATORY_ATLAS_STRUCTURES.find((candidate) => candidate.id === id)
  if (!structure) return false
  // The contract intentionally never self-promotes a roadmap target to verified.
  return false
}
