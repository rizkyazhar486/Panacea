export interface RespiratoryGasExchangeInputs {
  airwayRadius: number
  compliance: number
  ventilationDrive: number
  perfusionMatch: number
  diffusionCapacity: number
  metabolicDemand: number
}

export interface RespiratoryGasExchangeOutputs {
  relativeAirwayRadius: number
  airwayResistanceSignal: number
  alveolarVentilationSignal: number
  vqMatchingSignal: number
  diffusionSignal: number
  oxygenTransferSignal: number
  co2ClearanceSignal: number
  workOfBreathingSignal: number
  gasExchangeReserveSignal: number
  dominantConstraint: 'airway-resistance' | 'mechanical-compliance' | 'ventilation-perfusion' | 'diffusion' | 'metabolic-demand' | 'balanced'
}

export interface RespiratoryTeachingEquation {
  expression: string
  label: string
  note: string
}

export interface RespiratoryEvidenceRef {
  pmid: string
  title: string
  year: number
  url: string
  role: string
}

export const RESPIRATORY_GAS_EXCHANGE_DEFAULTS: RespiratoryGasExchangeInputs = {
  airwayRadius: 0.56,
  compliance: 0.62,
  ventilationDrive: 0.56,
  perfusionMatch: 0.72,
  diffusionCapacity: 0.76,
  metabolicDemand: 0.52,
}

export const RESPIRATORY_GAS_EXCHANGE_BOUNDARY =
  'Normalized respiratory physiology teaching only. Inputs and outputs are synthetic dimensionless signals; this lab does not calculate spirometry, airway pressure, blood gas values, oxygen saturation, measured V/Q, shunt fraction, dead-space fraction, diffusion capacity, respiratory-failure severity, diagnosis, prognosis, treatment response, ventilator settings, oxygen prescription, bronchodilator response, or patient-specific clinical decisions.'

export const RESPIRATORY_TEACHING_EQUATIONS: readonly RespiratoryTeachingEquation[] = [
  {
    expression: 'R ∝ 1 / r⁴',
    label: 'Idealized Poiseuille radius relationship',
    note: 'For idealized laminar flow, resistance is highly sensitive to radius. Human airways are branching, deformable and can contain transitional or turbulent flow, so this is a teaching relationship rather than a bedside airway calculation.',
  },
  {
    expression: 'C = ΔV / ΔP',
    label: 'Respiratory-system compliance',
    note: 'Compliance relates volume change to pressure change. The simulator uses only a normalized compliance control and never derives a patient pressure-volume curve.',
  },
  {
    expression: 'V̇A = (VT − VD) × f',
    label: 'Alveolar ventilation identity',
    note: 'Alveolar ventilation depends on the portion of each breath reaching gas-exchanging units and breathing frequency. No patient tidal volume, dead-space volume or respiratory rate is entered or calculated here.',
  },
  {
    expression: 'V̇A / Q̇',
    label: 'Ventilation/perfusion relationship',
    note: 'Regional gas exchange depends on matching ventilation to blood flow. Low V/Q and shunt-like states differ conceptually from high V/Q / dead-space-like states; the UI compresses this to a bounded matching signal for education.',
  },
  {
    expression: 'gas transfer ∝ area × gradient × diffusivity / thickness',
    label: 'Fick-style diffusion concept',
    note: 'A conceptual membrane-diffusion relationship only. It does not estimate DLCO, alveolar-capillary membrane thickness, oxygen gradient or measured gas transfer.',
  },
] as const

export const RESPIRATORY_EVIDENCE: readonly RespiratoryEvidenceRef[] = [
  {
    pmid: '25063240',
    title: 'Gas exchange and ventilation-perfusion relationships in the lung.',
    year: 2014,
    url: 'https://pubmed.ncbi.nlm.nih.gov/25063240/',
    role: 'Review anchor for regional V/Q relationships, shunt/low-V/Q physiology, high-V/Q/dead-space physiology and their differing effects on oxygenation and CO₂ elimination efficiency.',
  },
  {
    pmid: '37816345',
    title: 'Gas Exchange in the Lung.',
    year: 2023,
    url: 'https://pubmed.ncbi.nlm.nih.gov/37816345/',
    role: 'Review anchor for tidal ventilation, alveolar gas renewal, passive diffusion and mechanisms that impair gas exchange.',
  },
  {
    pmid: '31390642',
    title: 'Pulmonary Embolism and Gas Exchange.',
    year: 2019,
    url: 'https://pubmed.ncbi.nlm.nih.gov/31390642/',
    role: 'Systems anchor showing how heterogeneous pulmonary perfusion can disturb V/Q matching and gas exchange.',
  },
] as const

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

export function normalizeRespiratoryInputs(inputs: Partial<RespiratoryGasExchangeInputs> = {}): RespiratoryGasExchangeInputs {
  return {
    airwayRadius: clamp01(inputs.airwayRadius ?? RESPIRATORY_GAS_EXCHANGE_DEFAULTS.airwayRadius),
    compliance: clamp01(inputs.compliance ?? RESPIRATORY_GAS_EXCHANGE_DEFAULTS.compliance),
    ventilationDrive: clamp01(inputs.ventilationDrive ?? RESPIRATORY_GAS_EXCHANGE_DEFAULTS.ventilationDrive),
    perfusionMatch: clamp01(inputs.perfusionMatch ?? RESPIRATORY_GAS_EXCHANGE_DEFAULTS.perfusionMatch),
    diffusionCapacity: clamp01(inputs.diffusionCapacity ?? RESPIRATORY_GAS_EXCHANGE_DEFAULTS.diffusionCapacity),
    metabolicDemand: clamp01(inputs.metabolicDemand ?? RESPIRATORY_GAS_EXCHANGE_DEFAULTS.metabolicDemand),
  }
}

function dominantConstraint(inputs: RespiratoryGasExchangeInputs, resistance: number): RespiratoryGasExchangeOutputs['dominantConstraint'] {
  const constraints = [
    ['airway-resistance', resistance] as const,
    ['mechanical-compliance', 1 - inputs.compliance] as const,
    ['ventilation-perfusion', 1 - inputs.perfusionMatch] as const,
    ['diffusion', 1 - inputs.diffusionCapacity] as const,
    ['metabolic-demand', inputs.metabolicDemand * 0.78] as const,
  ]
  const [name, severity] = constraints.reduce((highest, current) => current[1] > highest[1] ? current : highest)
  return severity < 0.36 ? 'balanced' : name
}

export function deriveRespiratoryGasExchange(inputsLike: Partial<RespiratoryGasExchangeInputs> = {}): RespiratoryGasExchangeOutputs {
  const inputs = normalizeRespiratoryInputs(inputsLike)

  // Maps the synthetic 0–1 radius control to the same 0.65×–1.35× teaching range used by the earlier breathing prototype.
  const relativeAirwayRadius = 0.65 + inputs.airwayRadius * 0.70
  const rawResistance = 1 / Math.pow(relativeAirwayRadius, 4)
  const minimumResistance = 1 / Math.pow(1.35, 4)
  const maximumResistance = 1 / Math.pow(0.65, 4)
  const airwayResistanceSignal = clamp01((rawResistance - minimumResistance) / (maximumResistance - minimumResistance))

  const complianceEfficiency = 0.20 + inputs.compliance * 0.80
  const airwayPatency = 1 - airwayResistanceSignal
  const alveolarVentilationSignal = clamp01(
    0.12 +
    inputs.ventilationDrive * 0.52 +
    complianceEfficiency * 0.20 +
    airwayPatency * 0.20 -
    airwayResistanceSignal * 0.10,
  )

  const vqMatchingSignal = inputs.perfusionMatch
  const diffusionSignal = inputs.diffusionCapacity

  // These are bounded directional teaching signals, not physical units or validated physiologic estimators.
  const matchedExchange = alveolarVentilationSignal * (0.35 + 0.65 * vqMatchingSignal)
  const oxygenTransferSignal = clamp01(matchedExchange * (0.42 + 0.58 * diffusionSignal))
  const co2ClearanceSignal = clamp01(alveolarVentilationSignal * (0.62 + 0.38 * vqMatchingSignal))
  const workOfBreathingSignal = clamp01(
    0.50 * airwayResistanceSignal +
    0.32 * (1 - inputs.compliance) +
    0.18 * inputs.ventilationDrive,
  )
  const gasExchangeReserveSignal = clamp01(
    0.10 +
    oxygenTransferSignal * 0.52 +
    co2ClearanceSignal * 0.28 +
    inputs.compliance * 0.10 -
    inputs.metabolicDemand * 0.44,
  )

  return {
    relativeAirwayRadius,
    airwayResistanceSignal,
    alveolarVentilationSignal,
    vqMatchingSignal,
    diffusionSignal,
    oxygenTransferSignal,
    co2ClearanceSignal,
    workOfBreathingSignal,
    gasExchangeReserveSignal,
    dominantConstraint: dominantConstraint(inputs, airwayResistanceSignal),
  }
}

export function respiratoryPercent(value: number): number {
  return Math.round(clamp01(value) * 100)
}
