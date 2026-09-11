import { EYE_VISIBLE_WAVE1 } from './eyeVisibleWave1'
import { EYE_STRUCTURAL_WAVE2 } from './eyeStructuralWave2'

export type EyeCataractMechanismKind =
  | 'crystallin-modification-aggregation'
  | 'lens-light-scattering-opacity-context'
  | 'lens-epithelial-oxidative-stress-context'

export interface EyeCataractEvidence {
  source: 'PubMed'
  locator: `PMID:${number}`
  retrievedOn: '2026-09-10'
  citation: string
}

export interface EyeCataractPathologyStep {
  id: string
  label: string
  mechanism: EyeCataractMechanismKind
  anatomicalTargets: readonly string[]
  order: 1 | 2 | 3
  evidence: readonly EyeCataractEvidence[]
  representation: 'educational-pathology-contract'
  reviewStatus: 'academic-review-pending'
  patientSpecific: false
  quantitativeInferenceAllowed: false
  opacityClassificationAllowed: false
  visualFunctionInferenceAllowed: false
  progressionPredictionAllowed: false
  diagnosisOrTreatmentAllowed: false
}

const PUBMED = (pmid: number, citation: string): EyeCataractEvidence => ({
  source: 'PubMed',
  locator: `PMID:${pmid}`,
  retrievedOn: '2026-09-10',
  citation,
})

export const EYE_CATARACT_PATHOLOGY_WAVE10: readonly EyeCataractPathologyStep[] = [
  {
    id: 'cataract-crystallin-aggregation-context',
    label: 'Age-related lens protein modifications can promote aggregation and light-scattering protein assemblies that compromise lens transparency',
    mechanism: 'crystallin-modification-aggregation',
    anatomicalTargets: ['lens', 'lens-fibers'],
    order: 1,
    evidence: [
      PUBMED(35526854, 'Protein Aggregation and Cataract: Role of Age-Related Modifications and Mutations in alpha-Crystallins.'),
      PUBMED(19463898, 'Lens aging: effects of crystallins.'),
    ],
    representation: 'educational-pathology-contract',
    reviewStatus: 'academic-review-pending',
    patientSpecific: false,
    quantitativeInferenceAllowed: false,
    opacityClassificationAllowed: false,
    visualFunctionInferenceAllowed: false,
    progressionPredictionAllowed: false,
    diagnosisOrTreatmentAllowed: false,
  },
  {
    id: 'cataract-lens-opacity-context',
    label: 'Loss of lens transparency is represented as a generic cataract context without inferring nuclear, cortical, posterior-subcapsular, or other patient-specific opacity subtype',
    mechanism: 'lens-light-scattering-opacity-context',
    anatomicalTargets: ['lens', 'lens-nucleus', 'lens-cortex', 'lens-fibers'],
    order: 2,
    evidence: [
      PUBMED(19463898, 'Lens aging: effects of crystallins.'),
      PUBMED(34297945, 'Protein posttranslational modification by glycation: Role in lens aging and age-related cataractogenesis.'),
    ],
    representation: 'educational-pathology-contract',
    reviewStatus: 'academic-review-pending',
    patientSpecific: false,
    quantitativeInferenceAllowed: false,
    opacityClassificationAllowed: false,
    visualFunctionInferenceAllowed: false,
    progressionPredictionAllowed: false,
    diagnosisOrTreatmentAllowed: false,
  },
  {
    id: 'cataract-lens-epithelium-oxidative-context',
    label: 'Oxidative-stress and lens-epithelial-cell dysfunction are represented as research-supported age-related cataract context, not as a deterministic causal or patient-level inference',
    mechanism: 'lens-epithelial-oxidative-stress-context',
    anatomicalTargets: ['lens-anterior-epithelium', 'lens-capsule', 'lens'],
    order: 3,
    evidence: [
      PUBMED(36871745, 'Age-related cataract: GSTP1 ubiquitination and degradation by Parkin inhibits its anti-apoptosis in lens epithelial cells.'),
      PUBMED(34297945, 'Protein posttranslational modification by glycation: Role in lens aging and age-related cataractogenesis.'),
    ],
    representation: 'educational-pathology-contract',
    reviewStatus: 'academic-review-pending',
    patientSpecific: false,
    quantitativeInferenceAllowed: false,
    opacityClassificationAllowed: false,
    visualFunctionInferenceAllowed: false,
    progressionPredictionAllowed: false,
    diagnosisOrTreatmentAllowed: false,
  },
] as const

export const EYE_CATARACT_PATHOLOGY_BOUNDARY =
  'Generic educational cataract pathology mapping only. Do not infer a patient opacity subtype, LOCS or other grading score, lens density, visual acuity, glare disability, surgical indication, progression rate, prognosis, diagnosis, or treatment from these records.'

const CANONICAL_EYE_IDS = new Set([
  ...EYE_VISIBLE_WAVE1.map((item) => item.id),
  ...EYE_STRUCTURAL_WAVE2.map((item) => item.id),
])

export function validateEyeCataractPathologyWave10(
  records: readonly EyeCataractPathologyStep[] = EYE_CATARACT_PATHOLOGY_WAVE10,
): string[] {
  const errors: string[] = []
  const ids = new Set<string>()

  for (const step of records) {
    if (ids.has(step.id)) errors.push(`duplicate:${step.id}`)
    ids.add(step.id)
    if (!step.label.trim()) errors.push(`label:${step.id}`)
    if (!step.anatomicalTargets.length) errors.push(`targets:${step.id}`)
    if (step.anatomicalTargets.some((target) => !CANONICAL_EYE_IDS.has(target))) errors.push(`target:${step.id}`)
    if (!step.evidence.length || step.evidence.some((item) => !/^PMID:\d+$/.test(item.locator))) errors.push(`evidence:${step.id}`)
    if (step.evidence.some((item) => item.retrievedOn !== '2026-09-10')) errors.push(`retrieved:${step.id}`)
    if (
      step.representation !== 'educational-pathology-contract' ||
      step.reviewStatus !== 'academic-review-pending' ||
      step.patientSpecific !== false ||
      step.quantitativeInferenceAllowed !== false ||
      step.opacityClassificationAllowed !== false ||
      step.visualFunctionInferenceAllowed !== false ||
      step.progressionPredictionAllowed !== false ||
      step.diagnosisOrTreatmentAllowed !== false
    ) errors.push(`unsafe:${step.id}`)
  }

  const orders = records.map((step) => step.order).sort((a, b) => a - b)
  if (orders.join(',') !== '1,2,3') errors.push('ordering')

  return errors
}
