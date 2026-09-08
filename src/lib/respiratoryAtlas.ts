export type RespiratoryPhaseId =
  | 'end-expiration'
  | 'inspiration'
  | 'end-inspiration'
  | 'passive-expiration'

export interface RespiratoryInputs {
  respiratoryRate: number
  tidalVolumeMl: number
  deadSpaceMl: number
}

export interface RespiratoryMetrics {
  respiratoryRate: number
  tidalVolumeMl: number
  deadSpaceMl: number
  minuteVentilationLMin: number
  alveolarVentilationLMin: number
  deadSpaceVentilationLMin: number
  alveolarFractionPct: number
}

export interface RespiratoryPhase {
  id: RespiratoryPhaseId
  label: string
  cyclePosition: number
  diaphragm: string
  thorax: string
  pleuralPressure: string
  alveolarPressure: string
  airflow: string
  elasticRecoil: string
  teachingNote: string
  schematic: {
    lungScale: number
    diaphragmOffset: number
    airflowDirection: -1 | 0 | 1
  }
}

export const RESPIRATORY_REFERENCE_INPUTS: RespiratoryInputs = {
  respiratoryRate: 12,
  tidalVolumeMl: 500,
  deadSpaceMl: 150,
}

export const RESPIRATORY_MODEL_BOUNDARY =
  'Deterministic educational reference only. Inputs are not patient measurements, the schematic does not deform source anatomy, and outputs must not be used to diagnose disease, infer spirometry, prescribe ventilation, or estimate patient-specific work of breathing.'

export const RESPIRATORY_STRUCTURE_CHAIN = [
  'Respiratory drive',
  'Diaphragm + inspiratory muscles',
  'Thoracic cage',
  'Pleural pressure coupling',
  'Lung elastic recoil',
  'Conducting airways',
  'Alveolar ventilation',
] as const

export const RESPIRATORY_PHASES: readonly RespiratoryPhase[] = [
  {
    id: 'end-expiration',
    label: 'End expiration',
    cyclePosition: 0,
    diaphragm: 'Relaxed and relatively domed at functional residual capacity.',
    thorax: 'Reference resting thoracic volume before the next inspiration.',
    pleuralPressure: 'Negative relative to atmosphere; at the resting reference level.',
    alveolarPressure: 'Approximately atmospheric when airflow has paused.',
    airflow: 'Approximately zero at the transition between breaths.',
    elasticRecoil: 'Inward lung recoil is balanced by outward chest-wall tendency at the resting system volume.',
    teachingNote: 'This is a phase marker, not a claim that every breath begins at an identical absolute lung volume.',
    schematic: { lungScale: 0.9, diaphragmOffset: 0, airflowDirection: 0 },
  },
  {
    id: 'inspiration',
    label: 'Inspiration',
    cyclePosition: 0.25,
    diaphragm: 'Contracts and descends while inspiratory rib-cage expansion increases thoracic volume.',
    thorax: 'Volume rises as inspiratory muscles expand the thoracic cavity.',
    pleuralPressure: 'Becomes more negative during quiet inspiration.',
    alveolarPressure: 'Falls slightly below atmospheric pressure while air flows inward.',
    airflow: 'Into the lungs while the pressure gradient is inward.',
    elasticRecoil: 'Inward elastic recoil rises as lung volume increases.',
    teachingNote: 'The displayed motion is a schematic direction-of-change model; Panacea does not warp evidence-bearing anatomy to imitate breathing.',
    schematic: { lungScale: 1.04, diaphragmOffset: 8, airflowDirection: 1 },
  },
  {
    id: 'end-inspiration',
    label: 'End inspiration',
    cyclePosition: 0.5,
    diaphragm: 'Remains contracted near the end-inspiratory position before relaxation begins.',
    thorax: 'Near the upper volume reached by this illustrative tidal breath.',
    pleuralPressure: 'More negative than at end expiration in this quiet-breath teaching model.',
    alveolarPressure: 'Returns toward atmospheric pressure as inspiratory airflow approaches zero.',
    airflow: 'Approximately zero at the turning point of the tidal breath.',
    elasticRecoil: 'Higher inward elastic recoil now favors passive expiration when inspiratory activity falls.',
    teachingNote: 'No absolute pressure or lung volume is inferred from the source mesh or from slider position.',
    schematic: { lungScale: 1.08, diaphragmOffset: 10, airflowDirection: 0 },
  },
  {
    id: 'passive-expiration',
    label: 'Passive expiration',
    cyclePosition: 0.75,
    diaphragm: 'Relaxes and ascends as quiet inspiratory muscle activity falls.',
    thorax: 'Volume decreases toward the resting end-expiratory reference.',
    pleuralPressure: 'Becomes less negative than during inspiration.',
    alveolarPressure: 'Rises slightly above atmospheric pressure while air flows outward.',
    airflow: 'Out of the lungs while elastic recoil supplies the pressure gradient.',
    elasticRecoil: 'Stored elastic energy helps return the respiratory system toward its resting volume.',
    teachingNote: 'Forced expiration is different: active expiratory muscles and dynamic airway compression can become important.',
    schematic: { lungScale: 0.96, diaphragmOffset: 4, airflowDirection: -1 },
  },
] as const

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function normalizeRespiratoryInputs(input: RespiratoryInputs): RespiratoryInputs {
  const respiratoryRate = Math.round(clamp(
    finiteOr(input.respiratoryRate, RESPIRATORY_REFERENCE_INPUTS.respiratoryRate),
    4,
    40,
  ))
  const tidalVolumeMl = Math.round(clamp(
    finiteOr(input.tidalVolumeMl, RESPIRATORY_REFERENCE_INPUTS.tidalVolumeMl),
    150,
    1200,
  ))
  const requestedDeadSpace = Math.round(clamp(
    finiteOr(input.deadSpaceMl, RESPIRATORY_REFERENCE_INPUTS.deadSpaceMl),
    0,
    500,
  ))

  return {
    respiratoryRate,
    tidalVolumeMl,
    deadSpaceMl: Math.min(requestedDeadSpace, tidalVolumeMl),
  }
}

export function calculateRespiratoryMetrics(input: RespiratoryInputs): RespiratoryMetrics {
  const normalized = normalizeRespiratoryInputs(input)
  const minuteVentilationLMin = (normalized.respiratoryRate * normalized.tidalVolumeMl) / 1000
  const deadSpaceVentilationLMin = (normalized.respiratoryRate * normalized.deadSpaceMl) / 1000
  const alveolarVentilationLMin = Math.max(0, minuteVentilationLMin - deadSpaceVentilationLMin)
  const alveolarFractionPct = normalized.tidalVolumeMl > 0
    ? ((normalized.tidalVolumeMl - normalized.deadSpaceMl) / normalized.tidalVolumeMl) * 100
    : 0

  return {
    ...normalized,
    minuteVentilationLMin: round(minuteVentilationLMin),
    alveolarVentilationLMin: round(alveolarVentilationLMin),
    deadSpaceVentilationLMin: round(deadSpaceVentilationLMin),
    alveolarFractionPct: round(clamp(alveolarFractionPct, 0, 100), 1),
  }
}

export function respiratoryPhaseById(id: RespiratoryPhaseId): RespiratoryPhase {
  return RESPIRATORY_PHASES.find((phase) => phase.id === id) ?? RESPIRATORY_PHASES[0]
}
