export type RespiratoryGasExchangeInputs = {
  airwayRadius: number
  compliance: number
  ventilationDrive: number
  deadSpaceFraction: number
  perfusionMatch: number
  diffusionCapacity: number
  metabolicDemand: number
}

export const RESPIRATORY_GAS_EXCHANGE_DEFAULTS: RespiratoryGasExchangeInputs = {
  airwayRadius: 0.62,
  compliance: 0.58,
  ventilationDrive: 0.62,
  deadSpaceFraction: 0.28,
  perfusionMatch: 0.68,
  diffusionCapacity: 0.72,
  metabolicDemand: 0.42,
}

export const RESPIRATORY_TEACHING_EQUATIONS = [
  { expression: 'R ∝ 1 / r⁴', meaning: 'Idealized laminar-flow teaching relationship; real conducting-airway flow can depart from Poiseuille assumptions.' },
  { expression: 'C = ΔV / ΔP', meaning: 'Compliance is represented as volume change per pressure change.' },
  { expression: 'V̇A = (VT − VD) × f', meaning: 'Alveolar ventilation excludes dead-space volume from tidal volume.' },
  { expression: 'V̇A / Q̇', meaning: 'Ventilation-perfusion matching is represented directionally, not as a patient V/Q measurement.' },
] as const

export const RESPIRATORY_GAS_EXCHANGE_PROVENANCE = [
  {
    source: 'PubMed',
    pmid: '23648907',
    citation: 'Hogg JC, McDonough JE, Suzuki M. Chest. 2013;143(5):1436-1443.',
    supports: 'Airway narrowing increases resistance; the review discusses the idealized fourth-power radius relationship while emphasizing structural complexity in COPD.',
    reviewState: 'Published peer-reviewed review; not Panaceamed clinical validation.',
  },
] as const

export const RESPIRATORY_GAS_EXCHANGE_BOUNDARY =
  'Educational model using synthetic dimensionless signals only. It is not an anatomical reconstruction, patient measurement, diagnostic or prognostic model, treatment recommendation, prescription, or source of ventilator settings. The airway-resistance relation is an idealized schematic teaching approximation and does not claim laminar flow throughout the human respiratory tract.'

const clamp01 = (value: number) => Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0

export function normalizeRespiratoryInputs(input: Partial<RespiratoryGasExchangeInputs>): RespiratoryGasExchangeInputs {
  return {
    airwayRadius: clamp01(input.airwayRadius ?? RESPIRATORY_GAS_EXCHANGE_DEFAULTS.airwayRadius),
    compliance: clamp01(input.compliance ?? RESPIRATORY_GAS_EXCHANGE_DEFAULTS.compliance),
    ventilationDrive: clamp01(input.ventilationDrive ?? RESPIRATORY_GAS_EXCHANGE_DEFAULTS.ventilationDrive),
    deadSpaceFraction: clamp01(input.deadSpaceFraction ?? RESPIRATORY_GAS_EXCHANGE_DEFAULTS.deadSpaceFraction),
    perfusionMatch: clamp01(input.perfusionMatch ?? RESPIRATORY_GAS_EXCHANGE_DEFAULTS.perfusionMatch),
    diffusionCapacity: clamp01(input.diffusionCapacity ?? RESPIRATORY_GAS_EXCHANGE_DEFAULTS.diffusionCapacity),
    metabolicDemand: clamp01(input.metabolicDemand ?? RESPIRATORY_GAS_EXCHANGE_DEFAULTS.metabolicDemand),
  }
}

export type RespiratoryGasExchangeSignals = {
  relativeAirwayRadius: number
  airwayResistanceSignal: number
  alveolarVentilationSignal: number
  oxygenTransferSignal: number
  gasExchangeReserveSignal: number
  dominantConstraint: 'airway' | 'ventilation' | 'perfusion' | 'diffusion' | 'demand'
}

export function deriveRespiratoryGasExchange(raw: RespiratoryGasExchangeInputs): RespiratoryGasExchangeSignals {
  const input = normalizeRespiratoryInputs(raw)
  // Radius is floored only inside the inverse-fourth-power teaching transform to keep the synthetic signal finite.
  const radius = Math.max(0.08, input.airwayRadius)
  const inverseFourth = 1 / radius ** 4
  const referenceInverseFourth = 1 / 0.08 ** 4
  const airwayResistanceSignal = clamp01(inverseFourth / referenceInverseFourth)

  const effectiveTidalFraction = clamp01(input.compliance * input.ventilationDrive)
  const alveolarVentilationSignal = clamp01(effectiveTidalFraction * (1 - input.deadSpaceFraction) * input.airwayRadius)
  const oxygenTransferSignal = clamp01(alveolarVentilationSignal * input.perfusionMatch * input.diffusionCapacity)
  const gasExchangeReserveSignal = clamp01(oxygenTransferSignal * (1 - 0.75 * input.metabolicDemand))

  const constraints = {
    airway: input.airwayRadius,
    ventilation: alveolarVentilationSignal,
    perfusion: input.perfusionMatch,
    diffusion: input.diffusionCapacity,
    demand: 1 - input.metabolicDemand,
  } as const
  const dominantConstraint = (Object.entries(constraints) as Array<[keyof typeof constraints, number]>).reduce((lowest, current) => current[1] < lowest[1] ? current : lowest)[0]

  return {
    relativeAirwayRadius: input.airwayRadius,
    airwayResistanceSignal,
    alveolarVentilationSignal,
    oxygenTransferSignal,
    gasExchangeReserveSignal,
    dominantConstraint,
  }
}
