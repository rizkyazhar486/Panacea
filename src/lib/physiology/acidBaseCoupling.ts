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
  // NBK308: Centor 1990, "Serum Total Carbon Dioxide", Clinical Methods (3rd ed.). Checked against its PubMed
  // record (PMID 21250150). The abstract supports the total-CO2/bicarbonate relation below; the chapter's own
  // statement of the 6.1 and 0.03 constants could not be re-checked against the full text, so it is not claimed.
  {
    id: 'ncbi-clinical-methods-total-co2',
    reference: 'NCBI Bookshelf NBK308',
    role: 'Clinical Methods chapter (Centor): serum total CO2 is mostly bicarbonate (about 95%) and is measured as its estimate.',
  },
  // NBK493167: Krishnaprasadh & Sharma, "Hypocarbia" (StatPearls).
  {
    id: 'statpearls-hypocarbia-2026',
    reference: 'NCBI Bookshelf NBK493167',
    role: 'Supports PaCO2 as the respiratory component and bicarbonate as the metabolic/renal component of the bicarbonate buffer system.',
  },
  // NBK536919: Castro & Zubair, "Arterial Blood Gas Analysis: Fundamentals, Interpretation, and Clinical Utility" (StatPearls).
  {
    id: 'statpearls-abg-2026',
    reference: 'NCBI Bookshelf NBK536919',
    role: 'Blood-gas analysers calculate bicarbonate from measured pH and PaCO2 with a form of the Henderson-Hasselbalch equation, while serum chemistry measures total CO2; the two are related but not silently interchangeable.',
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
