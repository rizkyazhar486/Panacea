import {
  DEFAULT_OXYGEN_CONTENT_CONVENTION,
  oxygenContentMlDl,
  type OxygenContentConventionId,
} from './oxygenContentConventions.ts'

export type VenousOxygenSamplingSite =
  | 'mixed-venous-pulmonary-artery'
  | 'central-venous'
  | 'peripheral-venous'

export interface FickOxygenExtractionInput {
  cardiacOutputLMin: number
  hemoglobinGdl: number
  arterialSaturationFraction: number
  arterialPo2MmHg: number
  venousSaturationFraction: number
  venousPo2MmHg: number
  venousSamplingSite: VenousOxygenSamplingSite
  conventionId?: OxygenContentConventionId
}

export interface FickOxygenExtractionResult {
  conventionId: OxygenContentConventionId
  arterialOxygenContentMlDl: number
  mixedVenousOxygenContentMlDl: number
  arteriovenousDifferenceMlDl: number
  systemicOxygenConsumptionMlMin: number
  oxygenExtractionRatio: number
  truthClass: 'model-derived'
}

export const FICK_OXYGEN_EXTRACTION_EVIDENCE = [
  {
    id: 'ncbi-fick-2024',
    reference: 'NCBI Bookshelf NBK606091',
    role: 'Supports the steady-state Fick mass-balance relationship between cardiac output, oxygen consumption, and arterial-minus-venous oxygen content.',
  },
  {
    id: 'ncbi-po2-2026',
    reference: 'NCBI Bookshelf NBK493219',
    role: 'Supports systemic VO2 = CO × (CaO2 − CvO2) and the distinction between mixed venous and central venous oxygen content.',
  },
] as const

export const FICK_OXYGEN_EXTRACTION_BOUNDARY =
  'Steady-state physiology model only. Quantitative systemic extraction requires mixed venous blood from the pulmonary artery; central or peripheral venous oxygen values are not silently substituted. Outputs are model-derived mass-balance quantities, not patient diagnosis, shock classification, treatment thresholds, or proof of tissue-level oxygen utilization. Dynamic exercise, intracardiac/pulmonary shunt, rapidly changing oxygen consumption, and lung oxygen consumption require additional models.'

function requireFinitePositive(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Fick oxygen extraction input: ${label} must be a positive finite number`)
  }
}

export function deriveFickOxygenExtraction(
  input: FickOxygenExtractionInput,
): FickOxygenExtractionResult {
  if (input.venousSamplingSite !== 'mixed-venous-pulmonary-artery') {
    throw new Error('Fick oxygen extraction requires mixed venous pulmonary-artery sampling; central/peripheral venous values are not interchangeable')
  }

  requireFinitePositive(input.cardiacOutputLMin, 'cardiac output')
  requireFinitePositive(input.hemoglobinGdl, 'hemoglobin')

  const conventionId = input.conventionId ?? DEFAULT_OXYGEN_CONTENT_CONVENTION
  const arterialOxygenContentMlDl = oxygenContentMlDl(
    conventionId,
    { value: input.hemoglobinGdl, unit: 'g/dL' },
    input.arterialSaturationFraction,
    input.arterialPo2MmHg,
  )
  const mixedVenousOxygenContentMlDl = oxygenContentMlDl(
    conventionId,
    { value: input.hemoglobinGdl, unit: 'g/dL' },
    input.venousSaturationFraction,
    input.venousPo2MmHg,
  )

  if (!(arterialOxygenContentMlDl > 0)) {
    throw new Error('Fick oxygen extraction requires positive arterial oxygen content')
  }

  const rawDifference = arterialOxygenContentMlDl - mixedVenousOxygenContentMlDl
  if (rawDifference < -1e-12) {
    throw new Error('Fick oxygen extraction unsupported state: mixed venous oxygen content exceeds arterial oxygen content')
  }

  const arteriovenousDifferenceMlDl = Math.max(0, rawDifference)
  const systemicOxygenConsumptionMlMin =
    input.cardiacOutputLMin * arteriovenousDifferenceMlDl * 10
  const oxygenExtractionRatio =
    arteriovenousDifferenceMlDl / arterialOxygenContentMlDl

  return {
    conventionId,
    arterialOxygenContentMlDl,
    mixedVenousOxygenContentMlDl,
    arteriovenousDifferenceMlDl,
    systemicOxygenConsumptionMlMin,
    oxygenExtractionRatio,
    truthClass: 'model-derived',
  }
}
