export type BodyProcedure4dId =
  | 'mechanical-ventilation'
  | 'fluid-resuscitation'
  | 'hemodialysis'
  | 'ecmo'
  | 'normal-vaginal-delivery'
  | 'endoscopy'
  | 'tracheal-intubation'
  | 'neonatal-resuscitation'

export type BodyProcedure4dLayer =
  | 'whole-body'
  | 'device-or-hands'
  | 'circuit-or-path'
  | 'anatomy'
  | 'biomechanics'
  | 'flow-pressure'
  | 'physiology'
  | 'tissue'
  | 'cell-membrane'
  | 'molecular-transport'
  | 'time-response'
  | 'complication-overlay'

export interface BodyProcedure4dModule {
  id: BodyProcedure4dId
  label: string
  representation: 'educational-4d-simulation-contract'
  reviewStatus: 'academic-review-pending'
  temporalModelRequired: true
  sourceControlledGeometryRequired: true
  patientSpecific: false
  clinicalInferenceAllowed: false
  treatmentRecommendationAllowed: false
  requiredLayers: readonly BodyProcedure4dLayer[]
  learningFocus: readonly string[]
  variants?: readonly string[]
}

const CORE_LAYERS = [
  'whole-body',
  'device-or-hands',
  'circuit-or-path',
  'anatomy',
  'biomechanics',
  'flow-pressure',
  'physiology',
  'time-response',
  'complication-overlay',
] as const satisfies readonly BodyProcedure4dLayer[]

export const BODY_PROCEDURE_4D_MODULES: readonly BodyProcedure4dModule[] = [
  {
    id: 'mechanical-ventilation', label: 'Mechanical ventilation 4D', representation: 'educational-4d-simulation-contract', reviewStatus: 'academic-review-pending', temporalModelRequired: true, sourceControlledGeometryRequired: true, patientSpecific: false, clinicalInferenceAllowed: false, treatmentRecommendationAllowed: false,
    requiredLayers: [...CORE_LAYERS, 'tissue', 'cell-membrane', 'molecular-transport'], learningFocus: ['airway-to-alveolus gas path', 'lung expansion over time', 'pressure-flow relationships', 'oxygen and carbon-dioxide exchange'],
  },
  {
    id: 'fluid-resuscitation', label: 'Fluid resuscitation 4D', representation: 'educational-4d-simulation-contract', reviewStatus: 'academic-review-pending', temporalModelRequired: true, sourceControlledGeometryRequired: true, patientSpecific: false, clinicalInferenceAllowed: false, treatmentRecommendationAllowed: false,
    requiredLayers: CORE_LAYERS, learningFocus: ['vascular path', 'intravascular and interstitial compartments', 'venous return', 'organ perfusion response over time'],
  },
  {
    id: 'hemodialysis', label: 'Hemodialysis 4D', representation: 'educational-4d-simulation-contract', reviewStatus: 'academic-review-pending', temporalModelRequired: true, sourceControlledGeometryRequired: true, patientSpecific: false, clinicalInferenceAllowed: false, treatmentRecommendationAllowed: false,
    requiredLayers: [...CORE_LAYERS, 'cell-membrane', 'molecular-transport'], learningFocus: ['vascular-access circuit', 'dialyzer membrane', 'counter-current dialysate path', 'diffusion and ultrafiltration concepts'],
  },
  {
    id: 'ecmo', label: 'Extracorporeal membrane oxygenation 4D', representation: 'educational-4d-simulation-contract', reviewStatus: 'academic-review-pending', temporalModelRequired: true, sourceControlledGeometryRequired: true, patientSpecific: false, clinicalInferenceAllowed: false, treatmentRecommendationAllowed: false,
    requiredLayers: [...CORE_LAYERS, 'cell-membrane', 'molecular-transport'], learningFocus: ['drainage-to-pump-to-oxygenator circuit', 'membrane gas exchange', 'return flow', 'interaction with native cardiopulmonary circulation'], variants: ['VV-ECMO', 'VA-ECMO'],
  },
  {
    id: 'normal-vaginal-delivery', label: 'Normal vaginal delivery 4D', representation: 'educational-4d-simulation-contract', reviewStatus: 'academic-review-pending', temporalModelRequired: true, sourceControlledGeometryRequired: true, patientSpecific: false, clinicalInferenceAllowed: false, treatmentRecommendationAllowed: false,
    requiredLayers: CORE_LAYERS, learningFocus: ['maternal pelvis and birth canal', 'cervical change over time', 'fetal descent and cardinal movements', 'pelvic-floor and perineal deformation'],
  },
  {
    id: 'endoscopy', label: 'Endoscopy 4D', representation: 'educational-4d-simulation-contract', reviewStatus: 'academic-review-pending', temporalModelRequired: true, sourceControlledGeometryRequired: true, patientSpecific: false, clinicalInferenceAllowed: false, treatmentRecommendationAllowed: false,
    requiredLayers: [...CORE_LAYERS, 'tissue'], learningFocus: ['lumen navigation', 'camera orientation', 'anatomic landmarks', 'wall and mucosal-layer context'], variants: ['upper-GI endoscopy', 'colonoscopy', 'bronchoscopy'],
  },
  {
    id: 'tracheal-intubation', label: 'Tracheal intubation 4D', representation: 'educational-4d-simulation-contract', reviewStatus: 'academic-review-pending', temporalModelRequired: true, sourceControlledGeometryRequired: true, patientSpecific: false, clinicalInferenceAllowed: false, treatmentRecommendationAllowed: false,
    requiredLayers: CORE_LAYERS, learningFocus: ['oral-airway anatomy', 'laryngeal visualization', 'tube path through the glottis', 'airway-to-lung ventilation path'], variants: ['direct laryngoscopy', 'video laryngoscopy'],
  },
  {
    id: 'neonatal-resuscitation', label: 'Neonatal resuscitation 4D', representation: 'educational-4d-simulation-contract', reviewStatus: 'academic-review-pending', temporalModelRequired: true, sourceControlledGeometryRequired: true, patientSpecific: false, clinicalInferenceAllowed: false, treatmentRecommendationAllowed: false,
    requiredLayers: CORE_LAYERS, learningFocus: ['fetal-to-neonatal cardiopulmonary transition', 'lung aeration', 'pulmonary and systemic flow transition', 'resuscitation physiology over time'],
  },
] as const

export const BODY_PROCEDURE_4D_BOUNDARY = {
  purpose: 'Generic educational visualization and simulation only.',
  patientSpecificInference: false,
  diagnosisAllowed: false,
  treatmentRecommendationAllowed: false,
  autonomousProcedureGuidanceAllowed: false,
  unreviewedClinicalPublicationAllowed: false,
  geometryFabricationAllowed: false,
} as const

export function getBodyProcedure4dModule(id: BodyProcedure4dId): BodyProcedure4dModule {
  const module = BODY_PROCEDURE_4D_MODULES.find((entry) => entry.id === id)
  if (!module) throw new Error(`Unknown 4D procedure module: ${id}`)
  return module
}
