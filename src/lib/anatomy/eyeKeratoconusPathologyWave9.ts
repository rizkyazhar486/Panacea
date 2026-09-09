import { EYE_VISIBLE_WAVE1 } from './eyeVisibleWave1'
import { EYE_STRUCTURAL_WAVE2 } from './eyeStructuralWave2'
import { EYE_HISTOLOGY_WAVE3 } from './eyeHistologyWave3'

export type EyeKeratoconusMechanismKind =
  | 'stromal-biomechanical-weakening'
  | 'ectatic-corneal-protrusion'
  | 'bowman-layer-disruption-context'

export interface EyeKeratoconusEvidence {
  source: 'PubMed'
  locator: `PMID:${number}`
  retrievedOn: '2026-09-09'
  citation: string
}

export interface EyeKeratoconusPathologyStep {
  id: string
  label: string
  mechanism: EyeKeratoconusMechanismKind
  anatomicalTargets: readonly string[]
  order: 1 | 2 | 3
  evidence: readonly EyeKeratoconusEvidence[]
  representation: 'educational-pathology-contract'
  reviewStatus: 'academic-review-pending'
  patientSpecific: false
  quantitativeInferenceAllowed: false
  topographyDiagnosisAllowed: false
  progressionPredictionAllowed: false
  treatmentRecommendationAllowed: false
}

const PUBMED = (pmid: number, citation: string): EyeKeratoconusEvidence => ({
  source: 'PubMed',
  locator: `PMID:${pmid}`,
  retrievedOn: '2026-09-09',
  citation,
})

export const EYE_KERATOCONUS_PATHOLOGY_WAVE9: readonly EyeKeratoconusPathologyStep[] = [
  {
    id: 'keratoconus-stromal-biomechanics',
    label: 'Keratoconus is associated with progressive stromal thinning and altered corneal biomechanics',
    mechanism: 'stromal-biomechanical-weakening',
    anatomicalTargets: ['corneal-stroma', 'corneal-stromal-lamellae'],
    order: 1,
    evidence: [
      PUBMED(24751584, 'Corneal collagen crosslinking: a systematic review.'),
      PUBMED(41598429, 'Corneal Cross-Linking in Keratoconus: Comparative Analysis of Standard, Accelerated and Transepithelial Protocols.'),
    ],
    representation: 'educational-pathology-contract',
    reviewStatus: 'academic-review-pending',
    patientSpecific: false,
    quantitativeInferenceAllowed: false,
    topographyDiagnosisAllowed: false,
    progressionPredictionAllowed: false,
    treatmentRecommendationAllowed: false,
  },
  {
    id: 'keratoconus-ectatic-protrusion',
    label: 'Corneal ectasia in keratoconus can manifest as progressive corneal protrusion alongside stromal thinning',
    mechanism: 'ectatic-corneal-protrusion',
    anatomicalTargets: ['cornea', 'corneal-stroma'],
    order: 2,
    evidence: [
      PUBMED(24751584, 'Corneal collagen crosslinking: a systematic review.'),
      PUBMED(41598429, 'Corneal Cross-Linking in Keratoconus: Comparative Analysis of Standard, Accelerated and Transepithelial Protocols.'),
    ],
    representation: 'educational-pathology-contract',
    reviewStatus: 'academic-review-pending',
    patientSpecific: false,
    quantitativeInferenceAllowed: false,
    topographyDiagnosisAllowed: false,
    progressionPredictionAllowed: false,
    treatmentRecommendationAllowed: false,
  },
  {
    id: 'keratoconus-bowman-disruption-context',
    label: 'Bowman layer disruption has been observed in keratoconic corneal specimens and is represented here as histopathology context only',
    mechanism: 'bowman-layer-disruption-context',
    anatomicalTargets: ['bowman-layer', 'corneal-epithelium', 'corneal-stroma'],
    order: 3,
    evidence: [
      PUBMED(17881922, 'Corneal wound healing from the perspective of keratoplasty specimens with special reference to the function of the Bowman layer and Descemet membrane.'),
    ],
    representation: 'educational-pathology-contract',
    reviewStatus: 'academic-review-pending',
    patientSpecific: false,
    quantitativeInferenceAllowed: false,
    topographyDiagnosisAllowed: false,
    progressionPredictionAllowed: false,
    treatmentRecommendationAllowed: false,
  },
] as const

export const EYE_KERATOCONUS_PATHOLOGY_BOUNDARY =
  'Generic educational keratoconus pathology mapping only. Do not infer patient corneal curvature, thickness, topographic or tomographic diagnosis, disease stage, progression, visual impact, contact-lens suitability, cross-linking eligibility, surgical indication, prognosis, or treatment from these records.'

const CANONICAL_EYE_IDS = new Set([
  ...EYE_VISIBLE_WAVE1.map((item) => item.id),
  ...EYE_STRUCTURAL_WAVE2.map((item) => item.id),
  ...EYE_HISTOLOGY_WAVE3.map((item) => item.id),
])

export function validateEyeKeratoconusPathologyWave9(
  records: readonly EyeKeratoconusPathologyStep[] = EYE_KERATOCONUS_PATHOLOGY_WAVE9,
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
    if (step.evidence.some((item) => item.retrievedOn !== '2026-09-09')) errors.push(`retrieved:${step.id}`)
    if (
      step.representation !== 'educational-pathology-contract' ||
      step.reviewStatus !== 'academic-review-pending' ||
      step.patientSpecific !== false ||
      step.quantitativeInferenceAllowed !== false ||
      step.topographyDiagnosisAllowed !== false ||
      step.progressionPredictionAllowed !== false ||
      step.treatmentRecommendationAllowed !== false
    ) errors.push(`unsafe:${step.id}`)
  }

  const orders = records.map((step) => step.order).sort((a, b) => a - b)
  if (orders.join(',') !== '1,2,3') errors.push('ordering')

  return errors
}
