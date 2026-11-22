import {
  evaluatePharmacogenomicAndRenalMedicationSafety,
  type MedicationSafetyEvaluationInput,
} from '../../domains/clinical-operations/model/pharmacogenomicsAndDrugInteractionSafetyEngine.ts'
import { isProvenanceRef, isValidRealityTimestamp, type ProvenanceRef, type RealityViewState } from '../../types/realityView.ts'

type Drug = MedicationSafetyEvaluationInput['candidateDrugGeneric']
type Markers = MedicationSafetyEvaluationInput['pharmacogenomicMarkers']

type ReviewedMedicationRequest = {
  readonly genericIngredient: string
  readonly dailyDoseMg: number
  readonly provenance: ProvenanceRef & { readonly fhirResourceType: 'MedicationRequest'; readonly verified: true }
}

/** Construct from reconciled clinical evidence after authorizing access to this patient. */
export interface ReviewedMedicationContext {
  readonly patientId: string
  readonly reviewedAt: string
  readonly complete: true
  readonly activeMedicationRequests: readonly ReviewedMedicationRequest[]
  readonly eGfrMlMin173m2: number
  readonly childPughClass: MedicationSafetyEvaluationInput['childPughClass']
  readonly pharmacogenomicMarkers: Markers
  readonly documentedAllergies: readonly string[]
}

interface RequestTarget {
  /** UUID allocated once by the caller for this scenario. */
  readonly counterfactualId: string
  readonly targetMeshId: string
}

type MedicationChange =
  | { readonly operation: 'add'; readonly standardDailyDoseMg: number }
  | { readonly operation: 'adjust'; readonly standardDailyDoseMg: number; readonly medicationRequestId: string }
  | { readonly operation: 'stop'; readonly medicationRequestId: string }

export type CounterfactualRequest = RequestTarget & (
  | {
    readonly type: 'medication_change'
    /** Exact generic ingredient from a reviewed mapping. Raw codes and brands are unsupported. */
    readonly candidateDrugGeneric: string
    readonly context: ReviewedMedicationContext
  } & MedicationChange
  | { readonly type: 'sleep_hrv_recovery' | 'sodium_diet_shift' }
)

/** A safety screen marker has no estimated effect, time horizon or confidence interval. */
export interface CounterfactualSafetyChevron {
  readonly kind: 'safety_hold'
  readonly id: string
  readonly targetMeshId: string
  readonly counterfactualId: string
  readonly evidenceClass: 'simulated_projection'
  readonly direction: 'critical'
  readonly deltaSummary: 'Medication change flagged for clinician review'
  readonly horizonDays: null
  readonly confidenceInterval: null
  readonly ddiSafetyVerified: false
  readonly ddiWarnings: readonly string[]
}

export interface CounterfactualResult {
  readonly status: 'blocked' | 'unavailable'
  readonly reason: 'rule_flagged' | 'invalid_request' | 'incomplete_context' | 'unsupported_medication' | 'projection_unavailable'
  readonly counterfactualId: string | null
  readonly targetMeshId: string
  readonly evidenceClass: 'simulated_projection'
  readonly clinicallyReviewed: false
  readonly ddiSafetyVerified: false
  readonly medicationScreen: 'not_run' | 'flagged' | 'no_flags_in_covered_rules'
  readonly hardSafetyLock: boolean
  readonly ddiWarnings: readonly string[]
  readonly activeChevrons: readonly CounterfactualSafetyChevron[]
}

const supportedDrugs: readonly Drug[] = ['carbamazepine', 'clopidogrel', 'warfarin', 'gentamicin']
const supportedMarkers: Markers = ['HLA-B*15:02_POSITIVE', 'CYP2C19_POOR_METABOLIZER_2_2', 'VKORC1_SENSITIVE', 'NORMAL_WILDTYPE']
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const generic = /^[a-z0-9]+(?:[ -][a-z0-9]+)*$/
const positive = (value: number) => Number.isFinite(value) && value > 0

function validContext(state: RealityViewState, context: ReviewedMedicationContext): boolean {
  if (
    !context || !isValidRealityTimestamp(context.reviewedAt) || !isValidRealityTimestamp(state.timeAxisCursorIso) ||
    context.patientId !== state.patientId || context.complete !== true ||
    !Number.isFinite(context.eGfrMlMin173m2) || context.eGfrMlMin173m2 < 0 ||
    !['A', 'B', 'C'].includes(context.childPughClass) ||
    !Array.isArray(context.pharmacogenomicMarkers) ||
    !context.pharmacogenomicMarkers.every(marker => supportedMarkers.includes(marker)) ||
    !Array.isArray(context.documentedAllergies) ||
    !context.documentedAllergies.every(allergy => typeof allergy === 'string' && allergy.trim()) ||
    !Array.isArray(context.activeMedicationRequests)
  ) return false

  const reviewedAt = Date.parse(context.reviewedAt)
  const cursor = Date.parse(state.timeAxisCursorIso)
  if (reviewedAt > cursor) return false

  const orderIds = new Set<string>()
  for (const order of context.activeMedicationRequests) {
    const ref = order?.provenance
    if (
      !order || typeof order.genericIngredient !== 'string' || !generic.test(order.genericIngredient) ||
      !positive(order.dailyDoseMg) || !isProvenanceRef(ref) || ref.fhirResourceType !== 'MedicationRequest' || ref.verified !== true ||
      orderIds.has(ref.id) || Date.parse(ref.recordedAt) > reviewedAt
    ) return false
    orderIds.add(ref.id)
  }
  return true
}

function engineWarnings(message: string): string {
  const [code] = message.split(':', 1)
  switch (code) {
    case 'DOCUMENTED_DRUG_ALLERGY_CONTRAINDICATION':
      return 'DOCUMENTED_DRUG_ALLERGY_CONTRAINDICATION: Documented allergy to the proposed drug.'
    case 'CPIC_LEVEL_A_CONTRAINDICATION':
      return 'CPIC_LEVEL_A_CONTRAINDICATION: Carbamazepine and positive HLA-B*15:02.'
    case 'CPIC_LEVEL_A_ALERT':
      return 'CPIC_LEVEL_A_ALERT: Clopidogrel and documented CYP2C19 *2/*2 poor metabolizer status.'
    case 'CYP2C19_INHIBITION_DDI':
      return 'CYP2C19_INHIBITION_DDI: Omeprazole inhibits clopidogrel activation.'
    case 'CYP2C9_INHIBITION_DDI':
      return 'CYP2C9_INHIBITION_DDI: Amiodarone reduces warfarin clearance.'
    default:
      return 'Medication safety rule flagged for clinician review.'
  }
}

/**
 * Evaluate a proposed change in a separate projection. Patient evidence stays
 * untouched. A limited rule screen never clears a drug or authorizes a dose.
 */
export function runCounterfactualIntervention(state: RealityViewState, req: CounterfactualRequest): CounterfactualResult {
  const counterfactualId = typeof req.counterfactualId === 'string' && uuid.test(req.counterfactualId)
    ? req.counterfactualId
    : null
  const unavailable: CounterfactualResult = {
    status: 'unavailable',
    reason: 'projection_unavailable',
    counterfactualId,
    targetMeshId: req.targetMeshId,
    evidenceClass: 'simulated_projection',
    clinicallyReviewed: false,
    ddiSafetyVerified: false,
    medicationScreen: 'not_run',
    hardSafetyLock: false,
    ddiWarnings: [],
    activeChevrons: [],
  }
  if (!counterfactualId || !Object.prototype.hasOwnProperty.call(state.nodes, req.targetMeshId) ||
    state.nodes[req.targetMeshId]?.meshId !== req.targetMeshId
  ) return { ...unavailable, reason: 'invalid_request' }

  if (req.type !== 'medication_change') return unavailable
  const { context, candidateDrugGeneric } = req
  if (!validContext(state, context)) return { ...unavailable, reason: 'incomplete_context' }
  if (typeof candidateDrugGeneric !== 'string' || !generic.test(candidateDrugGeneric)) {
    return { ...unavailable, reason: 'invalid_request' }
  }

  if (!['add', 'adjust', 'stop'].includes(req.operation)) return { ...unavailable, reason: 'invalid_request' }

  const currentOrders = context.activeMedicationRequests
  const targetOrder = req.operation === 'add'
    ? undefined
    : currentOrders.find(order => order.provenance.id === req.medicationRequestId)
  if (
    (req.operation === 'add' && currentOrders.some(order => order.genericIngredient === candidateDrugGeneric)) ||
    (req.operation !== 'add' && targetOrder?.genericIngredient !== candidateDrugGeneric) ||
    (req.operation !== 'stop' && !positive(req.standardDailyDoseMg))
  ) return { ...unavailable, reason: 'invalid_request' }

  const dose = req.operation === 'stop' ? targetOrder?.dailyDoseMg : req.standardDailyDoseMg
  if (dose === undefined) return { ...unavailable, reason: 'invalid_request' }
  const relevantOrders = currentOrders.filter(order => order !== targetOrder)
  const regimen = [
    ...relevantOrders.map(order => ({ ingredient: order.genericIngredient, dose: order.dailyDoseMg })),
    { ingredient: candidateDrugGeneric, dose },
  ]
  const warnings = new Set<string>()
  for (const [index, order] of regimen.entries()) {
    const candidate = supportedDrugs.find(drug => drug === order.ingredient)
    if (!candidate) continue
    // Include affected existing drugs to catch directional interactions when a
    // proposed drug is the inhibitor. For stopping, this screens the pre-stop regimen.
    const safety = evaluatePharmacogenomicAndRenalMedicationSafety({
      patientCanonicalId: state.patientId,
      candidateDrugGeneric: candidate,
      standardDailyDoseMg: order.dose,
      eGfrMlMin173m2: context.eGfrMlMin173m2,
      childPughClass: context.childPughClass,
      pharmacogenomicMarkers: context.pharmacogenomicMarkers,
      concomitantMedications: regimen.filter((_, otherIndex) => otherIndex !== index).map(other => other.ingredient),
      documentedAllergies: context.documentedAllergies.map(allergy => allergy.trim()),
    })
    for (const flag of [...safety.hardContraindicationAlerts, ...safety.ddiWarnings]) warnings.add(engineWarnings(flag))
  }

  if (!warnings.size) {
    return supportedDrugs.some(drug => drug === candidateDrugGeneric)
      ? { ...unavailable, medicationScreen: 'no_flags_in_covered_rules' }
      : { ...unavailable, reason: 'unsupported_medication' }
  }

  const ddiWarnings = [...warnings].sort()
  return {
    ...unavailable,
    status: 'blocked',
    reason: 'rule_flagged',
    hardSafetyLock: true,
    medicationScreen: 'flagged',
    ddiWarnings,
    activeChevrons: [{
      kind: 'safety_hold',
      id: `${counterfactualId}:medication-safety`,
      targetMeshId: req.targetMeshId,
      counterfactualId,
      evidenceClass: 'simulated_projection',
      direction: 'critical',
      deltaSummary: 'Medication change flagged for clinician review',
      horizonDays: null,
      confidenceInterval: null,
      ddiSafetyVerified: false,
      ddiWarnings,
    }],
  }
}
