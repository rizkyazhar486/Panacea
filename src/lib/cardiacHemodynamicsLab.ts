export type CardiacPhaseId = 'ventricular-filling' | 'isovolumic-contraction' | 'ejection' | 'isovolumic-relaxation'

export interface CardiacPhase {
  id: CardiacPhaseId
  label: string
  mitralState: 'open' | 'closed'
  aorticState: 'open' | 'closed'
  pressureDirection: 'rising' | 'falling' | 'low-variable' | 'high-variable'
  volumeDirection: 'rising' | 'falling' | 'fixed'
  teachingPoint: string
}

export interface CardiacTeachingRelationship { id: string; expression: string; meaning: string; boundary: string }
export interface SyntheticCardiacInput { preload: number; afterload: number; contractility: number; heartRate: number; lusitropy: number }
export interface SyntheticCardiacState { strokeVolumeSignal: number; fillingPressureSignal: number; ejectionPressureSignal: number; cardiacOutputSignal: number; myocardialWorkSignal: number; diastolicPerfusionOpportunity: number; endDiastolicVolumeSignal: number; endSystolicVolumeSignal: number }
export interface CardiacPvPoint { id: 'end-diastole' | 'aortic-open' | 'end-systole' | 'mitral-open'; label: string; volume: number; pressure: number }
export interface CardiacEvidenceAnchor { pmid: string; title: string; role: string; url: string }

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

export const CARDIAC_PHASES: readonly CardiacPhase[] = [
  { id: 'ventricular-filling', label: 'Ventricular filling', mitralState: 'open', aorticState: 'closed', pressureDirection: 'low-variable', volumeDirection: 'rising', teachingPoint: 'Ventricular volume rises during diastolic filling while ventricular pressure remains comparatively low; atrial pressure and ventricular relaxation influence filling.' },
  { id: 'isovolumic-contraction', label: 'Isovolumic contraction', mitralState: 'closed', aorticState: 'closed', pressureDirection: 'rising', volumeDirection: 'fixed', teachingPoint: 'After atrioventricular-valve closure, ventricular pressure rises rapidly while both inlet and outlet valves remain closed, so ventricular volume is approximately fixed.' },
  { id: 'ejection', label: 'Ventricular ejection', mitralState: 'closed', aorticState: 'open', pressureDirection: 'high-variable', volumeDirection: 'falling', teachingPoint: 'Once ventricular pressure exceeds outflow pressure, the semilunar valve opens and ventricular volume falls as blood is ejected into the arterial circulation.' },
  { id: 'isovolumic-relaxation', label: 'Isovolumic relaxation', mitralState: 'closed', aorticState: 'closed', pressureDirection: 'falling', volumeDirection: 'fixed', teachingPoint: 'After semilunar-valve closure, ventricular pressure falls while both valves are closed until ventricular pressure drops sufficiently for atrioventricular-valve opening.' },
] as const

export const CARDIAC_TEACHING_RELATIONSHIPS: readonly CardiacTeachingRelationship[] = [
  { id: 'cardiac-output', expression: 'CO = HR × SV', meaning: 'Cardiac output is the product of heart rate and stroke volume.', boundary: 'Identity shown for physiology teaching only; the synthetic workbench does not calculate a patient cardiac output.' },
  { id: 'stroke-volume', expression: 'SV = EDV − ESV', meaning: 'Stroke volume is the difference between end-diastolic and end-systolic ventricular volumes.', boundary: 'Volume signals in this workbench are normalized teaching values, not measured milliliters.' },
  { id: 'ejection-fraction', expression: 'EF = (SV / EDV) × 100%', meaning: 'Ejection fraction expresses stroke volume as a fraction of end-diastolic volume.', boundary: 'No synthetic output is presented as a clinical ejection fraction or used to classify heart failure.' },
  { id: 'wall-stress', expression: 'wall stress ∝ P × r / (2h)', meaning: 'A Laplace-style relationship illustrates why pressure and chamber radius increase wall stress while greater wall thickness reduces it.', boundary: 'Conceptual geometry relationship only; it is not a ventricular stress calculation for an individual patient.' },
  { id: 'coronary-perfusion', expression: 'left-coronary perfusion pressure concept ≈ aortic diastolic pressure − LV end-diastolic pressure', meaning: 'A simplified pressure-gradient concept explains why diastolic aortic pressure and ventricular filling pressure both matter for left-coronary perfusion.', boundary: 'This relationship is educational and does not estimate myocardial ischemia, coronary flow, or treatment thresholds.' },
] as const

export const CARDIAC_HEMODYNAMICS_EVIDENCE: readonly CardiacEvidenceAnchor[] = [
  { pmid: '26436838', title: 'Cardiac Pressure-Volume Loop Analysis Using Conductance Catheters in Mice', role: 'Supports pressure-volume loops as a framework for relating ventricular pressure, volume, preload, afterload and measures of systolic/diastolic function.', url: 'https://pubmed.ncbi.nlm.nih.gov/26436838/' },
  { pmid: '27598497', title: 'Ventricular contractility: Physiology and clinical projection', role: 'Supports the teaching separation of intrinsic contractility from preload and afterload effects on ventricular ejection and pressure-volume behavior.', url: 'https://pubmed.ncbi.nlm.nih.gov/27598497/' },
  { pmid: '3276755', title: 'Influence of altered inotropy and lusitropy on ventricular pressure-volume loops', role: 'Supports the conceptual effects of inotropy, lusitropy, preload and afterload on pressure-volume loop geometry and ventricular work.', url: 'https://pubmed.ncbi.nlm.nih.gov/3276755/' },
] as const

export const CARDIAC_HEMODYNAMICS_BOUNDARY = 'Educational cardiovascular physiology sandbox only. All slider outputs are normalized synthetic signals. The workbench does not measure or estimate patient ejection fraction, cardiac output, filling pressure, ischemia, valve disease, shock state, treatment response, or procedural eligibility.'

export function simulateSyntheticCardiacHemodynamics(input: SyntheticCardiacInput): SyntheticCardiacState {
  const preload = clamp01(input.preload), afterload = clamp01(input.afterload), contractility = clamp01(input.contractility), heartRate = clamp01(input.heartRate), lusitropy = clamp01(input.lusitropy)
  const endDiastolicVolumeSignal = clamp01(0.20 + preload * 0.62 + lusitropy * 0.08 - heartRate * 0.10)
  const strokeVolumeSignal = clamp01(0.14 + preload * 0.34 + contractility * 0.42 - afterload * 0.27 - heartRate * 0.05)
  const endSystolicVolumeSignal = clamp01(endDiastolicVolumeSignal - strokeVolumeSignal * 0.72 + afterload * 0.16 - contractility * 0.12)
  const fillingPressureSignal = clamp01(0.10 + preload * 0.50 + afterload * 0.12 - lusitropy * 0.18 + heartRate * 0.05)
  const ejectionPressureSignal = clamp01(0.16 + afterload * 0.48 + contractility * 0.30 + preload * 0.08)
  const cardiacOutputSignal = clamp01(0.10 + heartRate * 0.48 + strokeVolumeSignal * 0.48)
  const myocardialWorkSignal = clamp01(0.08 + ejectionPressureSignal * 0.34 + strokeVolumeSignal * 0.28 + heartRate * 0.22)
  const diastolicPerfusionOpportunity = clamp01(0.70 + lusitropy * 0.12 - heartRate * 0.34 - fillingPressureSignal * 0.20)
  return { strokeVolumeSignal, fillingPressureSignal, ejectionPressureSignal, cardiacOutputSignal, myocardialWorkSignal, diastolicPerfusionOpportunity, endDiastolicVolumeSignal, endSystolicVolumeSignal }
}

export function buildSyntheticPvLoop(input: SyntheticCardiacInput): readonly CardiacPvPoint[] {
  const state = simulateSyntheticCardiacHemodynamics(input)
  const edv = 0.50 + state.endDiastolicVolumeSignal * 0.42
  const esv = Math.max(0.10, edv - 0.18 - state.strokeVolumeSignal * 0.40)
  const lowPressure = 0.09 + state.fillingPressureSignal * 0.18
  const highPressure = 0.38 + state.ejectionPressureSignal * 0.52
  return [
    { id: 'end-diastole', label: 'End diastole / mitral closes', volume: edv, pressure: lowPressure },
    { id: 'aortic-open', label: 'Aortic valve opens', volume: edv, pressure: highPressure * 0.72 },
    { id: 'end-systole', label: 'End systole / aortic closes', volume: esv, pressure: highPressure },
    { id: 'mitral-open', label: 'Mitral valve opens', volume: esv, pressure: lowPressure * 0.72 },
  ]
}
