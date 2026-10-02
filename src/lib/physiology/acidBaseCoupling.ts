export type AcidBaseBicarbonateSource =
  | 'arterial-blood-gas-bicarbonate'
  | 'serum-total-co2-surrogate'

export interface AcidBaseCouplingInput {
  bicarbonateMmolL: number
  bicarbonateSource: AcidBaseBicarbonateSource
  arterialPaco2MmHg: number
}

export interface AcidBaseCouplingResult {
  pH: number
  bicarbonateMmolL: number
  arterialPaco2MmHg: number
  respiratoryComponent: number
  metabolicComponent: number
  truthClass: 'model-derived'
}

export const ACID_BASE_COUPLING_EVIDENCE = [
  {
    id: 'ncbi-clinical-methods-total-co2',
    reference: 'NCBI Bookshelf NBK308',
    role: 'Supports Henderson-Hasselbalch pH = 6.1 + log10(HCO3- / (0.03 × pCO2)) and identifies 6.1 and 0.03 as the conventional blood-buffer constants used in this form.',
  },
  {
    id: 'statpearls-hypocarbia-2026',
    reference: 'NCBI Bookshelf NBK493167',
    role: 'Supports PaCO2 as the respiratory component and bicarbonate as the metabolic/renal component of the bicarbonate buffer system.',
  },
  {
    id: 'statpearls-abg-2026',
    reference: 'NCBI Bookshelf NBK536919',
    role: 'Supports the distinction between calculated blood-gas bicarbonate and chemistry total CO2; they are related but not silently interchangeable.',
  },
] as const

export const ACID_BASE_COUPLING_BOUNDARY =
  'Educational equilibrium calculation only. It couples an explicitly supplied bicarbonate concentration to measured arterial PaCO2 through Henderson-Hasselbalch. Serum total CO2 is not silently substituted for bicarbonate. The result is model-derived and does not diagnose a primary or mixed acid-base disorder, infer compensation, select treatment, or replace arterial blood-gas interpretation. The conventional pKa 6.1 and CO2 solubility coefficient 0.03 assume the standard blood-buffer approximation near 37 °C.'

const PKA = 6.1
const CO2_SOLUBILITY_MMOL_L_PER_MMHG = 0.03

function requirePositiveFinite(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`acid-base coupling input: ${label} must be a positive finite number`)
  }
}

export function deriveAcidBaseCoupling(input: AcidBaseCouplingInput): AcidBaseCouplingResult {
  if (input.bicarbonateSource !== 'arterial-blood-gas-bicarbonate') {
    throw new Error('acid-base coupling requires explicit bicarbonate; serum total CO2 cannot be silently substituted')
  }

  requirePositiveFinite(input.bicarbonateMmolL, 'bicarbonate')
  requirePositiveFinite(input.arterialPaco2MmHg, 'arterial PaCO2')

  const respiratoryComponent =
    CO2_SOLUBILITY_MMOL_L_PER_MMHG * input.arterialPaco2MmHg
  const metabolicComponent = input.bicarbonateMmolL
  const pH = PKA + Math.log10(metabolicComponent / respiratoryComponent)

  if (!Number.isFinite(pH)) {
    throw new Error('acid-base coupling produced a non-finite pH')
  }

  return {
    pH,
    bicarbonateMmolL: input.bicarbonateMmolL,
    arterialPaco2MmHg: input.arterialPaco2MmHg,
    respiratoryComponent,
    metabolicComponent,
    truthClass: 'model-derived',
  }
}

export const ACID_BASE_COUPLING_CONSTANTS = {
  pKa: PKA,
  co2SolubilityMmolLPerMmHg: CO2_SOLUBILITY_MMOL_L_PER_MMHG,
} as const
