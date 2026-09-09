export interface EyeDiabeticRetinopathyEvidence {
  source: 'PubMed'
  locator: string
  retrievedOn: '2026-09-10'
  citation: string
}

export interface EyeDiabeticRetinopathyMechanism {
  id: string
  label: string
  anatomicalTargets: readonly string[]
  order: number
  evidence: readonly EyeDiabeticRetinopathyEvidence[]
  representation: 'educational-pathology-contract'
  reviewStatus: 'academic-review-pending'
  patientSpecific: false
  clinicalInferenceAllowed: false
  stagingAllowed: false
  imagingInferenceAllowed: false
  treatmentRecommendationAllowed: false
}

const P = (pmid: string, citation: string): EyeDiabeticRetinopathyEvidence => ({ source: 'PubMed', locator: `PMID:${pmid}`, retrievedOn: '2026-09-10', citation })

export const EYE_DIABETIC_RETINOPATHY_WAVE11: readonly EyeDiabeticRetinopathyMechanism[] = [
  {
    id: 'retinal-microvascular-pericyte-capillary-injury',
    label: 'Retinal microvascular injury can include pericyte loss, endothelial injury, basement-membrane change, and capillary non-perfusion',
    anatomicalTargets: ['retina', 'nerve-fiber-layer', 'inner-nuclear-layer'],
    order: 1,
    evidence: [P('36494431', 'Perspectives of diabetic retinopathy-challenges and opportunities.'), P('21909978', 'Advanced glycation end products and diabetic retinopathy.')],
    representation: 'educational-pathology-contract', reviewStatus: 'academic-review-pending', patientSpecific: false,
    clinicalInferenceAllowed: false, stagingAllowed: false, imagingInferenceAllowed: false, treatmentRecommendationAllowed: false,
  },
  {
    id: 'blood-retinal-barrier-breakdown-macular-edema',
    label: 'Blood-retinal-barrier breakdown and vascular leakage can contribute to retinal thickening and diabetic macular edema',
    anatomicalTargets: ['retina', 'macula', 'fovea'],
    order: 2,
    evidence: [P('36494431', 'Perspectives of diabetic retinopathy-challenges and opportunities.'), P('18220619', 'Angiogenic and antiangiogenic factors in proliferative diabetic retinopathy.')],
    representation: 'educational-pathology-contract', reviewStatus: 'academic-review-pending', patientSpecific: false,
    clinicalInferenceAllowed: false, stagingAllowed: false, imagingInferenceAllowed: false, treatmentRecommendationAllowed: false,
  },
  {
    id: 'proliferative-retinal-neovascularization',
    label: 'Advanced diabetic retinal ischemic signaling can be associated with pathologic retinal neovascularization and fibrovascular proliferation',
    anatomicalTargets: ['retina', 'nerve-fiber-layer', 'vitreous-body'],
    order: 3,
    evidence: [P('18220619', 'Angiogenic and antiangiogenic factors in proliferative diabetic retinopathy.'), P('20594164', 'Angiogenic growth factors and their inhibitors in diabetic retinopathy.')],
    representation: 'educational-pathology-contract', reviewStatus: 'academic-review-pending', patientSpecific: false,
    clinicalInferenceAllowed: false, stagingAllowed: false, imagingInferenceAllowed: false, treatmentRecommendationAllowed: false,
  },
] as const

export const EYE_DIABETIC_RETINOPATHY_BOUNDARY =
  'Generic educational diabetic-retinopathy pathology only. Do not diagnose or stage NPDR/PDR, infer microaneurysms, hemorrhage, edema, ischemia, or neovascularization from images or free text, estimate visual prognosis, recommend laser/intravitreal therapy, or fabricate lesion geometry.'

const ALLOWED = new Set(['retina', 'nerve-fiber-layer', 'inner-nuclear-layer', 'macula', 'fovea', 'vitreous-body'])

export function validateEyeDiabeticRetinopathyWave11(records: readonly EyeDiabeticRetinopathyMechanism[] = EYE_DIABETIC_RETINOPATHY_WAVE11): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  for (const item of records) {
    if (ids.has(item.id)) errors.push(`duplicate:${item.id}`)
    ids.add(item.id)
    if (!item.label.trim()) errors.push(`label:${item.id}`)
    if (!item.anatomicalTargets.length || item.anatomicalTargets.some((target) => !ALLOWED.has(target))) errors.push(`target:${item.id}`)
    if (!item.evidence.length || item.evidence.some((e) => !/^PMID:\d+$/.test(e.locator) || e.retrievedOn !== '2026-09-10')) errors.push(`evidence:${item.id}`)
    if (item.representation !== 'educational-pathology-contract' || item.reviewStatus !== 'academic-review-pending' || item.patientSpecific || item.clinicalInferenceAllowed || item.stagingAllowed || item.imagingInferenceAllowed || item.treatmentRecommendationAllowed) errors.push(`unsafe:${item.id}`)
  }
  if ([...records].map((x) => x.order).sort((a,b)=>a-b).join(',') !== '1,2,3') errors.push('ordering')
  return errors
}
