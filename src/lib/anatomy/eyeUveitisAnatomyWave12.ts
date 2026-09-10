export type EyeUveitisAnatomicalContext =
  | 'anterior'
  | 'intermediate'
  | 'posterior'

export interface EyeUveitisEvidence {
  source: 'PubMed'
  locator: string
  retrievedOn: '2026-09-10'
  citation: string
}

export interface EyeUveitisAnatomyRecord {
  id: string
  label: string
  context: EyeUveitisAnatomicalContext
  primaryInflammationSites: readonly string[]
  anatomicalTargets: readonly string[]
  displayOrder: number
  evidence: readonly EyeUveitisEvidence[]
  representation: 'educational-pathology-contract'
  reviewStatus: 'academic-review-pending'
  patientSpecific: false
  classificationAllowed: false
  etiologyInferenceAllowed: false
  activityOrGradingAllowed: false
  imagingInferenceAllowed: false
  prognosisAllowed: false
  diagnosisOrTreatmentAllowed: false
}

const PUBMED = (pmid: string, citation: string): EyeUveitisEvidence => ({
  source: 'PubMed',
  locator: `PMID:${pmid}`,
  retrievedOn: '2026-09-10',
  citation,
})

/**
 * Eye Wave 12 provides a bounded anatomical teaching map for the conventional
 * anterior, intermediate and posterior uveitis categories. The records describe
 * where inflammation is anatomically centered; they do not classify a patient,
 * infer cause or activity, grade findings, or prescribe management.
 */
export const EYE_UVEITIS_ANATOMY_WAVE12: readonly EyeUveitisAnatomyRecord[] = [
  {
    id: 'uveitis-anterior-anatomical-context',
    label: 'Anterior uveitis is anatomically centered in the anterior chamber, with iris and ciliary-body context',
    context: 'anterior',
    primaryInflammationSites: ['anterior-chamber'],
    anatomicalTargets: ['anterior-chamber', 'iris', 'ciliary-body'],
    displayOrder: 1,
    evidence: [
      PUBMED('16196117', 'Standardization of uveitis nomenclature for reporting clinical data. Results of the First International Workshop.'),
      PUBMED('34778287', 'The Cellular Composition of the Uveal Immune Environment.'),
    ],
    representation: 'educational-pathology-contract',
    reviewStatus: 'academic-review-pending',
    patientSpecific: false,
    classificationAllowed: false,
    etiologyInferenceAllowed: false,
    activityOrGradingAllowed: false,
    imagingInferenceAllowed: false,
    prognosisAllowed: false,
    diagnosisOrTreatmentAllowed: false,
  },
  {
    id: 'uveitis-intermediate-anatomical-context',
    label: 'Intermediate uveitis is anatomically centered in the vitreous, with pars-plana context',
    context: 'intermediate',
    primaryInflammationSites: ['vitreous-body'],
    anatomicalTargets: ['vitreous-body', 'pars-plana'],
    displayOrder: 2,
    evidence: [
      PUBMED('16196117', 'Standardization of uveitis nomenclature for reporting clinical data. Results of the First International Workshop.'),
      PUBMED('12854035', 'Uveitis: a global perspective.'),
    ],
    representation: 'educational-pathology-contract',
    reviewStatus: 'academic-review-pending',
    patientSpecific: false,
    classificationAllowed: false,
    etiologyInferenceAllowed: false,
    activityOrGradingAllowed: false,
    imagingInferenceAllowed: false,
    prognosisAllowed: false,
    diagnosisOrTreatmentAllowed: false,
  },
  {
    id: 'uveitis-posterior-anatomical-context',
    label: 'Posterior uveitis is anatomically centered in the retina or choroid',
    context: 'posterior',
    primaryInflammationSites: ['retina', 'choroid'],
    anatomicalTargets: ['retina', 'choroid'],
    displayOrder: 3,
    evidence: [
      PUBMED('16196117', 'Standardization of uveitis nomenclature for reporting clinical data. Results of the First International Workshop.'),
      PUBMED('34778287', 'The Cellular Composition of the Uveal Immune Environment.'),
    ],
    representation: 'educational-pathology-contract',
    reviewStatus: 'academic-review-pending',
    patientSpecific: false,
    classificationAllowed: false,
    etiologyInferenceAllowed: false,
    activityOrGradingAllowed: false,
    imagingInferenceAllowed: false,
    prognosisAllowed: false,
    diagnosisOrTreatmentAllowed: false,
  },
] as const

export const EYE_UVEITIS_ANATOMY_BOUNDARY =
  'Generic anatomical teaching map only. Do not infer uveitis presence, anatomical class, infectious or noninfectious cause, activity, anterior-chamber cell or flare grade, vitreous haze, retinal or choroidal lesion, imaging finding, prognosis, complication, diagnosis, urgency, or treatment for a patient.'

const ALLOWED_TARGETS = new Set([
  'anterior-chamber',
  'iris',
  'ciliary-body',
  'vitreous-body',
  'pars-plana',
  'retina',
  'choroid',
])

const EXPECTED_PRIMARY_SITES: Readonly<Record<EyeUveitisAnatomicalContext, readonly string[]>> = {
  anterior: ['anterior-chamber'],
  intermediate: ['vitreous-body'],
  posterior: ['retina', 'choroid'],
}

export function validateEyeUveitisAnatomyWave12(
  records: readonly EyeUveitisAnatomyRecord[] = EYE_UVEITIS_ANATOMY_WAVE12,
): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  const contexts = new Set<EyeUveitisAnatomicalContext>()

  for (const record of records) {
    if (ids.has(record.id)) errors.push(`duplicate:${record.id}`)
    ids.add(record.id)
    if (contexts.has(record.context)) errors.push(`context:${record.context}`)
    contexts.add(record.context)
    if (!record.label.trim()) errors.push(`label:${record.id}`)
    if (!record.anatomicalTargets.length || record.anatomicalTargets.some((target) => !ALLOWED_TARGETS.has(target))) {
      errors.push(`target:${record.id}`)
    }
    const expectedSites = EXPECTED_PRIMARY_SITES[record.context]
    if (
      record.primaryInflammationSites.join(',') !== expectedSites.join(',') ||
      record.primaryInflammationSites.some((site) => !record.anatomicalTargets.includes(site))
    ) errors.push(`primary-site:${record.id}`)
    if (!record.evidence.length || record.evidence.some((item) => !/^PMID:\d+$/.test(item.locator))) {
      errors.push(`evidence:${record.id}`)
    }
    if (record.evidence.some((item) => item.retrievedOn !== '2026-09-10')) errors.push(`retrieved:${record.id}`)
    if (
      record.representation !== 'educational-pathology-contract' ||
      record.reviewStatus !== 'academic-review-pending' ||
      record.patientSpecific !== false ||
      record.classificationAllowed !== false ||
      record.etiologyInferenceAllowed !== false ||
      record.activityOrGradingAllowed !== false ||
      record.imagingInferenceAllowed !== false ||
      record.prognosisAllowed !== false ||
      record.diagnosisOrTreatmentAllowed !== false
    ) errors.push(`unsafe:${record.id}`)
  }

  if ([...contexts].sort().join(',') !== 'anterior,intermediate,posterior') errors.push('contexts')
  const order = [...records].map((record) => record.displayOrder).sort((a, b) => a - b)
  if (order.join(',') !== '1,2,3') errors.push('ordering')

  return errors
}
