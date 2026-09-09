import { EYE_VISIBLE_WAVE1 } from './eyeVisibleWave1'
import { EYE_HISTOLOGY_WAVE3 } from './eyeHistologyWave3'

export type EyeRetinalDetachmentMechanism =
  | 'vitreoretinal-traction'
  | 'retinal-break-fluid-access'
  | 'subretinal-fluid-clearance-overwhelmed'

export type EyeRetinalDetachmentTargetId =
  | 'vitreous-body'
  | 'retina'
  | 'retinal-pigment-epithelium'
  | 'photoreceptor-layer'

export interface EyeRetinalDetachmentEvidence {
  source: 'PubMed'
  locator: `PMID:${number}`
  citation: string
  retrievedOn: '2026-09-09'
}

export interface EyeRetinalDetachmentPathologyStep {
  id: string
  mechanism: EyeRetinalDetachmentMechanism
  label: string
  anatomicalTargets: readonly EyeRetinalDetachmentTargetId[]
  order: number
  evidence: readonly EyeRetinalDetachmentEvidence[]
  representation: 'educational-pathology-contract'
  reviewStatus: 'academic-review-pending'
  patientSpecific: false
  quantitativeInferenceAllowed: false
  lesionLocalizationAllowed: false
  diagnosisOrTreatmentAllowed: false
}

const P = (locator: `PMID:${number}`, citation: string): EyeRetinalDetachmentEvidence => ({
  source: 'PubMed', locator, citation, retrievedOn: '2026-09-09',
})

export const EYE_RETINAL_DETACHMENT_PATHOLOGY_WAVE8: readonly EyeRetinalDetachmentPathologyStep[] = [
  {
    id: 'rrd-vitreoretinal-traction', mechanism: 'vitreoretinal-traction', order: 1,
    label: 'Dynamic vitreoretinal traction can contribute to formation of a retinal tear at sites of adhesion',
    anatomicalTargets: ['vitreous-body', 'retina'],
    evidence: [P('PMID:24158005', 'Rhegmatogenous retinal detachment: a reappraisal of its pathophysiology and treatment.')],
    representation: 'educational-pathology-contract', reviewStatus: 'academic-review-pending',
    patientSpecific: false, quantitativeInferenceAllowed: false, lesionLocalizationAllowed: false, diagnosisOrTreatmentAllowed: false,
  },
  {
    id: 'rrd-break-fluid-access', mechanism: 'retinal-break-fluid-access', order: 2,
    label: 'A retinal break can provide fluid access to the normally minimal subretinal space when attachment forces are overcome',
    anatomicalTargets: ['retina', 'retinal-pigment-epithelium'],
    evidence: [
      P('PMID:24158005', 'Rhegmatogenous retinal detachment: a reappraisal of its pathophysiology and treatment.'),
      P('PMID:14711443', 'Subretinal fluid in primary rhegmatogenous retinal detachment: physiopathology and composition.'),
    ],
    representation: 'educational-pathology-contract', reviewStatus: 'academic-review-pending',
    patientSpecific: false, quantitativeInferenceAllowed: false, lesionLocalizationAllowed: false, diagnosisOrTreatmentAllowed: false,
  },
  {
    id: 'rrd-rpe-clearance-limit', mechanism: 'subretinal-fluid-clearance-overwhelmed', order: 3,
    label: 'Retinal detachment can occur when fluid entry exceeds retinal pigment epithelium-mediated subretinal fluid clearance capacity',
    anatomicalTargets: ['retinal-pigment-epithelium', 'photoreceptor-layer'],
    evidence: [
      P('PMID:24158005', 'Rhegmatogenous retinal detachment: a reappraisal of its pathophysiology and treatment.'),
      P('PMID:14711443', 'Subretinal fluid in primary rhegmatogenous retinal detachment: physiopathology and composition.'),
      P('PMID:2199242', 'Control of subretinal fluid: experimental and clinical studies.'),
    ],
    representation: 'educational-pathology-contract', reviewStatus: 'academic-review-pending',
    patientSpecific: false, quantitativeInferenceAllowed: false, lesionLocalizationAllowed: false, diagnosisOrTreatmentAllowed: false,
  },
] as const

export const EYE_RETINAL_DETACHMENT_PATHOLOGY_BOUNDARY =
  'Generic educational rhegmatogenous retinal-detachment mechanism mapping only. Do not infer a patient retinal break, detachment extent, macular status, lesion location, prognosis, urgency, diagnosis, treatment, or surgical plan from atlas state or user interaction.'

export function validateEyeRetinalDetachmentPathologyWave8(
  steps: readonly EyeRetinalDetachmentPathologyStep[] = EYE_RETINAL_DETACHMENT_PATHOLOGY_WAVE8,
): string[] {
  const errors: string[] = []
  const canonicalIds = new Set([...EYE_VISIBLE_WAVE1, ...EYE_HISTOLOGY_WAVE3].map((item) => item.id))
  const ids = new Set<string>()
  for (const step of steps) {
    if (ids.has(step.id)) errors.push(`duplicate:${step.id}`)
    ids.add(step.id)
    if (!step.label.trim() || step.order < 1) errors.push(`identity:${step.id}`)
    if (step.anatomicalTargets.length === 0 || step.anatomicalTargets.some((id) => !canonicalIds.has(id))) errors.push(`target:${step.id}`)
    if (step.evidence.length === 0 || step.evidence.some((item) => !/^PMID:\d+$/.test(item.locator))) errors.push(`evidence:${step.id}`)
    if (step.representation !== 'educational-pathology-contract' || step.reviewStatus !== 'academic-review-pending') errors.push(`review:${step.id}`)
    if (step.patientSpecific || step.quantitativeInferenceAllowed || step.lesionLocalizationAllowed || step.diagnosisOrTreatmentAllowed) errors.push(`unsafe:${step.id}`)
  }
  return errors
}
