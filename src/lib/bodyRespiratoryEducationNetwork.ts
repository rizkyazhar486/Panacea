export type RespiratoryRelationshipKind =
  | 'gas-exchange'
  | 'ventilation-perfusion'
  | 'pulmonary-vascular-response'
  | 'pathophysiology'

export type RespiratoryEvidenceSource = {
  pmid: string
  title: string
  year: number
  role: 'review-anchor'
}

export type RespiratoryEducationRelationship = {
  id: string
  from: string
  to: string
  kind: RespiratoryRelationshipKind
  statement: string
  sourcePmids: string[]
  educationalOnly: true
}

export const RESPIRATORY_EDUCATION_NETWORK = {
  systemId: 'respiratory',
  label: 'Respiratory gas exchange & perfusion',
  patientSpecific: false,
  clinicalDecisionSupport: false,
  provenanceBoundary:
    'Curated educational relationships summarize cited review literature. They do not encode patient anatomy, measured ventilation or perfusion, blood-gas values, diagnostic probability, oxygen or ventilator settings, treatment selection, or a claim that an atlas mesh contains microscopic structures it does not actually contain.',
  sources: [
    { pmid: '37816345', title: 'Gas Exchange in the Lung.', year: 2023, role: 'review-anchor' },
    { pmid: '25063240', title: 'Gas exchange and ventilation-perfusion relationships in the lung.', year: 2014, role: 'review-anchor' },
    { pmid: '27645688', title: 'Hypoxic Pulmonary Vasoconstriction: From Molecular Mechanisms to Medicine.', year: 2017, role: 'review-anchor' },
    { pmid: '27065169', title: 'Lung Structure and the Intrinsic Challenges of Gas Exchange.', year: 2016, role: 'review-anchor' },
  ] satisfies RespiratoryEvidenceSource[],
  relationships: [
    { id: 'alveolar-ventilation-gas-exchange', from: 'alveolar-unit', to: 'alveolar-gas-context', kind: 'gas-exchange', statement: 'Tidal ventilation renews alveolar gas and supports partial-pressure gradients that permit passive oxygen and carbon-dioxide exchange across the gas-exchange interface.', sourcePmids: ['37816345', '27065169'], educationalOnly: true },
    { id: 'alveolar-perfusion-vq-coupling', from: 'alveolar-unit', to: 'pulmonary-capillary-perfusion', kind: 'ventilation-perfusion', statement: 'Gas exchange depends on the relationship between alveolar ventilation and pulmonary blood flow; regional mismatch can impair arterial oxygenation or waste ventilation.', sourcePmids: ['37816345', '25063240'], educationalOnly: true },
    { id: 'low-vq-hypoxemia-context', from: 'low-vq-region', to: 'hypoxemia-context', kind: 'pathophysiology', statement: 'Low ventilation relative to perfusion is a mechanistic context for impaired arterial oxygenation, not a patient-level diagnosis or severity rule.', sourcePmids: ['37816345', '25063240'], educationalOnly: true },
    { id: 'shunt-hypoxemia-context', from: 'shunt-region', to: 'hypoxemia-context', kind: 'pathophysiology', statement: 'Perfusion of nonventilated gas-exchange units can contribute to hypoxemia and is educationally distinct from diffusion limitation or global hypoventilation.', sourcePmids: ['37816345', '25063240'], educationalOnly: true },
    { id: 'high-vq-dead-space-context', from: 'high-vq-region', to: 'alveolar-dead-space-context', kind: 'pathophysiology', statement: 'Ventilated units with little or no perfusion contribute to alveolar dead space and wasted ventilation.', sourcePmids: ['37816345', '25063240'], educationalOnly: true },
    { id: 'alveolar-hypoxia-hpv', from: 'alveolar-hypoxia-context', to: 'pulmonary-arterial-vasoconstriction', kind: 'pulmonary-vascular-response', statement: 'Local alveolar hypoxia can trigger hypoxic pulmonary vasoconstriction that redistributes pulmonary blood flow toward better-ventilated regions.', sourcePmids: ['27645688'], educationalOnly: true },
  ] satisfies RespiratoryEducationRelationship[],
} as const

export function getRespiratoryRelationships(structureId: string): RespiratoryEducationRelationship[] {
  if (structureId === 'alveolar-unit') {
    return RESPIRATORY_EDUCATION_NETWORK.relationships.filter(
      (edge) => edge.id === 'alveolar-ventilation-gas-exchange' || edge.id === 'alveolar-perfusion-vq-coupling',
    ) as RespiratoryEducationRelationship[]
  }
  return RESPIRATORY_EDUCATION_NETWORK.relationships.filter(
    (edge) => edge.from === structureId || edge.to === structureId,
  ) as RespiratoryEducationRelationship[]
}
