export type ImagingSimulationId = 'cardiac-echo' | 'mammography'

export interface ImagingSimulationContract {
  id: ImagingSimulationId
  label: string
  representation: 'synthetic-acquisition-geometry'
  requiredViews: readonly string[]
  requiredModes: readonly string[]
  requiredAnatomy: readonly string[]
  requiredInteractions: readonly string[]
  syntheticOnly: true
  patientStudy: false
  diagnosticInferenceAllowed: false
  treatmentRecommendationAllowed: false
  automaticClinicalScoringAllowed: false
  boundary: string
}

export const CARDIAC_ECHO_SIMULATION: ImagingSimulationContract = {
  id: 'cardiac-echo',
  label: 'Cardiac echocardiography acquisition simulator',
  representation: 'synthetic-acquisition-geometry',
  requiredViews: ['PLAX', 'PSAX', 'A4C', 'A2C', 'A3C/A5C', 'Subcostal', 'IVC', 'Suprasternal'],
  requiredModes: ['2D/B-mode', 'M-mode', 'Color Doppler', 'PW Doppler', 'CW Doppler', 'Tissue Doppler'],
  requiredAnatomy: ['left ventricle', 'right ventricle', 'left atrium', 'right atrium', 'mitral valve', 'tricuspid valve', 'aortic valve', 'pulmonic valve', 'aorta', 'pericardium'],
  requiredInteractions: ['probe orientation', '3D slice-plane intersection', 'ECG-synchronized cardiac phase', 'valve motion', 'chamber-volume teaching overlay', 'regional wall-motion teaching overlay'],
  syntheticOnly: true,
  patientStudy: false,
  diagnosticInferenceAllowed: false,
  treatmentRecommendationAllowed: false,
  automaticClinicalScoringAllowed: false,
  boundary: 'Educational synthetic ultrasound acquisition only. It is not a patient echocardiogram, does not estimate a patient EF or hemodynamics, and does not diagnose structural or functional heart disease.',
}

export const MAMMOGRAPHY_SIMULATION: ImagingSimulationContract = {
  id: 'mammography',
  label: 'Mammography acquisition geometry simulator',
  representation: 'synthetic-acquisition-geometry',
  requiredViews: ['CC', 'MLO'],
  requiredModes: ['Synthetic X-ray projection', 'Compression/decompression timeline', 'Bilateral comparison teaching mode', 'Window/zoom/pan teaching mode'],
  requiredAnatomy: ['skin and nipple', 'adipose tissue', 'fibroglandular tissue', 'Cooper ligaments', 'duct-lobular system', 'axillary tail', 'pectoralis major on MLO', 'lymphatic context'],
  requiredInteractions: ['positioning geometry', 'compression geometry', '3D anatomy to 2D projection synchronization', 'density comparison teaching overlay', 'mass/asymmetry/distortion/calcification morphology teaching overlays'],
  syntheticOnly: true,
  patientStudy: false,
  diagnosticInferenceAllowed: false,
  treatmentRecommendationAllowed: false,
  automaticClinicalScoringAllowed: false,
  boundary: 'Educational synthetic mammography acquisition only. It is not a patient mammogram, does not assign BI-RADS, estimate malignancy probability, recommend biopsy, or replace clinical breast imaging review.',
}

export const REQUIRED_IMAGING_SIMULATIONS = [
  CARDIAC_ECHO_SIMULATION,
  MAMMOGRAPHY_SIMULATION,
] as const

export function imagingSimulationContractErrors(
  contract: ImagingSimulationContract,
): readonly string[] {
  const errors: string[] = []
  if (contract.requiredViews.length === 0) errors.push('missing-required-views')
  if (contract.requiredModes.length === 0) errors.push('missing-required-modes')
  if (contract.requiredAnatomy.length === 0) errors.push('missing-required-anatomy')
  if (contract.requiredInteractions.length === 0) errors.push('missing-required-interactions')
  if (!contract.syntheticOnly) errors.push('must-remain-synthetic-only')
  if (contract.patientStudy) errors.push('must-not-claim-patient-study')
  if (contract.diagnosticInferenceAllowed) errors.push('diagnostic-inference-forbidden')
  if (contract.treatmentRecommendationAllowed) errors.push('treatment-recommendation-forbidden')
  if (contract.automaticClinicalScoringAllowed) errors.push('automatic-clinical-scoring-forbidden')
  return errors
}

export const IMAGING_SIMULATION_BOUNDARY =
  'Synthetic acquisition simulators are separate from source-backed clinical imaging workspaces. They teach anatomy, acquisition geometry, modality physics and temporal relationships only; they must never be relabeled as patient scans, measured physiology, diagnosis, treatment guidance, or automated clinical scoring.' as const
