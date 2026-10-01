export interface CerebralPerfusionInput {
  meanArterialPressureMmHg: number
  intracranialPressureMmHg: number
}

export interface CerebralPerfusionResult {
  cerebralPerfusionPressureMmHg: number
  pressureGradientDirection: 'arterial-to-intracranial' | 'non-positive'
  truthClass: 'model-derived'
}

export const CEREBRAL_PERFUSION_EVIDENCE = [
  {
    id: 'statpearls-cpp',
    reference: 'NCBI Bookshelf NBK537271',
    role: 'Supports cerebral perfusion pressure as the pressure gradient approximated by mean arterial pressure minus intracranial pressure.',
  },
  {
    id: 'statpearls-icp',
    reference: 'NCBI Bookshelf NBK482119',
    role: 'Supports intracranial pressure physiology and the Monro-Kellie volume constraint as context for pressure-mediated cerebral perfusion.',
  },
] as const

export const CEREBRAL_PERFUSION_BOUNDARY =
  'Educational pressure-gradient model only. CPP = MAP − ICP is an approximation and is not equivalent to cerebral blood flow or oxygen delivery. The model does not infer autoregulatory reserve, vascular resistance, regional perfusion, herniation, traumatic brain injury severity, treatment thresholds, prognosis, or patient-specific management. It does not assume a universal autoregulatory plateau.'

function requireNonNegativeFinite(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`cerebral perfusion input: ${label} must be a non-negative finite number`)
  }
}

export function deriveCerebralPerfusionPressure(
  input: CerebralPerfusionInput,
): CerebralPerfusionResult {
  requireNonNegativeFinite(input.meanArterialPressureMmHg, 'mean arterial pressure')
  requireNonNegativeFinite(input.intracranialPressureMmHg, 'intracranial pressure')

  const cerebralPerfusionPressureMmHg =
    input.meanArterialPressureMmHg - input.intracranialPressureMmHg

  return {
    cerebralPerfusionPressureMmHg,
    pressureGradientDirection:
      cerebralPerfusionPressureMmHg > 0
        ? 'arterial-to-intracranial'
        : 'non-positive',
    truthClass: 'model-derived',
  }
}
