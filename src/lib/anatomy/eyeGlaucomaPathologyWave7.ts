export type EyeGlaucomaMechanismKind =
  | 'open-angle-outflow-resistance'
  | 'pupillary-block-angle-closure'
  | 'optic-nerve-head-stress'

export interface EyeGlaucomaEvidence {
  source: 'PubMed'
  locator: string
  retrievedOn: '2026-09-09'
  citation: string
}

export interface EyeGlaucomaPathologyStep {
  id: string
  label: string
  mechanism: EyeGlaucomaMechanismKind
  anatomicalTargets: readonly string[]
  order: number
  evidence: readonly EyeGlaucomaEvidence[]
  representation: 'educational-pathology-contract'
  reviewStatus: 'academic-review-pending'
  patientSpecific: false
  clinicalInferenceAllowed: false
}

const PUBMED = (locator: string, citation: string): EyeGlaucomaEvidence => ({
  source: 'PubMed', locator, retrievedOn: '2026-09-09', citation,
})

export const EYE_GLAUCOMA_PATHOLOGY_WAVE7: readonly EyeGlaucomaPathologyStep[] = [
  {
    id: 'poag-outflow-resistance',
    label: 'Trabecular outflow resistance may increase in open-angle glaucoma',
    mechanism: 'open-angle-outflow-resistance',
    anatomicalTargets: ['trabecular-meshwork', 'juxtacanalicular-tissue', 'schlemm-canal'],
    order: 1,
    evidence: [
      PUBMED('PMID:19239914', 'The trabecular meshwork outflow pathways: structural and functional aspects.'),
      PUBMED('PMID:22101332', 'The role of TGF-beta in the pathogenesis of primary open-angle glaucoma.'),
    ],
    representation: 'educational-pathology-contract', reviewStatus: 'academic-review-pending',
    patientSpecific: false, clinicalInferenceAllowed: false,
  },
  {
    id: 'poag-optic-nerve-head-stress',
    label: 'Outflow resistance and tissue remodeling can contribute to optic nerve head stress',
    mechanism: 'optic-nerve-head-stress',
    anatomicalTargets: ['optic-disc', 'optic-nerve'],
    order: 2,
    evidence: [
      PUBMED('PMID:23586020', 'Integrins in trabecular meshwork and optic nerve head: possible association with glaucoma pathogenesis.'),
      PUBMED('PMID:27229292', 'Pro-fibrotic pathway activation in trabecular meshwork and lamina cribrosa in glaucoma.'),
    ],
    representation: 'educational-pathology-contract', reviewStatus: 'academic-review-pending',
    patientSpecific: false, clinicalInferenceAllowed: false,
  },
  {
    id: 'angle-closure-pupillary-block',
    label: 'Relative pupillary block can increase posterior-to-anterior chamber pressure difference and bow the iris forward',
    mechanism: 'pupillary-block-angle-closure',
    anatomicalTargets: ['posterior-chamber', 'pupil', 'iris', 'anterior-chamber', 'trabecular-meshwork'],
    order: 1,
    evidence: [
      PUBMED('PMID:7488801', 'Review of pupillary-block angle-closure mechanisms.'),
      PUBMED('PMID:19298900', 'Angle-closure glaucoma: the role of the lens in pathogenesis.'),
    ],
    representation: 'educational-pathology-contract', reviewStatus: 'academic-review-pending',
    patientSpecific: false, clinicalInferenceAllowed: false,
  },
] as const

export const EYE_GLAUCOMA_PATHOLOGY_BOUNDARY =
  'Generic educational pathology mapping only. Atlas state or user interaction must never be promoted to patient-specific clinical inference.'

export function validateEyeGlaucomaPathologyWave7(
  steps: readonly EyeGlaucomaPathologyStep[] = EYE_GLAUCOMA_PATHOLOGY_WAVE7,
): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  for (const step of steps) {
    if (ids.has(step.id)) errors.push(`duplicate:${step.id}`)
    ids.add(step.id)
    if (!step.label.trim() || step.anatomicalTargets.length === 0) errors.push(`identity:${step.id}`)
    if (step.evidence.length === 0 || step.evidence.some((item) => !item.locator.startsWith('PMID:'))) errors.push(`evidence:${step.id}`)
    if (step.representation !== 'educational-pathology-contract' || step.reviewStatus !== 'academic-review-pending') errors.push(`review:${step.id}`)
    if (step.patientSpecific || step.clinicalInferenceAllowed) errors.push(`unsafe:${step.id}`)
  }
  return errors
}
