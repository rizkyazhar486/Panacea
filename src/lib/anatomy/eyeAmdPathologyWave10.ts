export type EyeAmdMechanismKind =
  | 'drusen-rpe-bruch-complex'
  | 'geographic-atrophy-rpe-photoreceptor-loss'
  | 'choroidal-neovascularization'

export interface EyeAmdEvidence {
  source: 'PubMed'
  locator: string
  retrievedOn: '2026-09-10'
  citation: string
}

export interface EyeAmdPathologyStep {
  id: string
  label: string
  mechanism: EyeAmdMechanismKind
  anatomicalTargets: readonly string[]
  order: number
  evidence: readonly EyeAmdEvidence[]
  representation: 'educational-pathology-contract'
  reviewStatus: 'academic-review-pending'
  patientSpecific: false
  clinicalInferenceAllowed: false
  stagingAllowed: false
  imagingInferenceAllowed: false
  treatmentRecommendationAllowed: false
}

const PUBMED = (pmid: string, citation: string): EyeAmdEvidence => ({
  source: 'PubMed',
  locator: `PMID:${pmid}`,
  retrievedOn: '2026-09-10',
  citation,
})

/**
 * Eye Wave 10 maps a small set of well-established AMD pathology relationships onto
 * already-defined macular, RPE, photoreceptor, Bruch membrane and choroidal reference nodes.
 * It is intentionally not a diagnostic model, OCT/fundus segmentation model, severity score,
 * patient-specific reconstruction, treatment selector, or synthetic lesion geometry source.
 */
export const EYE_AMD_PATHOLOGY_WAVE10: readonly EyeAmdPathologyStep[] = [
  {
    id: 'amd-drusen-rpe-bruch-complex',
    label: 'Drusen and age-related dysfunction can involve the RPE–Bruch membrane complex in the macula',
    mechanism: 'drusen-rpe-bruch-complex',
    anatomicalTargets: ['macula', 'retinal-pigment-epithelium', 'bruch-membrane'],
    order: 1,
    evidence: [
      PUBMED('35468037', 'Autophagy in age-related macular degeneration.'),
      PUBMED('22542780', "Understanding age-related macular degeneration (AMD): relationships between the photoreceptor/retinal pigment epithelium/Bruch's membrane/choriocapillaris complex."),
    ],
    representation: 'educational-pathology-contract',
    reviewStatus: 'academic-review-pending',
    patientSpecific: false,
    clinicalInferenceAllowed: false,
    stagingAllowed: false,
    imagingInferenceAllowed: false,
    treatmentRecommendationAllowed: false,
  },
  {
    id: 'amd-geographic-atrophy-rpe-photoreceptor-loss',
    label: 'Atrophic AMD can progress through RPE loss with secondary degeneration of overlying macular photoreceptors',
    mechanism: 'geographic-atrophy-rpe-photoreceptor-loss',
    anatomicalTargets: ['macula', 'fovea', 'retinal-pigment-epithelium', 'photoreceptor-layer'],
    order: 2,
    evidence: [
      PUBMED('26852158', 'Inflammation and its role in age-related macular degeneration.'),
      PUBMED('22542780', "Understanding age-related macular degeneration (AMD): relationships between the photoreceptor/retinal pigment epithelium/Bruch's membrane/choriocapillaris complex."),
    ],
    representation: 'educational-pathology-contract',
    reviewStatus: 'academic-review-pending',
    patientSpecific: false,
    clinicalInferenceAllowed: false,
    stagingAllowed: false,
    imagingInferenceAllowed: false,
    treatmentRecommendationAllowed: false,
  },
  {
    id: 'amd-choroidal-neovascularization',
    label: 'Neovascular AMD can involve pathologic choroidal vessel growth across the choriocapillaris–Bruch membrane–RPE interface',
    mechanism: 'choroidal-neovascularization',
    anatomicalTargets: ['choroid', 'choriocapillaris', 'bruch-membrane', 'retinal-pigment-epithelium', 'macula'],
    order: 3,
    evidence: [
      PUBMED('22542780', "Understanding age-related macular degeneration (AMD): relationships between the photoreceptor/retinal pigment epithelium/Bruch's membrane/choriocapillaris complex."),
      PUBMED('26852158', 'Inflammation and its role in age-related macular degeneration.'),
    ],
    representation: 'educational-pathology-contract',
    reviewStatus: 'academic-review-pending',
    patientSpecific: false,
    clinicalInferenceAllowed: false,
    stagingAllowed: false,
    imagingInferenceAllowed: false,
    treatmentRecommendationAllowed: false,
  },
] as const

export const EYE_AMD_PATHOLOGY_BOUNDARY =
  'Generic educational AMD pathology mapping only. Do not infer AMD presence, subtype, stage, drusen burden, geographic-atrophy extent, neovascular activity, OCT or fundus findings, visual prognosis, anti-VEGF candidacy, treatment choice, dose, interval, or patient-specific lesion geometry from these records.'

const ALLOWED_TARGETS = new Set([
  'macula',
  'fovea',
  'retinal-pigment-epithelium',
  'photoreceptor-layer',
  'bruch-membrane',
  'choriocapillaris',
  'choroid',
])

export function validateEyeAmdPathologyWave10(
  records: readonly EyeAmdPathologyStep[] = EYE_AMD_PATHOLOGY_WAVE10,
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
      step.stagingAllowed !== false ||
      step.imagingInferenceAllowed !== false ||
      step.treatmentRecommendationAllowed !== false
    ) errors.push(`unsafe:${step.id}`)
  }

  const orders = [...records].map((step) => step.order).sort((a, b) => a - b)
  if (orders.join(',') !== '1,2,3') errors.push('ordering')

  return errors
}
