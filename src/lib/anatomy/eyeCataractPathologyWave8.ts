export type EyeCataractMechanismKind =
  | 'age-related-proteostasis-loss'
  | 'oxidative-epithelial-cortical-injury'
  | 'posterior-subcapsular-cellular-disorganization'

export interface EyeCataractEvidence {
  source: 'PubMed'
  locator: string
  retrievedOn: '2026-09-10'
  citation: string
}

export interface EyeCataractPathologyStep {
  id: string
  label: string
  mechanism: EyeCataractMechanismKind
  anatomicalTargets: readonly string[]
  order: number
  evidence: readonly EyeCataractEvidence[]
  representation: 'educational-pathology-contract'
  reviewStatus: 'academic-review-pending'
  patientSpecific: false
  clinicalInferenceAllowed: false
  gradingAllowed: false
  treatmentRecommendationAllowed: false
}

const PUBMED = (pmid: string, citation: string): EyeCataractEvidence => ({
  source: 'PubMed',
  locator: `PMID:${pmid}`,
  retrievedOn: '2026-09-10',
  citation,
})

export const EYE_CATARACT_PATHOLOGY_WAVE8: readonly EyeCataractPathologyStep[] = [
  {
    id: 'age-related-lens-proteostasis',
    label: 'Age-related loss of lens proteostasis can reduce transparency in long-lived lens fibers',
    mechanism: 'age-related-proteostasis-loss',
    anatomicalTargets: ['lens-nucleus', 'lens-fibers'],
    order: 1,
    evidence: [PUBMED('38977082', 'Aging of the eye: Lessons from cataracts and age-related macular degeneration.')],
    representation: 'educational-pathology-contract',
    reviewStatus: 'academic-review-pending',
    patientSpecific: false,
    clinicalInferenceAllowed: false,
    gradingAllowed: false,
    treatmentRecommendationAllowed: false,
  },
  {
    id: 'oxidative-cortical-lens-injury',
    label: 'Oxidative injury may damage lens epithelium and subsequently involve cortical lens fibers',
    mechanism: 'oxidative-epithelial-cortical-injury',
    anatomicalTargets: ['lens-anterior-epithelium', 'lens-cortex', 'lens-fibers'],
    order: 2,
    evidence: [PUBMED('7672510', 'Oxidative stress-induced cataract: mechanism of action.')],
    representation: 'educational-pathology-contract',
    reviewStatus: 'academic-review-pending',
    patientSpecific: false,
    clinicalInferenceAllowed: false,
    gradingAllowed: false,
    treatmentRecommendationAllowed: false,
  },
  {
    id: 'posterior-subcapsular-cellular-disorganization',
    label: 'Posterior subcapsular cataract can involve aberrant epithelial migration and lens-fiber disorganization near the posterior capsule',
    mechanism: 'posterior-subcapsular-cellular-disorganization',
    anatomicalTargets: ['lens-capsule', 'lens-fibers', 'lens-cortex'],
    order: 3,
    evidence: [
      PUBMED('6964282', 'Human posterior subcapsular cataracts.'),
      PUBMED('20883819', 'The lens epithelium in ocular health and disease.'),
    ],
    representation: 'educational-pathology-contract',
    reviewStatus: 'academic-review-pending',
    patientSpecific: false,
    clinicalInferenceAllowed: false,
    gradingAllowed: false,
    treatmentRecommendationAllowed: false,
  },
] as const

export const EYE_CATARACT_PATHOLOGY_BOUNDARY =
  'Generic educational cataract pathology mapping only. Do not infer a patient cataract subtype, opacity severity, LOCS grading, visual acuity impact, surgical indication, intraocular-lens choice, prognosis, or treatment from these records.'

const ALLOWED_TARGETS = new Set([
  'lens',
  'lens-capsule',
  'lens-anterior-epithelium',
  'lens-cortex',
  'lens-nucleus',
  'lens-fibers',
])

export function validateEyeCataractPathologyWave8(
  records: readonly EyeCataractPathologyStep[] = EYE_CATARACT_PATHOLOGY_WAVE8,
): string[] {
  const errors: string[] = []
  const ids = new Set<string>()

  for (const step of records) {
    if (ids.has(step.id)) errors.push(`duplicate:${step.id}`)
    ids.add(step.id)
    if (!step.label.trim()) errors.push(`label:${step.id}`)
    if (!step.anatomicalTargets.length) errors.push(`targets:${step.id}`)
    if (step.anatomicalTargets.some((target) => !ALLOWED_TARGETS.has(target))) errors.push(`target:${step.id}`)
    if (!step.evidence.length || step.evidence.some((item) => !/^PMID:\d+$/.test(item.locator))) errors.push(`evidence:${step.id}`)
    if (step.evidence.some((item) => item.retrievedOn !== '2026-09-10')) errors.push(`retrieved:${step.id}`)
    if (
      step.representation !== 'educational-pathology-contract' ||
      step.reviewStatus !== 'academic-review-pending' ||
      step.patientSpecific !== false ||
      step.clinicalInferenceAllowed !== false ||
      step.gradingAllowed !== false ||
      step.treatmentRecommendationAllowed !== false
    ) errors.push(`unsafe:${step.id}`)
  }

  const orders = [...records].map((step) => step.order).sort((a, b) => a - b)
  if (orders.join(',') !== '1,2,3') errors.push('ordering')

  return errors
}
