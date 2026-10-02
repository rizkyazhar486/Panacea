export type DoctorReviewChecklistStatus = 'open' | 'reviewed'

export interface DoctorReviewChecklistItem {
  id: string
  label: string
  detail: string
  required: boolean
}

export const DOCTOR_REVIEW_CHECKLIST: readonly DoctorReviewChecklistItem[] = [
  {
    id: 'source-provenance',
    label: 'Source & provenance checked',
    detail: 'Confirm the displayed source, timestamp, version, and evidence trail are understandable and internally consistent.',
    required: true,
  },
  {
    id: 'patient-vs-model',
    label: 'Patient truth is separated from AI/model output',
    detail: 'Confirm measured or recorded patient facts are visually distinct from AI drafts, simulations, estimates, and reference material.',
    required: true,
  },
  {
    id: 'uncertainty',
    label: 'Uncertainty is visible',
    detail: 'Confirm uncertain, missing, unsupported, or not-yet-examined information is stated explicitly instead of implied as fact.',
    required: true,
  },
  {
    id: 'clinical-context',
    label: 'Clinical context is coherent',
    detail: 'Check that age, timeline, history, examination context, units, and relevant clinical relationships are coherent.',
    required: true,
  },
  {
    id: 'safety-boundary',
    label: 'Safety boundary is visible',
    detail: 'Confirm the surface does not imply autonomous prescribing, diagnosis, procedure execution, or fabricated human verification.',
    required: true,
  },
  {
    id: 'anatomy-physiology',
    label: 'Anatomy / physiology representation reviewed when relevant',
    detail: 'For Body Exposure or simulation content, inspect localization, scale, mechanism, labels, and stated limitations.',
    required: false,
  },
  {
    id: 'usability',
    label: 'Clinical usability reviewed',
    detail: 'Check readability, terminology, navigation, mobile presentation, and whether important context is obscured.',
    required: false,
  },
  {
    id: 'notes',
    label: 'Review notes captured',
    detail: 'Record observations for the team. Review notes are feedback, not an approval or rejection decision.',
    required: false,
  },
] as const

export function requiredDoctorReviewItemIds() {
  return DOCTOR_REVIEW_CHECKLIST.filter((item) => item.required).map((item) => item.id)
}

export function doctorReviewIsComplete(checkedIds: ReadonlySet<string>) {
  return requiredDoctorReviewItemIds().every((id) => checkedIds.has(id))
}
