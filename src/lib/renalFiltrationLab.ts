export type RenalFiltrationInputs = {
  renalPlasmaFlow: number
  filtrationBarrier: number
  waterConservationDrive: number
}

export const RENAL_FILTRATION_DEFAULTS: RenalFiltrationInputs = {
  renalPlasmaFlow: 0.62,
  filtrationBarrier: 0.72,
  waterConservationDrive: 0.45,
}

export const RENAL_FILTRATION_EQUATIONS = [
  { expression: 'FF = GFR / RPF', meaning: 'Filtration fraction relates glomerular filtration rate to renal plasma flow; this workbench displays only normalized teaching signals.' },
  { expression: 'Filtered load = GFR × Pₓ', meaning: 'Filtered load is the amount of a freely filtered substance entering tubular fluid per unit time.' },
  { expression: 'Cₓ = Uₓ × V / Pₓ', meaning: 'Renal clearance relates urinary concentration and urine flow to plasma concentration for a substance.' },
] as const

export const RENAL_FILTRATION_PROVENANCE = [
  {
    source: 'PubMed',
    pmid: '11928770',
    citation: 'Newman DJ. Ann Clin Biochem. 2002;39(Pt 2):89-104.',
    supports: 'Glomerular filtration rate as a kidney-function construct and limitations of creatinine-based assessment.',
    reviewState: 'Published peer-reviewed review; not Panaceamed clinical validation or human review.',
  },
  {
    source: 'PubMed',
    pmid: '39552516',
    citation: 'St Peter WL, Bzowyckyj AS, Anderson-Haag T, et al. Am J Health Syst Pharm. 2025;82(12):644-659.',
    supports: 'Current clinical distinction between measured/estimated kidney filtration constructs and medication-related decision use; this simulator intentionally does not calculate clinical eGFR or dosing.',
    reviewState: 'Published consensus statement; not Panaceamed clinical validation or human review.',
  },
] as const

export const RENAL_FILTRATION_BOUNDARY =
  'Educational renal physiology model using synthetic dimensionless signals only. Outputs are not patient-specific measurements, eGFR, creatinine clearance, diagnosis, prognosis, medication dosing, dialysis settings, or treatment recommendations. The model is schematic and does not reconstruct nephron microanatomy.'

const clamp01 = (value: number) => Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0

export function normalizeRenalFiltrationInputs(input: Partial<RenalFiltrationInputs>): RenalFiltrationInputs {
  return {
    renalPlasmaFlow: clamp01(input.renalPlasmaFlow ?? RENAL_FILTRATION_DEFAULTS.renalPlasmaFlow),
    filtrationBarrier: clamp01(input.filtrationBarrier ?? RENAL_FILTRATION_DEFAULTS.filtrationBarrier),
    waterConservationDrive: clamp01(input.waterConservationDrive ?? RENAL_FILTRATION_DEFAULTS.waterConservationDrive),
  }
}

export type RenalFiltrationSignals = {
  perfusionSignal: number
  filtrationSignal: number
  tubularDeliverySignal: number
  relativeUrineFlowSignal: number
}

export function deriveRenalFiltration(raw: RenalFiltrationInputs): RenalFiltrationSignals {
  const input = normalizeRenalFiltrationInputs(raw)
  const perfusionSignal = input.renalPlasmaFlow
  const filtrationSignal = clamp01(input.renalPlasmaFlow * input.filtrationBarrier)
  const tubularDeliverySignal = filtrationSignal
  const relativeUrineFlowSignal = clamp01(tubularDeliverySignal * (1 - 0.85 * input.waterConservationDrive))
  return { perfusionSignal, filtrationSignal, tubularDeliverySignal, relativeUrineFlowSignal }
}
